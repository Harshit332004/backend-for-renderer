import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ActualVsForecast() {
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
    apiClient.get(`/agent/metrics/actual-vs-forecast?product_name=${encodeURIComponent(selected)}`)
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
          <YAxis tick={{ fontSize: 11 }} label={{ value: 'Units', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="actual" name="Actual Demand" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="predicted" name="Forecast Demand" stroke="#f97316" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
