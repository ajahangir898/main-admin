import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type TenantGrowthChartProps = {
  data: any[];
};

const TenantGrowthChart: React.FC<TenantGrowthChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          labelStyle={{ color: '#475569', fontWeight: 600 }}
        />
        <Legend />
        <Line type="monotone" dataKey="tenants" stroke="#3b82f6" strokeWidth={2} name="Total Tenants" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TenantGrowthChart;
