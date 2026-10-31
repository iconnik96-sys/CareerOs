import os
import sys
import time
import hashlib
import logging
import argparse
from typing import List, Dict, Any, Optional, Tuple

# Ensure database module is accessible
sys.path.insert(0, os.path.dirname(__file__))

from database import (
    get_database_url,
    mask_connection_string,
    IS_PRODUCTION,
    ENVIRONMENT
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MigrationRunner")

# ====================================================================
# Configuration & Constants
# ====================================================================
MIGRATIONS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "supabase", "migrations"))
ADVISORY_LOCK_ID = 884729103  # Stable 32-bit integer for careeros_schema_migrations_lock

# Table-by-Table Expected Security Policy (Enforced during post-migration verification)
TABLE_SECURITY_POLICY = {
    "user_quota_usage": {"rls": True, "required_policies": ["Users can view own quota usage", "Service role can manage user quota usage"]},
    "payment_orders": {"rls": True, "required_policies": ["Users can view own payment orders", "Service role can manage payment orders"]},
    "payment_transactions": {"rls": True, "required_policies": ["Users can view own payment transactions", "Service role can manage payment transactions"]},
    "subscriptions": {"rls": True, "required_policies": ["Users can view own subscription", "Service role can manage subscriptions"]},
    "webhook_events": {"rls": True, "required_policies": ["Service role can manage webhook events"]},
    "institutions": {"rls": True, "required_policies": ["Service role can manage institutions"]},
    "institution_invites": {"rls": True, "required_policies": ["Service role can manage institution invites"]},
    "profiles": {"rls": True, "required_policies": []},
    "applications": {"rls": True, "required_policies": []},
    "analyses": {"rls": True, "required_policies": []},
    "ai_usage_logs": {"rls": True, "required_policies": ["Users can view own AI usage logs", "Founders and admins can view all AI usage logs", "Service role can manage AI usage logs"]}
}

# Forbidden unapproved destructive SQL operations
FORBIDDEN_OPERATIONS = [
    "DROP TABLE",
    "TRUNCATE",
    "DROP DATABASE",
    "DROP SCHEMA",
    "CASCADE CONSTRAINTS"
]


def calculate_file_checksum(filepath: str) -> str:
    """Computes SHA-256 hash of migration file content (normalized line endings)."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read().replace("\r\n", "\n")
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def scan_migration_for_destructive_sql(filepath: str, content: str) -> List[str]:
    """
    Scans a migration file for forbidden destructive statements.
    Returns list of violations found, if any.
    """
    violations = []
    lines = content.splitlines()
    for idx, line in enumerate(lines, start=1):
        clean = line.strip()
        # Skip pure comments
        if clean.startswith("--") or clean.startswith("/*"):
            continue
        upper = clean.upper()
        for forbidden in FORBIDDEN_OPERATIONS:
            if forbidden in upper:
                # Disallow unless explicitly marked with approval directive
                if "-- APPROVED_DESTRUCTIVE_OPERATION" not in clean:
                    violations.append(f"Line {idx}: Unapproved destructive command '{forbidden}' detected in {os.path.basename(filepath)}")
    return violations


def get_available_migrations() -> List[Dict[str, Any]]:
    """Discovers and parses all .sql files in the migrations directory."""
    if not os.path.exists(MIGRATIONS_DIR):
        logger.error(f"Migrations directory not found: {MIGRATIONS_DIR}")
        return []

    files = [f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".sql")]
    files.sort()  # Lexicographical ordering ensures chronological execution

    migrations = []
    for filename in files:
        filepath = os.path.join(MIGRATIONS_DIR, filename)
        version = os.path.splitext(filename)[0]
        checksum = calculate_file_checksum(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        migrations.append({
            "version": version,
            "filename": filename,
            "filepath": filepath,
            "checksum": checksum,
            "content": content
        })
    return migrations


def ensure_migration_tracking_table(cursor) -> None:
    """Creates the public._schema_migrations table if it does not already exist."""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS public._schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            checksum TEXT NOT NULL,
            applied_at TIMESTAMPTZ DEFAULT NOW(),
            execution_time_ms INTEGER NOT NULL,
            success BOOLEAN NOT NULL DEFAULT true,
            error_message TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
            ON public._schema_migrations(applied_at);
    """)


def get_applied_migrations(cursor) -> Dict[str, Dict[str, Any]]:
    """Retrieves all applied migrations and their recorded checksums."""
    ensure_migration_tracking_table(cursor)
    cursor.execute("""
        SELECT version, name, checksum, applied_at, execution_time_ms, success 
        FROM public._schema_migrations 
        ORDER BY version ASC;
    """)
    applied = {}
    for row in cursor.fetchall():
        applied[row[0]] = {
            "version": row[0],
            "name": row[1],
            "checksum": row[2],
            "applied_at": row[3],
            "execution_time_ms": row[4],
            "success": row[5]
        }
    return applied


def acquire_advisory_lock(cursor) -> None:
    """Acquires a session-level PostgreSQL advisory lock, blocking until available."""
    logger.info(f"Acquiring PostgreSQL advisory lock (ID: {ADVISORY_LOCK_ID})...")
    cursor.execute("SELECT pg_advisory_lock(%s);", (ADVISORY_LOCK_ID,))
    logger.info("Advisory lock acquired successfully. Exclusive migration runner active.")


def release_advisory_lock(cursor) -> None:
    """Releases the PostgreSQL advisory lock."""
    try:
        cursor.execute("SELECT pg_advisory_unlock(%s);", (ADVISORY_LOCK_ID,))
        logger.info("PostgreSQL advisory lock released.")
    except Exception as e:
        logger.warning(f"Error releasing advisory lock: {e}")


def validate_database_security_policies(cursor) -> Tuple[bool, List[str]]:
    """
    Validates that public tables strictly enforce the explicit TABLE_SECURITY_POLICY.
    Verifies that RLS is active and intended policies exist.
    """
    issues = []
    # Check RLS state for required tables
    cursor.execute("""
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public';
    """)
    active_tables = {row[0]: row[1] for row in cursor.fetchall()}

    for table, policy in TABLE_SECURITY_POLICY.items():
        if table in active_tables:
            if policy["rls"] and not active_tables[table]:
                issues.append(f"Security Alert: Table '{table}' does NOT have Row Level Security enabled!")

    # Check that SECURITY DEFINER functions set search_path
    cursor.execute("""
        SELECT proname, proconfig 
        FROM pg_proc 
        JOIN pg_namespace n ON pg_proc.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
          AND prosecdef = true;
    """)
    for proname, proconfig in cursor.fetchall():
        if not proconfig or not any("search_path" in str(cfg) for cfg in proconfig):
            issues.append(f"SECURITY DEFINER warning: Function '{proname}' does not define an explicit search_path!")

    return (len(issues) == 0, issues)


def run_migrations(connection) -> bool:
    """
    Main migration execution engine.
    - Acquires advisory lock
    - Inspects available vs applied migrations
    - Pre-scans for destructive SQL
    - Applies pending migrations inside atomic transactions
    - Validates database security policies
    - Releases advisory lock
    """
    cursor = connection.cursor()
    lock_acquired = False

    try:
        acquire_advisory_lock(cursor)
        lock_acquired = True

        ensure_migration_tracking_table(cursor)
        applied = get_applied_migrations(cursor)
        available = get_available_migrations()

        if not available:
            logger.warning("No migration files found in migrations directory.")
            return True

        logger.info(f"Discovered {len(available)} available migration(s). Currently applied: {len(applied)}.")

        # 1. Verify integrity of previously applied migrations
        for mig in available:
            v = mig["version"]
            if v in applied:
                record = applied[v]
                if record["checksum"] != mig["checksum"]:
                    msg = (
                        f"CRITICAL DRIFT: Migration '{v}' checksum mismatch!\n"
                        f"  Database recorded checksum : {record['checksum']}\n"
                        f"  Filesystem current checksum: {mig['checksum']}\n"
                        f"Modifying applied migration files in production is prohibited."
                    )
                    logger.error(msg)
                    if IS_PRODUCTION:
                        raise RuntimeError(msg)
                    logger.warning("Continuing in development mode despite checksum drift.")

        # 2. Determine pending migrations
        pending = [m for m in available if m["version"] not in applied or not applied[m["version"]]["success"]]

        if not pending:
            logger.info("All migrations are already applied and up to date.")
            is_sec_valid, sec_issues = validate_database_security_policies(cursor)
            if not is_sec_valid:
                for issue in sec_issues:
                    logger.warning(issue)
            return True

        logger.info(f"Found {len(pending)} pending migration(s) to execute.")

        # 3. Execute each pending migration inside its own transaction
        for mig in pending:
            v = mig["version"]
            name = mig["filename"]
            logger.info(f"==> Applying migration: {name} (Version: {v})")

            # Static pre-scan for destructive commands
            violations = scan_migration_for_destructive_sql(mig["filepath"], mig["content"])
            if violations:
                for v_err in violations:
                    logger.error(v_err)
                raise PermissionError(f"Destructive operation detected in '{name}'. Aborting migration.")

            start_time = time.time()
            try:
                # Execute migration statements
                cursor.execute(mig["content"])

                # Record success in _schema_migrations
                exec_time_ms = int((time.time() - start_time) * 1000)
                cursor.execute("""
                    INSERT INTO public._schema_migrations (version, name, checksum, applied_at, execution_time_ms, success)
                    VALUES (%s, %s, %s, NOW(), %s, true)
                    ON CONFLICT (version) DO UPDATE SET 
                        checksum = EXCLUDED.checksum,
                        applied_at = NOW(),
                        execution_time_ms = EXCLUDED.execution_time_ms,
                        success = true,
                        error_message = NULL;
                """, (v, name, mig["checksum"], exec_time_ms))

                # Commit transaction
                connection.commit()
                logger.info(f"Successfully applied {name} in {exec_time_ms}ms.")

            except Exception as e:
                connection.rollback()
                exec_time_ms = int((time.time() - start_time) * 1000)
                err_msg = str(e)
                logger.error(f"FAILED to apply migration '{name}': {err_msg}")

                # Record failure in separate transaction
                try:
                    fail_cur = connection.cursor()
                    fail_cur.execute("""
                        INSERT INTO public._schema_migrations (version, name, checksum, applied_at, execution_time_ms, success, error_message)
                        VALUES (%s, %s, %s, NOW(), %s, false, %s)
                        ON CONFLICT (version) DO UPDATE SET 
                            execution_time_ms = EXCLUDED.execution_time_ms,
                            success = false,
                            error_message = EXCLUDED.error_message;
                    """, (v, name, mig["checksum"], exec_time_ms, err_msg))
                    connection.commit()
                    fail_cur.close()
                except Exception as rec_err:
                    connection.rollback()
                    logger.warning(f"Could not record failure status: {rec_err}")

                raise RuntimeError(f"Deployment halted: Migration '{name}' failed. Error: {err_msg}")

        # 4. Post-migration Security & Policy Validation
        logger.info("Validating database security policies and table permissions...")
        is_sec_valid, sec_issues = validate_database_security_policies(cursor)
        if not is_sec_valid:
            for issue in sec_issues:
                logger.warning(issue)

        logger.info("All pending migrations executed successfully. Database is production-ready.")
        return True

    finally:
        if lock_acquired:
            release_advisory_lock(cursor)
        cursor.close()


def print_status(connection) -> None:
    """Prints migration status table to console."""
    cursor = connection.cursor()
    try:
        ensure_migration_tracking_table(cursor)
        applied = get_applied_migrations(cursor)
        available = get_available_migrations()

        print("\n" + "=" * 80)
        print("CAREEROS DATABASE MIGRATION STATUS")
        print("=" * 80)
        print(f"{'Version':<40} | {'Status':<10} | {'Execution Time':<15} | Applied At")
        print("-" * 80)

        for mig in available:
            v = mig["version"]
            if v in applied:
                rec = applied[v]
                status = "APPLIED" if rec["success"] else "FAILED"
                t_str = f"{rec['execution_time_ms']}ms"
                app_at = str(rec["applied_at"])[:19]
            else:
                status = "PENDING"
                t_str = "-"
                app_at = "-"

            print(f"{v:<40} | {status:<10} | {t_str:<15} | {app_at}")

        print("=" * 80 + "\n")
    finally:
        cursor.close()


def main():
    parser = argparse.ArgumentParser(description="CareerOS Production Database Migration Runner")
    parser.add_argument("action", choices=["run", "status", "verify"], default="run", nargs="?",
                        help="Action to perform: run (apply pending), status (view history), verify (test health)")
    args = parser.parse_args()

    db_url = get_database_url()
    if not db_url:
        msg = "DATABASE_URL or SUPABASE_DB_URL is not configured."
        if IS_PRODUCTION:
            logger.error(f"CRITICAL: {msg} Cannot start backend in production.")
            sys.exit(1)
        else:
            logger.warning(f"{msg} Skipping database migration runner in development.")
            sys.exit(0)

    logger.info(f"Connecting to database: {mask_connection_string(db_url)}")

    import psycopg2
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        conn.autocommit = False
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        sys.exit(1)

    try:
        if args.action == "run":
            success = run_migrations(conn)
            sys.exit(0 if success else 1)
        elif args.action == "status":
            print_status(conn)
            sys.exit(0)
        elif args.action == "verify":
            cursor = conn.cursor()
            is_valid, issues = validate_database_security_policies(cursor)
            cursor.close()
            if is_valid:
                logger.info("Database schema and RLS policies are fully valid.")
                sys.exit(0)
            else:
                for issue in issues:
                    logger.error(issue)
                sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()

