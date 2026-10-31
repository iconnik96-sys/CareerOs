import os
import re
import logging
import threading
from contextlib import contextmanager
from typing import Optional, Dict, Any, List, Tuple
from urllib.parse import urlparse

logger = logging.getLogger("Database")

# ====================================================================
# Environment & Configuration Resolution
# ====================================================================
ENVIRONMENT = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development")).lower().strip()
IS_PRODUCTION = ENVIRONMENT in ("production", "prod")

_pool_lock = threading.Lock()
_connection_pool = None


def mask_connection_string(conn_str: str) -> str:
    """Masks password in connection string for safe diagnostic logging."""
    if not conn_str:
        return "<unconfigured>"
    return re.sub(r":([^:@]+)@", r":****@", conn_str)


def get_database_url() -> Optional[str]:
    """
    Resolves the PostgreSQL connection string from supported environment variables.
    Supports DATABASE_URL, SUPABASE_DB_URL, POSTGRES_URL, or discrete PG* parameters.
    """
    direct_url = (
        os.getenv("DATABASE_URL")
        or os.getenv("SUPABASE_DB_URL")
        or os.getenv("POSTGRES_URL")
    )
    if direct_url and direct_url.strip():
        url = direct_url.strip()
        # Ensure postgresql:// prefix (some providers use postgres://)
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://"):]
        return url

    # Discrete parameters fallback
    host = os.getenv("PGHOST")
    if host:
        user = os.getenv("PGUSER", "postgres")
        password = os.getenv("PGPASSWORD", "")
        port = os.getenv("PGPORT", "5432")
        dbname = os.getenv("PGDATABASE", "postgres")
        sslmode = os.getenv("PGSSLMODE", "require")
        return f"postgresql://{user}:{password}@{host}:{port}/{dbname}?sslmode={sslmode}"

    return None


def is_db_configured() -> bool:
    """Checks whether database connection parameters are present."""
    return get_database_url() is not None


def get_pool():
    """Initializes and returns the thread-safe connection pool."""
    global _connection_pool
    if _connection_pool is not None:
        return _connection_pool

    with _pool_lock:
        if _connection_pool is not None:
            return _connection_pool

        db_url = get_database_url()
        if not db_url:
            return None

        try:
            import psycopg2
            from psycopg2 import pool

            # Parse and configure SSL and statement timeouts
            parsed = urlparse(db_url)
            sslmode = "require" if "supabase" in (parsed.hostname or "").lower() else "prefer"

            logger.info(f"Initializing PostgreSQL connection pool for {mask_connection_string(db_url)}")
            _connection_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                dsn=db_url,
                connect_timeout=10,
                options="-c statement_timeout=30000"
            )
            return _connection_pool
        except Exception as e:
            logger.error(f"Failed to initialize database connection pool: {e}")
            if IS_PRODUCTION:
                raise
            return None


def close_pool():
    """Closes all connections in the pool cleanly upon process exit."""
    global _connection_pool
    with _pool_lock:
        if _connection_pool is not None:
            try:
                _connection_pool.closeall()
                logger.info("Database connection pool closed successfully.")
            except Exception as e:
                logger.warning(f"Error closing database pool: {e}")
            finally:
                _connection_pool = None


@contextmanager
def get_db_connection():
    """
    Yields a connection from the pool, automatically returning it upon completion.
    Fails closed if the pool is unavailable in production.
    """
    pool = get_pool()
    if pool is None:
        if IS_PRODUCTION:
            raise ConnectionError("CRITICAL: Database connection is required in production but not configured or reachable.")
        raise ConnectionError("Database connection is not configured.")

    conn = None
    try:
        conn = pool.getconn()
        yield conn
    finally:
        if conn and pool:
            pool.putconn(conn)


@contextmanager
def get_db_cursor(commit: bool = False):
    """
    Context manager yielding a cursor from a pooled connection.
    If commit=True, automatically commits on successful exit or rolls back on exception.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        try:
            yield cursor
            if commit:
                conn.commit()
        except Exception:
            if commit:
                conn.rollback()
            raise
        finally:
            cursor.close()


def is_db_connected() -> bool:
    """Performs a live ping check against the database."""
    if not is_db_configured():
        return False
    try:
        with get_db_cursor() as cur:
            cur.execute("SELECT 1;")
            row = cur.fetchone()
            return bool(row and row[0] == 1)
    except Exception as e:
        logger.warning(f"Database health check failed: {e}")
        return False


def verify_schema_version_healthy(required_version: Optional[str] = None) -> Tuple[bool, str]:
    """
    Verifies that the database schema is up-to-date by inspecting _schema_migrations.
    Returns (is_healthy, latest_applied_version).
    """
    if not is_db_configured():
        if IS_PRODUCTION:
            return False, "Database unconfigured in production"
        return True, "dev-unconfigured"

    try:
        with get_db_cursor() as cur:
            # Check if migrations table exists
            cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                      AND table_name = '_schema_migrations'
                );
            """)
            table_exists = cur.fetchone()[0]
            if not table_exists:
                return False, "Migration tracking table missing"

            # Query latest successful migration
            cur.execute("""
                SELECT version FROM public._schema_migrations 
                WHERE success = true 
                ORDER BY version DESC 
                LIMIT 1;
            """)
            row = cur.fetchone()
            if not row:
                return False, "No applied migrations found"

            latest_version = row[0]
            if required_version and latest_version < required_version:
                return False, f"Schema out of date (latest: {latest_version}, required: {required_version})"

            return True, latest_version
    except Exception as e:
        logger.error(f"Error verifying schema health: {e}")
        return False, str(e)

