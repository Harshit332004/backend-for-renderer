import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COMPETITORS = [
  { key: 'LocalMart', color: '#3b82f6', dash: '0' },
  { key: 'SpeedKart', color: '#f97316', dash: '5 5' },
  { key: 'HyperDeal', color: '#10b981', dash: '3 3' },
  { key: 'BazaarNow', color: '#ef4444', dash: '8 3 2 3' },
];

export default function CompetitorPricingTrends() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/agent/metrics/available-products')
      .then(res => {
        setProducts(res.data.products || []);
        if (res.data.products?.length > 0) setSelected(res.data.products[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    apiClient.get(`/agent/metrics/competitor-pricing-trends?product_name=${encodeURIComponent(selected)}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (loading) return <div className="animate-pulse h-[280px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;

  return (
    <div>
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="mb-3 text-sm bg-background border border-border rounded-md px-3 py-1.5 text-foreground"
      >
        {products.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data?.data || []} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
          <YAxis tick={{ fontSize: 11 }} domain={[90, 130]} label={{ value: 'Avg Price (Rs.)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {COMPETITORS.map(c => (
            <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color} strokeDasharray={c.dash} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
