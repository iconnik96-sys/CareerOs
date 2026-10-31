import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Receipt
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { PaymentOverviewResponse } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const RevenuePage: React.FC = () => {
  const [data, setData] = useState<PaymentOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<'transactions' | 'orders'>('transactions');

  const fetchPayments = async () => {
    try {
      const res = await adminService.getPaymentsOverview();
      setData(res);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayments();
  };

  return (
    <>
      <AdminHeader
        title="Revenue & Payment Operations"
        subtitle="Authoritative transaction ledger, Razorpay orders, and subscription billing"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="content-body">
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : data ? (
          <>
            {/* KPI Cards */}
            <div className="metrics-grid">
              <MetricCard
                label="Total Revenue Captured"
                value={`₹${data.financial_summary.total_revenue_inr.toLocaleString()}`}
                sub="Cumulative net payments verified"
                icon={<IndianRupee size={18} />}
                badge={{ text: 'LIFETIME', variant: 'success' }}
              />

              <MetricCard
                label="Monthly Recurring Rev."
                value={`₹${data.financial_summary.mrr_inr.toLocaleString()}`}
                sub="Active monthly subscribers run-rate"
                icon={<TrendingUp size={18} />}
                badge={{ text: 'MRR', variant: 'primary' }}
              />

              <MetricCard
                label="Captured Payments"
                value={data.financial_summary.successful_payments}
                sub={`${data.financial_summary.failed_payments} failed payment attempts`}
                icon={<Receipt size={18} />}
                badge={{ text: 'VERIFIED', variant: 'success' }}
              />

              <MetricCard
                label="Active Subscriptions"
                value={data.financial_summary.subscribers.pro + data.financial_summary.subscribers.ultimate}
                sub={`${data.financial_summary.subscribers.pro} Pro • ${data.financial_summary.subscribers.ultimate} Ultimate`}
                icon={<CreditCard size={18} />}
                badge={{ text: 'PAID TIERS', variant: 'purple' }}
              />
            </div>

            {/* Plan Catalog Reference Card */}
            <div
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                marginBottom: 24,
                backgroundColor: 'var(--bg-card-subtle)'
              }}
            >
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Free Tier Plan
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  ₹0 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  2 ATS scans • 1 export • 1 interview session
                </div>
              </div>

              <div style={{ padding: 12, borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Placement Pro Plan
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  ₹149 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  25 ATS scans • 10 exports • 10 interview sessions
                </div>
              </div>

              <div style={{ padding: 12, borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.78rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 600 }}>
                  Placement Ultimate Plan
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
                  ₹249 <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ month</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  75 ATS scans • 30 exports • 30 interview sessions
                </div>
              </div>
            </div>

            {/* Ledger Tabs & Tables */}
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: 14
                }}
              >
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => setTab('transactions')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: tab === 'transactions' ? '#fff' : 'var(--text-muted)',
                      borderBottom: tab === 'transactions' ? '2px solid var(--primary)' : '2px solid transparent',
                      paddingBottom: 12,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Captured Transactions ({data.recent_transactions.length})
                  </button>

                  <button
                    onClick={() => setTab('orders')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: tab === 'orders' ? '#fff' : 'var(--text-muted)',
                      borderBottom: tab === 'orders' ? '2px solid var(--primary)' : '2px solid transparent',
                      paddingBottom: 12,
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Payment Orders ({data.recent_orders.length})
                  </button>
                </div>
              </div>

              {tab === 'transactions' ? (
                data.recent_transactions.length === 0 ? (
                  <EmptyState
                    title="No Transactions Recorded"
                    description="No captured payment transactions found in PostgreSQL."
                  />
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Payment ID</th>
                          <th>Order ID</th>
                          <th>User ID</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recent_transactions.map((tx) => (
                          <tr key={tx.id}>
                            <td className="font-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              {tx.payment_id}
                            </td>
                            <td className="font-mono" style={{ fontSize: '0.78rem' }}>
                              {tx.order_id}
                            </td>
                            <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {tx.user_id.slice(0, 16)}...
                            </td>
                            <td className="font-mono" style={{ fontWeight: 700, color: '#34d399' }}>
                              ₹{tx.amount_inr.toFixed(2)}
                            </td>
                            <td>
                              <StatusBadge status={tx.status} />
                            </td>
                            <td style={{ fontSize: '0.75rem' }}>
                              {new Date(tx.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : data.recent_orders.length === 0 ? (
                <EmptyState
                  title="No Orders Created"
                  description="No purchase intents or payment orders recorded yet."
                />
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Purchase ID</th>
                        <th>Plan</th>
                        <th>Billing Cycle</th>
                        <th>Price (INR)</th>
                        <th>Status</th>
                        <th>Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_orders.map((ord) => (
                        <tr key={ord.id}>
                          <td className="font-mono" style={{ fontWeight: 600 }}>
                            {ord.purchase_id}
                          </td>
                          <td>
                            <StatusBadge status={ord.plan_id} />
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {ord.billing_cycle}
                          </td>
                          <td className="font-mono" style={{ fontWeight: 600 }}>
                            ₹{ord.amount_inr.toFixed(2)}
                          </td>
                          <td>
                            <StatusBadge status={ord.status} />
                          </td>
                          <td style={{ fontSize: '0.75rem' }}>
                            {new Date(ord.created_at).toLocaleString()}
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

