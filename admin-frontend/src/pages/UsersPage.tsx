import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  User,
  ExternalLink,
  Shield,
  Clock,
  Cpu,
  Layers,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AdminUser, UserDetailData } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetailData | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await adminService.getUsers(searchQuery, planFilter);
      setUsers(res.users || []);
      setTotalUsers(res.total_users || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch user directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, planFilter]);

  const handleOpenDetail = async (userId: string) => {
    setIsModalOpen(true);
    setIsDetailLoading(true);
    try {
      const data = await adminService.getUserDetail(userId);
      setSelectedUser(data);
    } catch {
      setSelectedUser(null);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <>
      <AdminHeader
        title="Student Directory & Accounts"
        subtitle={`Managing ${totalUsers} registered students across Free, Pro, and Ultimate tiers`}
        onRefresh={fetchUsers}
        isRefreshing={isLoading}
      />

      <div className="content-body">
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: 20
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div
          className="card card-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 20,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search by student email, name, or UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input"
                style={{ paddingLeft: 38 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Filter size={15} style={{ color: 'var(--text-muted)' }} />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="select"
            >
              <option value="all">All Subscription Plans</option>
              <option value="free">Free Tier</option>
              <option value="pro">Placement Pro (₹149)</option>
              <option value="ultimate">Placement Ultimate (₹249)</option>
            </select>
          </div>
        </div>

        {/* User Directory Table */}
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No Students Found"
            description="No student accounts matched your current filter and search query."
          />
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subscription</th>
                  <th>Quota Used</th>
                  <th>Tokens Burned</th>
                  <th>Est. Cost</th>
                  <th>Registered</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-muted)'
                          }}
                        >
                          <User size={15} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {u.full_name || 'CareerOS Student'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }} className="font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <StatusBadge status={u.plan_id} />
                    </td>

                    <td className="font-mono">
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {u.quota_used}
                      </span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}> this mo.</span>
                    </td>

                    <td className="font-mono">
                      {u.total_tokens.toLocaleString()}
                    </td>

                    <td className="font-mono" style={{ color: '#34d399' }}>
                      ₹{u.total_cost_inr.toFixed(4)}
                    </td>

                    <td style={{ fontSize: '0.78rem' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenDetail(u.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        <span>Inspect</span>
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal / Drawer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Student Activity & Subscription Profile"
        width="720px"
      >
        {isDetailLoading ? (
          <LoadingSkeleton rows={5} />
        ) : selectedUser ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Basic Info Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 14,
                backgroundColor: 'var(--bg-card-subtle)',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Full Name
                </div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                  {selectedUser.user.full_name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} className="font-mono">
                  {selectedUser.user.email}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Subscription Tier
                </div>
                <div style={{ marginTop: 4 }}>
                  <StatusBadge status={selectedUser.user.plan_id} />
                </div>
                {selectedUser.user.current_period_end && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Renews: {new Date(selectedUser.user.current_period_end).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Career Role
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {selectedUser.user.target_role}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  College / Institution
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  {selectedUser.user.college}
                </div>
              </div>
            </div>

            {/* Quota Usage Ledger */}
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                Monthly Feature Quota Usages
              </h4>
              {selectedUser.quota_history.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                  No quotas consumed yet by this account.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Month</th>
                        <th>Consumption Count</th>
                        <th>Last Consumed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.quota_history.map((q, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{q.feature}</td>
                          <td className="font-mono">{q.month}</td>
                          <td className="font-mono" style={{ color: 'var(--primary)' }}>{q.usage_count}</td>
                          <td style={{ fontSize: '0.72rem' }}>{new Date(q.updated_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent AI Telemetry */}
            <div>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
                Recent AI Generations
              </h4>
              {selectedUser.recent_ai_activity.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '10px 0' }}>
                  No AI request logs recorded for this account.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Feature</th>
                        <th>Model</th>
                        <th>Tokens</th>
                        <th>Cost</th>
                        <th>Status</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.recent_ai_activity.map((a, idx) => (
                        <tr key={idx}>
                          <td>{a.feature}</td>
                          <td className="font-mono" style={{ fontSize: '0.74rem' }}>{a.model}</td>
                          <td className="font-mono">{a.total_tokens.toLocaleString()}</td>
                          <td className="font-mono" style={{ color: '#34d399' }}>₹{a.cost_inr.toFixed(4)}</td>
                          <td><StatusBadge status={a.status} /></td>
                          <td style={{ fontSize: '0.72rem' }}>{new Date(a.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState title="User Not Found" description="Could not load profile details for this account." />
        )}
      </Modal>
    </>
  );
};

