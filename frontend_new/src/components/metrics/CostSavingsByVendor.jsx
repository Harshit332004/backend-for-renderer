import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CostSavingsByVendor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/agent/metrics/cost-savings-by-vendor')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-[320px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;
  if (!data || data.length === 0) return <div className="text-muted-foreground text-sm p-4">No data</div>;

  const maxVal = Math.max(...data.map(d => d.cost_saving_pct));

  const getColor = (val) => {
    const ratio = maxVal > 0 ? val / maxVal : 0;
    const r = Math.round(30 + (1 - ratio) * 180);
    const g = Math.round(40 + ratio * 80);
    const b = Math.round(200 * ratio + 60);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 12 }} label={{ value: 'Cost Saving %', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }} />
        <YAxis type="category" dataKey="vendor_name" tick={{ fontSize: 11 }} width={75} />
        <Tooltip formatter={(v) => `${v.toFixed(1)}%`} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="cost_saving_pct" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.cost_saving_pct)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
