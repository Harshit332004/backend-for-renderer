import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InventoryLevelOverTime() {
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
    apiClient.get(`/agent/metrics/inventory-level-over-time?product_name=${encodeURIComponent(selected)}`)
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selected]);

  if (loading) return <div className="animate-pulse h-[280px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;

  const maxStock = Math.max(...(data?.data || []).map(d => d.stock_level), 50);

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
        <AreaChart data={data?.data || []} margin={{ top: 5, right: 20, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }} />
          <YAxis domain={[0, maxStock + 20]} tick={{ fontSize: 11 }} label={{ value: 'Stock Units', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey="stock_level" stroke="#10b981" fill="url(#stockGradient)" strokeWidth={2} name="Stock Level" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
