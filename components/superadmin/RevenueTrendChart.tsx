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

type RevenueTrendChartProps = {
  data: any[];
};

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
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
        <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue (৳)" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default RevenueTrendChart;
