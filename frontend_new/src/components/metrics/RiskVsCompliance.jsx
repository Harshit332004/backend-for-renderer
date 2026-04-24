import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import BoxPlotChart from './BoxPlotChart';

export default function RiskVsCompliance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/agent/metrics/risk-vs-compliance')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-[280px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;

  const chartData = (data || []).map(d => ({ label: d.risk_level, values: d.compliance_scores }));

  return <BoxPlotChart data={chartData} yLabel="Compliance Score" yDomain={[60, 100]} />;
}
