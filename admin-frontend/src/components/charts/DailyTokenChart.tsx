import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { DailyTrendItem } from '../../types/admin';

interface DailyTokenChartProps {
  data: DailyTrendItem[];
  metricKey?: 'tokens' | 'cost_inr' | 'requests';
}

export const DailyTokenChart: React.FC<DailyTokenChartProps> = ({
  data,
  metricKey = 'tokens'
}) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No historical token telemetry recorded for this range.
      </div>
    );
  }

  const formatYAxis = (val: number) => {
    if (metricKey === 'cost_inr') return `₹${val}`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`;
    return String(val);
  };

  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.08)' }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatYAxis}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
            }}
            formatter={(value: any) => [
              metricKey === 'cost_inr'
                ? `₹${Number(value).toFixed(4)}`
                : Number(value).toLocaleString(),
              metricKey === 'cost_inr' ? 'Est. Cost (INR)' : metricKey === 'tokens' ? 'Tokens' : 'Requests'
            ]}
          />
          <Area
            type="monotone"
            dataKey={metricKey}
            stroke={metricKey === 'cost_inr' ? '#10b981' : '#3b82f6'}
            strokeWidth={2}
            fillOpacity={1}
            fill={metricKey === 'cost_inr' ? 'url(#costGradient)' : 'url(#tokenGradient)'}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

