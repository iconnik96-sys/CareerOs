import { adminFetch } from './apiClient';
import {
  AdminUser,
  UserDetailData,
  OverviewMetrics,
  DailyTrendItem,
  AiAnalyticsResponse,
  PaymentOverviewResponse,
  QuotaOverviewResponse,
  SystemHealthResponse,
  AuditLogItem,
  AdminSettingsResponse
} from '../types/admin';

class AdminService {
  private _systemHealthPromise: Promise<SystemHealthResponse> | null = null;
  private _systemHealthExpiresAt: number = 0;
  private _cachedSystemHealth: SystemHealthResponse | null = null;

  /**
   * Fetches the consolidated overview KPIs and 14-day trends in a single fast round-trip.
   */
  public async getOverview(): Promise<OverviewMetrics & { daily_trends?: DailyTrendItem[] }> {
    return adminFetch('/api/admin/overview');
  }

  /**
   * Fetches paginated & filtered user list.
   */
  public async getUsers(
    query?: string,
    plan?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total_users: number;
    new_today: number;
    new_this_month: number;
    subscribers: Record<string, number>;
    users: AdminUser[];
  }> {
    const params = new URLSearchParams();
    if (query && query.trim()) params.set('query', query.trim());
    if (plan && plan.trim() && plan !== 'all') params.set('plan', plan.trim());
    params.set('limit', String(limit));
    params.set('offset', String(offset));

    return adminFetch(`/api/admin/users?${params.toString()}`);
  }

  /**
   * Fetches specific user's detailed activity profile.
   */
  public async getUserDetail(userId: string): Promise<UserDetailData> {
    return adminFetch(`/api/admin/users/${encodeURIComponent(userId)}`);
  }

  /**
   * Fetches AI usage & cost analytics.
   */
  public async getAiAnalytics(days: number = 30): Promise<AiAnalyticsResponse> {
    return adminFetch(`/api/admin/ai/analytics?days=${days}`);
  }

  /**
   * Fetches payment transactions and revenue KPIs.
   */
  public async getPaymentsOverview(): Promise<PaymentOverviewResponse> {
    return adminFetch('/api/admin/payments/overview');
  }

  /**
   * Fetches quota allocations and current consumption totals.
   */
  public async getQuotasOverview(): Promise<QuotaOverviewResponse> {
    return adminFetch('/api/admin/quotas/overview');
  }

  /**
   * Fetches diagnostic system health with request deduplication and 10s client cache.
   */
  public async getSystemHealth(): Promise<SystemHealthResponse> {
    const now = Date.now();
    if (this._cachedSystemHealth && now < this._systemHealthExpiresAt) {
      return this._cachedSystemHealth;
    }
    if (this._systemHealthPromise) {
      return this._systemHealthPromise;
    }
    this._systemHealthPromise = adminFetch<SystemHealthResponse>('/api/admin/system/health')
      .then((res) => {
        this._cachedSystemHealth = res;
        this._systemHealthExpiresAt = Date.now() + 10000;
        this._systemHealthPromise = null;
        return res;
      })
      .catch((err) => {
        this._systemHealthPromise = null;
        throw err;
      });
    return this._systemHealthPromise;
  }

  /**
   * Fetches administrative audit log trail.
   */
  public async getAuditLogs(): Promise<{ total_events: number; events: AuditLogItem[] }> {
    return adminFetch('/api/admin/audit-logs');
  }

  /**
   * Fetches platform settings and model pricing.
   */
  public async getSettings(): Promise<AdminSettingsResponse> {
    return adminFetch('/api/admin/settings');
  }

  /**
   * Switches active AI model.
   */
  public async switchModel(modelName: string): Promise<{ status: string; message: string; active_model: string }> {
    return adminFetch('/api/admin/switch-model', {
      method: 'POST',
      body: JSON.stringify({ model: modelName })
    });
  }

  /**
   * Resets local analytics counters.
   */
  public async resetMetrics(): Promise<{ status: string; message: string }> {
    return adminFetch('/api/admin/reset-metrics', {
      method: 'POST'
    });
  }
}

export const adminService = new AdminService();

