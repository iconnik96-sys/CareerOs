import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

interface BreakdownPieChartProps {
  data: Array<{ name: string; value: number }>;
  colors?: string[];
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#64748b'];

export const BreakdownPieChart: React.FC<BreakdownPieChartProps> = ({
  data,
  colors = DEFAULT_COLORS
}) => {
  if (!data || data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        No category metrics available.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(0,0,0,0.4)" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem'
            }}
            formatter={(value: any, name: any) => [Number(value).toLocaleString(), name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: -10 }}>
        {data.slice(0, 5).map((item, i) => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[i % colors.length] }} />
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

