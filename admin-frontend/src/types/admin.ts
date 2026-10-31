export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  target_role: string;
  created_at: string;
  plan_id: 'free' | 'pro' | 'ultimate';
  subscription_status: string;
  quota_used: number;
  total_tokens: number;
  total_cost_inr: number;
}

export interface UserDetailData {
  user: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    full_name: string;
    college: string;
    target_role: string;
    readiness_score: number;
    plan_id: string;
    subscription_status: string;
    current_period_end?: string;
  };
  quota_history: Array<{
    feature: string;
    month: string;
    usage_count: number;
    updated_at: string;
  }>;
  recent_ai_activity: Array<{
    feature: string;
    provider: string;
    model: string;
    total_tokens: number;
    cost_inr: number;
    status: string;
    latency_ms: number;
    created_at: string;
  }>;
}

export interface OverviewMetrics {
  total_users: number;
  new_today: number;
  new_this_month: number;
  subscribers: {
    free: number;
    pro: number;
    ultimate: number;
  };
  financial: {
    total_revenue_inr: number;
    mrr_inr: number;
    successful_payments: number;
    failed_payments: number;
  };
  ai_usage: {
    total_requests: number;
    total_tokens: number;
    total_cost_inr: number;
    successful_requests: number;
    failed_requests: number;
  };
  health: {
    backend_status: string;
    database_connected: boolean;
    db_latency_ms?: number;
    schema_version?: string;
    provider: string;
    model: string;
  };
}

export interface DailyTrendItem {
  date: string;
  requests: number;
  tokens: number;
  cost_inr: number;
  avg_latency_ms: number;
}

export interface TopConsumer {
  user_id: string;
  name: string;
  request_count: number;
  total_tokens: number;
  cost_inr: number;
}

export interface AiAnalyticsResponse {
  status: string;
  timeframe_days: number;
  kpis: {
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_cost_inr: number;
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_latency_ms: number;
  };
  daily_trends: DailyTrendItem[];
  top_consumers: TopConsumer[];
  feature_breakdown: Record<string, { requests: number; tokens: number; cost_inr: number }>;
  model_breakdown: Record<string, { requests: number; tokens: number; cost_inr: number }>;
  recent_logs: Array<{
    id: string;
    timestamp: string;
    feature: string;
    provider: string;
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost_inr: number;
    status: string;
    latency_ms: number;
    user_id?: string;
  }>;
}

export interface PaymentOverviewResponse {
  status: string;
  financial_summary: {
    total_revenue_inr: number;
    mrr_inr: number;
    successful_payments: number;
    failed_payments: number;
    subscribers: {
      free: number;
      pro: number;
      ultimate: number;
    };
  };
  recent_transactions: Array<{
    id: string;
    payment_id: string;
    order_id: string;
    user_id: string;
    amount_inr: number;
    status: string;
    created_at: string;
  }>;
  recent_orders: Array<{
    id: string;
    purchase_id: string;
    plan_id: string;
    billing_cycle: string;
    amount_inr: number;
    status: string;
    created_at: string;
  }>;
}

export interface QuotaOverviewResponse {
  status: string;
  plan_quotas_catalog: Record<string, Record<string, number>>;
  feature_totals: Record<string, { total_consumptions: number; active_students: number }>;
  top_quota_consumers: Array<{
    user_id: string;
    student_name: string;
    feature: string;
    usage_count: number;
  }>;
}

export interface SystemHealthResponse {
  status: string;
  environment: string;
  backend: {
    service: string;
    version: string;
    uptime_status: string;
  };
  database: {
    connected: boolean;
    latency_ms?: number;
    schema_version?: string;
  };
  ai_engine: {
    provider: string;
    provider_id: string;
    active_model: string;
    is_configured: boolean;
    available_models: string[];
  };
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: Record<string, any>;
  status: string;
}

export interface AdminSettingsResponse {
  status: string;
  founder_email: string;
  ai_configuration: {
    provider: string;
    provider_id: string;
    active_model: string;
    available_models: string[];
    rates_inr_per_million: Record<string, { input: number; output: number; name: string; provider: string }>;
  };
  subscription_plans: Record<string, {
    price_inr: number;
    quotas: Record<string, number>;
  }>;
}

