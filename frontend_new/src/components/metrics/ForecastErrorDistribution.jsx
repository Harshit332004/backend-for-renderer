import React, { useState, useEffect } from 'react';
import apiClient from '@/api/client';
import BoxPlotChart from './BoxPlotChart';

export default function ForecastErrorDistribution() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/agent/metrics/forecast-error-distribution')
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-[280px] bg-muted/30 rounded-lg" />;
  if (error) return <div className="text-red-400 text-sm p-4">Error: {error}</div>;

  const chartData = (data || []).map(d => ({ label: d.product_name, values: d.errors }));

  return <BoxPlotChart data={chartData} yLabel="Forecast Error (units)" yDomain={[-4, 4]} referenceLineY={0} />;
}
