import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Cpu,
  Save,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { AdminSettingsResponse } from '../types/admin';
import { AdminHeader } from '../components/layout/AdminHeader';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdminSettingsResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await adminService.getSettings();
      setSettings(res);
      setSelectedModel(res.ai_configuration.active_model);
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleModelSwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModel) return;

    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await adminService.switchModel(selectedModel);
      setSuccessMsg(`Active model successfully updated to: ${res.active_model}`);
      fetchSettings();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to switch primary model.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetMetrics = async () => {
    if (!window.confirm('Are you sure you want to reset in-memory usage telemetry? Historical PostgreSQL records will remain preserved.')) {
      return;
    }
    try {
      await adminService.resetMetrics();
      alert('In-memory usage metrics reset successfully.');
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    }
  };

  return (
    <>
      <AdminHeader
        title="Platform & Model Configuration"
        subtitle="Manage live AI inference routing, token cost catalogs, and founder access"
        onRefresh={fetchSettings}
        isRefreshing={isLoading}
      />

      <div className="content-body">
        {isLoading ? (
          <LoadingSkeleton rows={8} />
        ) : settings ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 960 }}>
            {/* Feedback Notifications */}
            {successMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  backgroundColor: 'var(--success-subtle)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#34d399',
                  fontSize: '0.84rem'
                }}
              >
                <CheckCircle size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  backgroundColor: 'var(--danger-subtle)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  color: '#f87171',
                  fontSize: '0.84rem'
                }}
              >
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* AI Model Switching Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Cpu size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Live Model Routing Control
                </h3>
              </div>

              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                Dynamically switch the primary LLM model for all student evaluations without restarting the backend.
                If the selected model exceeds provider rate limits, the universal engine automatically cascades to fallback options.
              </p>

              <form onSubmit={handleModelSwitch} style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 280 }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Select Primary LLM Model
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="select"
                    style={{ width: '100%', height: 42 }}
                  >
                    {settings.ai_configuration.available_models.map((m) => (
                      <option key={m} value={m}>
                        {m} ({settings.ai_configuration.provider})
                      </option>
                    ))}
                    <option value="default">System Default (Default Fallback Cascade)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary"
                  style={{ height: 42, padding: '0 20px' }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'Updating...' : 'Apply Model'}</span>
                </button>
              </form>
            </div>

            {/* Token Rate Catalog Table */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <TrendingDown size={20} style={{ color: '#34d399' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                  Authoritative Token Rates (per 1,000,000 Tokens in INR)
                </h3>
              </div>

              <div className="table-wrapper">
                <table className="table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr>
                      <th>Model Name</th>
                      <th>Provider</th>
                      <th>Prompt In Rate (₹/1M)</th>
                      <th>Completion Out Rate (₹/1M)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(settings.ai_configuration.rates_inr_per_million)
                      .slice(0, 8)
                      .map(([key, rate]) => (
                        <tr key={key}>
                          <td>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rate.name}</span>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="font-mono">{key}</div>
                          </td>
                          <td>
                            <span className="badge badge-neutral">{rate.provider}</span>
                          </td>
                          <td className="font-mono">₹{rate.input.toFixed(2)}</td>
                          <td className="font-mono" style={{ color: '#34d399' }}>₹{rate.output.toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reset In-Memory Telemetry Action */}
            <div
              className="card"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.04)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f87171', marginBottom: 4 }}>
                  In-Memory Metrics Reset
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Clears ephemeral in-process counters for clean diagnostic testing.
                  PostgreSQL database records in <code style={{ color: 'var(--text-primary)' }}>ai_usage_logs</code> remain permanently untouched.
                </p>
              </div>

              <button
                onClick={handleResetMetrics}
                className="btn btn-danger btn-sm"
              >
                <RotateCcw size={14} />
                <span>Reset In-Memory Counters</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

