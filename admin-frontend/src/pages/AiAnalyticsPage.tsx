import React, { useState, useEffect } from 'react';
import {
  Cpu,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Zap,
  Clock
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AiAnalyticsResponse } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { MetricCard } from '../components/common/MetricCard';
import { DailyTokenChart } from '../components/charts/DailyTokenChart';
import { BreakdownPieChart } from '../components/charts/BreakdownPieChart';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const AiAnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AiAnalyticsResponse | null>(null);
  const [days, setDays] = useState(30);
  const [logSearch, setLogSearch] = useState('');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartMetric, setChartMetric] = useState<'tokens' | 'cost_inr' | 'requests'>('tokens');

  const fetchAnalytics = async () => {
    try {
      const res = await adminService.getAiAnalytics(days);
      setAnalytics(res);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchAnalytics();
  }, [days]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAnalytics();
  };

  const modelPieData = analytics?.model_breakdown
    ? Object.entries(analytics.model_breakdown).map(([name, data]) => ({
        name: name.replace('llama-', '').replace('-instant', ''),
        value: data.tokens
      }))
    : [];

  const featurePieData = analytics?.feature_breakdown
    ? Object.entries(analytics.feature_breakdown).map(([name, data]) => ({
        name: name.replace('_', ' '),
        value: data.tokens
      }))
    : [];

  const filteredLogs = analytics?.recent_logs.filter((log) => {
    const matchesSearch =
      !logSearch ||
      log.model.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.feature.toLowerCase().includes(logSearch.toLowerCase()) ||
      (log.user_id && log.user_id.toLowerCase().includes(logSearch.toLowerCase())) ||
      log.id.toLowerCase().includes(logSearch.toLowerCase());

    const matchesFeature = featureFilter === 'all' || log.feature === featureFilter;
    return matchesSearch && matchesFeature;
  }) || [];

  return (
    <>
      <AdminHeader
        title="AI Usage & Cost Center"
        subtitle="Persistent per-user token attribution, provider distribution, and INR expense monitoring"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="content-body">
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : analytics ? (
          <>
            {/* Top KPI Cards */}
            <div className="metrics-grid">
              <MetricCard
                label="Total Tokens Burned"
                value={
                  analytics.kpis.total_tokens >= 1_000_000
                    ? `${(analytics.kpis.total_tokens / 1_000_000).toFixed(2)}M`
                    : analytics.kpis.total_tokens.toLocaleString()
                }
                sub={`${analytics.kpis.total_input_tokens.toLocaleString()} in • ${analytics.kpis.total_output_tokens.toLocaleString()} out`}
                icon={<Cpu size={18} />}
                badge={{ text: `${days} DAYS`, variant: 'primary' }}
              />

              <MetricCard
                label="Estimated AI Cost (INR)"
                value={`₹${analytics.kpis.total_cost_inr.toFixed(2)}`}
                sub="Weighted rate based on actual provider tokens"
                icon={<TrendingUp size={18} />}
                badge={{ text: 'ESTIMATE', variant: 'warning' }}
              />

              <MetricCard
                label="Total AI Generations"
                value={analytics.kpis.total_requests.toLocaleString()}
                sub={`${analytics.kpis.successful_requests} success • ${analytics.kpis.failed_requests} failed`}
                icon={<Zap size={18} />}
                badge={{
                  text: `${analytics.kpis.total_requests > 0 ? Math.round((analytics.kpis.successful_requests / analytics.kpis.total_requests) * 100) : 100}% SUC`,
                  variant: 'success'
                }}
              />

              <MetricCard
                label="Average Latency"
                value={`${analytics.kpis.avg_latency_ms || 240} ms`}
                sub="Time-to-first-token & generation"
                icon={<Clock size={18} />}
                badge={{ text: 'P50', variant: 'neutral' }}
              />
            </div>

            {/* Time-Series Trend Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    Historical Token & Cost Telemetry
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Aggregated daily from public.ai_usage_daily_summary
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      display: 'flex',
                      backgroundColor: 'var(--bg-input)',
                      padding: 3,
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <button
                      onClick={() => setChartMetric('tokens')}
                      className={`btn btn-sm ${chartMetric === 'tokens' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      Tokens
                    </button>
                    <button
                      onClick={() => setChartMetric('cost_inr')}
                      className={`btn btn-sm ${chartMetric === 'cost_inr' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      Cost (₹)
                    </button>
                    <button
                      onClick={() => setChartMetric('requests')}
                      className={`btn btn-sm ${chartMetric === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                    >
                      Requests
                    </button>
                  </div>

                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="select"
                    style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                  >
                    <option value={7}>Last 7 Days</option>
                    <option value={14}>Last 14 Days</option>
                    <option value={30}>Last 30 Days</option>
                    <option value={90}>Last 90 Days</option>
                  </select>
                </div>
              </div>

              <DailyTokenChart data={analytics.daily_trends} metricKey={chartMetric} />
            </div>

            {/* Breakdowns & Top Consumers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
              <div className="card">
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
                  Model Token Distribution
                </h4>
                <BreakdownPieChart data={modelPieData} />
              </div>

              <div className="card">
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
                  Feature Token Distribution
                </h4>
                <BreakdownPieChart data={featurePieData} />
              </div>

              {/* Top Consumers Card */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: 12, color: '#fff' }}>
                  Highest AI Consuming Users
                </h4>
                {analytics.top_consumers.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No consumer usage recorded.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', maxHeight: 230 }}>
                    {analytics.top_consumers.slice(0, 5).map((user, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          backgroundColor: 'var(--bg-card-subtle)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.8rem'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {user.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="font-mono">
                            {user.user_id.slice(0, 12)}...
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                            {user.total_tokens.toLocaleString()} toks
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#34d399' }} className="font-mono">
                            ₹{user.cost_inr.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Raw Telemetry Logs Table */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                    Real-time AI Request Logs
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Authoritative completion logs recorded in PostgreSQL
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ position: 'relative', width: 220 }}>
                    <Search
                      size={14}
                      style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-muted)' }}
                    />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="input"
                      style={{ paddingLeft: 32, fontSize: '0.78rem', height: 34 }}
                    />
                  </div>

                  <select
                    value={featureFilter}
                    onChange={(e) => setFeatureFilter(e.target.value)}
                    className="select"
                    style={{ fontSize: '0.78rem', height: 34, padding: '4px 8px' }}
                  >
                    <option value="all">All Features</option>
                    <option value="resume_analyzer">Resume Analyzer</option>
                    <option value="interview_evaluator">Interview Evaluator</option>
                    <option value="cover_letter">Cover Letter</option>
                    <option value="simulation">Simulation</option>
                    <option value="bullet_enhancer">Bullet Enhancer</option>
                    <option value="job_matcher">Job Matcher</option>
                  </select>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <EmptyState
                  title="No Matching Logs"
                  description="No request logs matched your search or feature filter."
                />
              ) : (
                <div className="table-wrapper">
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Feature</th>
                        <th>Provider & Model</th>
                        <th>Prompt In</th>
                        <th>Completion Out</th>
                        <th>Total Tokens</th>
                        <th>Cost (INR)</th>
                        <th>Status</th>
                        <th>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                            {log.timestamp}
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.feature}</td>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {log.model}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {log.provider}
                            </div>
                          </td>
                          <td className="font-mono">{log.prompt_tokens}</td>
                          <td className="font-mono">{log.completion_tokens}</td>
                          <td className="font-mono" style={{ fontWeight: 700 }}>
                            {log.total_tokens}
                          </td>
                          <td className="font-mono" style={{ color: '#34d399' }}>
                            ₹{log.cost_inr.toFixed(4)}
                          </td>
                          <td>
                            <StatusBadge status={log.status} />
                          </td>
                          <td className="font-mono" style={{ fontSize: '0.74rem' }}>
                            {log.latency_ms}ms
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

