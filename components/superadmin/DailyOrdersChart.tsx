import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type DailyOrdersChartProps = {
  data: any[];
};

const DailyOrdersChart: React.FC<DailyOrdersChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
          labelStyle={{ color: '#475569', fontWeight: 600 }}
        />
        <Legend />
        <Bar dataKey="orders" fill="#8b5cf6" name="Orders" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DailyOrdersChart;
