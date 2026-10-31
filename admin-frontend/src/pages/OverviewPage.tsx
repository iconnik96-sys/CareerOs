import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  Cpu,
  IndianRupee,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { OverviewMetrics, DailyTrendItem } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { MetricCard } from '../components/common/MetricCard';
import { DailyTokenChart } from '../components/charts/DailyTokenChart';
import { BreakdownPieChart } from '../components/charts/BreakdownPieChart';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const OverviewPage: React.FC = () => {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<DailyTrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    try {
      setErrorMsg(null);
      const overviewData = await adminService.getOverview();
      setMetrics(overviewData);
      setTrends(overviewData.daily_trends || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load operational metrics from backend.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOverviewData();
  };

  const subscriberPieData = metrics
    ? [
        { name: 'Free Users', value: metrics.subscribers.free },
        { name: 'Placement Pro', value: metrics.subscribers.pro },
        { name: 'Placement Ultimate', value: metrics.subscribers.ultimate }
      ]
    : [];

  return (
    <>
      <AdminHeader
        title="Operational Overview"
        subtitle="Authoritative platform telemetry, live token burn, and commercial performance"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="content-body">
        {errorMsg && (
          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--danger-subtle)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-lg)',
              color: '#f87171',
              fontSize: '0.86rem',
              marginBottom: 24
            }}
          >
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <LoadingSkeleton rows={6} />
        ) : metrics ? (
          <>
            {/* Row 1: High-Priority Operational Metrics */}
            <div className="metrics-grid">
              <MetricCard
                label="Registered Students"
                value={metrics.total_users.toLocaleString()}
                sub={`+${metrics.new_today} today • +${metrics.new_this_month} this month`}
                icon={<Users size={18} />}
                badge={{ text: 'AUTH USERS', variant: 'primary' }}
              />

              <MetricCard
                label="Monthly Recurring Rev."
                value={`₹${metrics.financial.mrr_inr.toLocaleString()}`}
                sub="Active Pro + Ultimate run-rate"
                icon={<IndianRupee size={18} />}
                badge={{ text: 'MRR', variant: 'success' }}
              />

              <MetricCard
                label="AI Tokens Burned"
                value={
                  metrics.ai_usage.total_tokens >= 1_000_000
                    ? `${(metrics.ai_usage.total_tokens / 1_000_000).toFixed(2)}M`
                    : metrics.ai_usage.total_tokens.toLocaleString()
                }
                sub={`${metrics.ai_usage.total_requests} completions`}
                icon={<Cpu size={18} />}
                badge={{ text: metrics.health.provider, variant: 'neutral' }}
              />

              <MetricCard
                label="Estimated AI Expense"
                value={`₹${metrics.ai_usage.total_cost_inr.toFixed(2)}`}
                sub={`Provider API costs @ ₹85/USD`}
                icon={<TrendingUp size={18} />}
                badge={{ text: 'ESTIMATE', variant: 'warning' }}
              />
            </div>

            {/* Row 2: Secondary Operational Telemetry */}
            <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
              <div className="card card-sm">
                <div className="metric-label">Pro Subscribers</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}>
                  {metrics.subscribers.pro}
                </div>
                <div className="metric-sub">₹149 / month tier</div>
              </div>

              <div className="card card-sm">
                <div className="metric-label">Ultimate Subscribers</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', color: '#c084fc' }}>
                  {metrics.subscribers.ultimate}
                </div>
                <div className="metric-sub">₹249 / month tier</div>
              </div>

              <div className="card card-sm">
                <div className="metric-label">Payment Success Rate</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', color: '#34d399' }}>
                  {metrics.financial.successful_payments + metrics.financial.failed_payments > 0
                    ? `${Math.round(
                        (metrics.financial.successful_payments /
                          (metrics.financial.successful_payments + metrics.financial.failed_payments)) *
                          100
                      )}%`
                    : '100%'}
                </div>
                <div className="metric-sub">
                  {metrics.financial.successful_payments} captured • {metrics.financial.failed_payments} failed
                </div>
              </div>

              <div className="card card-sm">
                <div className="metric-label">Database Status</div>
                <div className="metric-value" style={{ fontSize: '1.4rem', color: metrics.health.database_connected ? '#34d399' : '#f87171' }}>
                  {metrics.health.database_connected ? 'CONNECTED' : 'OFFLINE'}
                </div>
                <div className="metric-sub font-mono">
                  {metrics.health.schema_version ? metrics.health.schema_version : 'Schema verified'}
                </div>
              </div>
            </div>

            {/* Row 3: Visual Analytics Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      Daily AI Token Consumption
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Time-series telemetry from persistent ai_usage_logs
                    </p>
                  </div>
                  <span className="badge badge-primary">14 DAYS</span>
                </div>
                <DailyTokenChart data={trends} metricKey="tokens" />
              </div>

              <div className="card">
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    Subscriber Tier Breakdown
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Active student subscription distribution
                  </p>
                </div>
                <BreakdownPieChart data={subscriberPieData} />
              </div>
            </div>

            {/* Row 4: Quick Links / System Health Ribbon */}
            <div
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 24px',
                flexWrap: 'wrap',
                gap: 16,
                backgroundColor: 'var(--bg-card-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--success-subtle)',
                    color: '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    Production Security Controls Enforced
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Row Level Security (RLS) active • Server-side quota validation • Cryptographic JWT verification
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <a
                  href="/users"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Manage Users</span>
                  <ArrowUpRight size={14} />
                </a>
                <a
                  href="/ai-analytics"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  <span>Cost Center</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

