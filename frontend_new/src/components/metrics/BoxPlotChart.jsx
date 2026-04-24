import React, { useMemo } from 'react';
import {
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Bar, Cell, ReferenceLine, Rectangle
} from 'recharts';
import { computeBoxStats } from './BoxPlotUtils';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

/**
 * Reusable BoxPlotChart component.
 * Renders a box plot (whiskers + IQR box + median line) for each category.
 */
export default function BoxPlotChart({ data, title, subtitle, yLabel, yDomain, referenceLineY }) {
  if (!data || data.length === 0) return <div className="text-muted-foreground text-sm p-4">No data available</div>;

  // Compute stats for each category
  const chartData = useMemo(() => {
    return data.map((d, i) => {
      const stats = computeBoxStats(d.values);
      return {
        label: d.label,
        stats,
        fill: COLORS[i % COLORS.length],
        // Recharts needs a numeric bar value to render the Bar shape
        min: stats?.min ?? 0,
        q1: stats?.q1 ?? 0,
        median: stats?.median ?? 0,
        q3: stats?.q3 ?? 0,
        max: stats?.max ?? 0,
      };
    });
  }, [data]);

  // Compute y domain from all data
  const allValues = data.flatMap(d => d.values);
  const computedDomain = yDomain || [
    Math.floor(Math.min(...allValues) - 2),
    Math.ceil(Math.max(...allValues) + 2),
  ];

  // Custom shape for the box plot
  const BoxPlotShape = (props) => {
    const { x, y, width, height, index } = props;
    const item = chartData[index];
    if (!item || !item.stats) return null;

    const { min, q1, median, q3, max } = item.stats;
    const [yMin, yMax] = computedDomain;
    const fill = item.fill;

    // The bar's y and height represent the full plotting area for this bar
    // We need to compute where each stat value falls
    // y = top of the plotting area (corresponds to yMax of the domain)
    // y + height = bottom of the plotting area (corresponds to yMin of the domain)
    const plotTop = y; // pixel position of the top of the chart area
    const plotHeight = height; // pixel height of the chart area

    // Map a data value to a pixel Y position
    const mapY = (val) => {
      const ratio = (val - yMin) / (yMax - yMin);
      return plotTop + plotHeight - ratio * plotHeight;
    };

    const cx = x + width / 2;
    const boxWidth = Math.max(width * 0.5, 16);
    const bx = cx - boxWidth / 2;

    const yBoxTop = mapY(q3);
    const yBoxBottom = mapY(q1);
    const yMedian = mapY(median);
    const yWhiskerTop = mapY(max);
    const yWhiskerBottom = mapY(min);

    return (
      <g>
        {/* Whisker line: min to max */}
        <line x1={cx} y1={yWhiskerTop} x2={cx} y2={yWhiskerBottom} stroke={fill} strokeWidth={1.5} />
        {/* Max cap */}
        <line x1={cx - boxWidth / 3} y1={yWhiskerTop} x2={cx + boxWidth / 3} y2={yWhiskerTop} stroke={fill} strokeWidth={2} />
        {/* Min cap */}
        <line x1={cx - boxWidth / 3} y1={yWhiskerBottom} x2={cx + boxWidth / 3} y2={yWhiskerBottom} stroke={fill} strokeWidth={2} />
        {/* IQR Box */}
        <rect
          x={bx} y={yBoxTop}
          width={boxWidth}
          height={Math.max(yBoxBottom - yBoxTop, 1)}
          fill={fill} fillOpacity={0.25}
          stroke={fill} strokeWidth={1.5} rx={3}
        />
        {/* Median line */}
        <line x1={bx} y1={yMedian} x2={bx + boxWidth} y2={yMedian} stroke={fill} strokeWidth={2.5} />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis
          domain={computedDomain}
          tick={{ fontSize: 12 }}
          label={yLabel ? { value: yLabel, angle: -90, position: 'insideLeft', style: { fontSize: 11 } } : undefined}
        />
        <Tooltip
          content={({ payload }) => {
            if (!payload || !payload[0]) return null;
            const s = payload[0].payload.stats;
            if (!s) return null;
            return (
              <div className="bg-card border border-border p-2.5 rounded-lg shadow-lg text-xs">
                <p className="font-semibold mb-1">{payload[0].payload.label}</p>
                <p>Max: {s.max.toFixed(1)}</p>
                <p>Q3: {s.q3.toFixed(1)}</p>
                <p className="font-semibold">Median: {s.median.toFixed(1)}</p>
                <p>Q1: {s.q1.toFixed(1)}</p>
                <p>Min: {s.min.toFixed(1)}</p>
              </div>
            );
          }}
        />
        {referenceLineY !== undefined && (
          <ReferenceLine y={referenceLineY} stroke="#888" strokeDasharray="4 4" label={{ value: '0', position: 'left', fontSize: 11 }} />
        )}
        {/* Invisible bar that provides the coordinate system for our custom shape */}
        <Bar dataKey="max" fill="transparent" shape={<BoxPlotShape />}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill="transparent" />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
