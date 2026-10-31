import React, { useState, useEffect } from 'react';
import {
  Gauge,
  FileText,
  Mic,
  Briefcase,
  Download,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { QuotaOverviewResponse } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { MetricCard } from '../components/common/MetricCard';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const QuotasPage: React.FC = () => {
  const [data, setData] = useState<QuotaOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuotas = async () => {
    try {
      const res = await adminService.getQuotasOverview();
      setData(res);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchQuotas();
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('scan') || feature.includes('resume')) return <FileText size={18} />;
    if (feature.includes('interview') || feature.includes('voice')) return <Mic size={18} />;
    if (feature.includes('export')) return <Download size={18} />;
    return <Briefcase size={18} />;
  };

  return (
    <>
      <AdminHeader
        title="Quota & Entitlement Monitoring"
        subtitle="Tracking feature consumption against server-enforced monthly subscription limits"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="content-body">
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : data ? (
          <>
            {/* Feature Usage Overview Grid */}
            <div className="metrics-grid">
              <MetricCard
                label="ATS Resume Scans"
                value={data.feature_totals['resume_scans']?.total_consumptions || 0}
                sub={`${data.feature_totals['resume_scans']?.active_students || 0} unique students this month`}
                icon={<FileText size={18} />}
                badge={{ text: 'Free: 2/mo • Pro: 25 • Ult: 75', variant: 'primary' }}
              />

              <MetricCard
                label="AI Mock Interviews"
                value={data.feature_totals['voice_interviews']?.total_consumptions || 0}
                sub={`${data.feature_totals['voice_interviews']?.active_students || 0} active candidates`}
                icon={<Mic size={18} />}
                badge={{ text: 'Free: 1/mo • Pro: 10 • Ult: 30', variant: 'purple' }}
              />

              <MetricCard
                label="Resume Exports"
                value={data.feature_totals['resume_exports']?.total_consumptions || 0}
                sub={`${data.feature_totals['resume_exports']?.active_students || 0} PDF exports`}
                icon={<Download size={18} />}
                badge={{ text: 'Free: 1 • Pro: 10 • Ult: 30', variant: 'success' }}
              />

              <MetricCard
                label="Workplace Simulations"
                value={data.feature_totals['simulations']?.total_consumptions || 0}
                sub={`${data.feature_totals['simulations']?.active_students || 0} active simulation sessions`}
                icon={<Briefcase size={18} />}
                badge={{ text: 'Free: 1 • Pro: 5 • Ult: 15', variant: 'warning' }}
              />
            </div>

            {/* Authoritative Subscription Plan Matrix */}
            <div className="card" style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Authoritative Server-Enforced Plan Quota Limits
              </h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Plan Tier</th>
                      <th>Monthly Price</th>
                      <th>ATS Resume Scans</th>
                      <th>Resume Exports</th>
                      <th>Voice Interviews</th>
                      <th>Simulations</th>
                      <th>Monthly Reset Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="badge badge-warning">FREE TIER</span></td>
                      <td className="font-mono">₹0</td>
                      <td className="font-mono">2 / month</td>
                      <td className="font-mono">1 (Watermarked)</td>
                      <td className="font-mono">1 session (5 questions)</td>
                      <td className="font-mono">1 starter scenario</td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>UTC Calendar Month</td>
                    </tr>
                    <tr>
                      <td><span className="badge badge-primary">PLACEMENT PRO</span></td>
                      <td className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>₹149 / mo</td>
                      <td className="font-mono">25 / month</td>
                      <td className="font-mono">10 clean exports</td>
                      <td className="font-mono">10 full interviews</td>
                      <td className="font-mono">5 simulations</td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>UTC Calendar Month</td>
                    </tr>
                    <tr>
                      <td><span className="badge badge-purple">PLACEMENT ULTIMATE</span></td>
                      <td className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>₹249 / mo</td>
                      <td className="font-mono">75 / month</td>
                      <td className="font-mono">30 clean exports</td>
                      <td className="font-mono">30 full interviews</td>
                      <td className="font-mono">15 simulations</td>
                      <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>UTC Calendar Month</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Quota Consuming Accounts */}
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Active Quota Consumption Leaderboard
              </h3>
              {data.top_quota_consumers.length === 0 ? (
                <EmptyState
                  title="No Quotas Consumed"
                  description="No user quota records recorded yet for the active calendar month."
                />
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student Account</th>
                        <th>Feature Tracked</th>
                        <th>Month</th>
                        <th>Consumption Count</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.top_quota_consumers.map((qc, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {qc.student_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="font-mono">
                              {qc.user_id}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>{qc.feature}</td>
                          <td className="font-mono">Current Month</td>
                          <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {qc.usage_count}
                          </td>
                          <td>
                            <span className="badge badge-success">ENFORCED</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

