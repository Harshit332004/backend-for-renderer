import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ErrorBar, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#f97316', '#10b981', '#ef4444'];

export default function AIResponseTime() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/agent/metrics/ai-response-time')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-[280px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;

  const chartData = (data || []).map(d => ({
    ...d,
    name: d.competitor_zone,
    value: d.avg_response_time,
    errorVal: d.std_dev,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 3.5]} tick={{ fontSize: 11 }} label={{ value: 'Avg Response (min)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
        <Tooltip
          formatter={(v, name) => name === 'value' ? `${v.toFixed(2)} min` : `${v.toFixed(2)}`}
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <ErrorBar dataKey="errorVal" width={6} strokeWidth={2} stroke="#666" />
          {chartData.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
