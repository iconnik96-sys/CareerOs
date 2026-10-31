import React, { useState, useEffect } from 'react';
import { RefreshCw, Server, Cpu } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { SystemHealthResponse } from '../../types/admin';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing
}) => {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);

  useEffect(() => {
    adminService.getSystemHealth()
      .then(setHealth)
      .catch(() => {});
  }, []);

  return (
    <header
      style={{
        padding: '18px 36px',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Active AI Model Badge */}
        {health?.ai_engine && (
          <div
            className="badge badge-neutral"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              gap: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.04)'
            }}
          >
            <Cpu size={14} style={{ color: 'var(--primary)' }} />
            <span>{health.ai_engine.active_model}</span>
          </div>
        )}

        {/* Database & Backend Status Pill */}
        <div
          className={`badge ${health?.database?.connected ? 'badge-success' : 'badge-danger'}`}
          style={{ padding: '6px 12px', fontSize: '0.78rem', gap: 8 }}
        >
          <Server size={14} />
          <span>{health?.database?.connected ? 'DB CONNECTED' : 'DB DEGRADED'}</span>
          {health?.database?.latency_ms !== undefined && (
            <span style={{ opacity: 0.8, fontFamily: 'var(--font-mono)' }}>
              ({health.database.latency_ms}ms)
            </span>
          )}
        </div>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn btn-secondary btn-sm"
            title="Refresh View"
            style={{ padding: '6px 12px' }}
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
        )}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};

