import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  Terminal,
  FileText
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AuditLogItem } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const res = await adminService.getAuditLogs();
      setLogs(res.events || []);
      setTotalCount(res.total_events || 0);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.actor.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term) ||
      log.id.toLowerCase().includes(term)
    );
  });

  return (
    <>
      <AdminHeader
        title="Security & Audit Logs"
        subtitle={`Tracking ${totalCount} administrative actions, authentication attempts, and operations`}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="content-body">
        {/* Search Toolbar */}
        <div
          className="card card-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search audit actions, actors, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ paddingLeft: 38 }}
            />
          </div>
          <div className="badge badge-neutral">
            IMMUTABLE SECURITY LEDGER
          </div>
        </div>

        {/* Audit Logs Table */}
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No Audit Logs Found"
            description="No audit events matched your search query."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Details</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.74rem', whiteSpace: 'nowrap' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-neutral font-mono" style={{ fontSize: '0.74rem' }}>
                        {item.action}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                        {item.actor}
                      </div>
                    </td>
                    <td>
                      <code
                        className="font-mono"
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                          backgroundColor: 'var(--bg-input)',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-block',
                          maxWidth: 420,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {JSON.stringify(item.details)}
                      </code>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

