import React, { useMemo, useState } from 'react';
import type { ChartSeries, ChartSpec } from '../interface';

/**
 * Charts for the data analysis page.
 *
 * The palette is the validated categorical order (blue, orange, aqua) taken in
 * fixed slot order, never cycled. Aqua sits below 3:1 against a white surface,
 * so every chart ships the relief the palette requires: direct value labels on
 * bars and a table view on all of them. Identity is never colour alone — one
 * series is named by the title, more than one gets a legend.
 */
const SERIES_COLORS = ['#2a78d6', '#eb6834', '#1baf7a'];

const INK = '#0b0b0b';
const INK_MUTED = '#52514e';
const GRID = '#e7e5e4';

const WIDTH = 720;
const HEIGHT = 300;
const PADDING = { top: 16, right: 16, bottom: 56, left: 56 };

const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

/** Axis labels are read at a glance, so they are short. */
const compact = (value: number): string => {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  if (absolute >= 10 || Number.isInteger(value)) return String(Math.round(value));
  return value.toFixed(2);
};

const exact = (value: number): string =>
  Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

/** A round number at or above the data, so the top gridline reads cleanly. */
const niceCeiling = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const scaled = value / magnitude;
  const step = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10;
  return step * magnitude;
};

interface Hover {
  label: string;
  rows: { name: string; value: number; color: string }[];
  /** Percentages, so the tooltip follows the SVG as it scales. */
  left: number;
  top: number;
}

const DataChart: React.FC<{ chart: ChartSpec }> = ({ chart }) => {
  const [hover, setHover] = useState<Hover | null>(null);
  const [showTable, setShowTable] = useState(false);

  // Memoised because it feeds the memos below: a fresh [] each render would
  // recompute the scales on every mouse move.
  const series = useMemo<ChartSeries[]>(() => chart.series ?? [], [chart.series]);
  const labels = useMemo(
    () => series[0]?.points.map((point) => point.x) ?? [],
    [series]
  );

  const maxValue = useMemo(() => {
    const values = series.flatMap((entry) => entry.points.map((point) => point.y ?? 0));
    return niceCeiling(Math.max(0, ...values));
  }, [series]);

  const minValue = useMemo(() => {
    const values = series.flatMap((entry) => entry.points.map((point) => point.y ?? 0));
    return Math.min(0, ...values);
  }, [series]);

  if (labels.length === 0) return null;

  const span = maxValue - minValue || 1;
  const yFor = (value: number) =>
    PADDING.top + PLOT_HEIGHT - ((value - minValue) / span) * PLOT_HEIGHT;

  const bandWidth = PLOT_WIDTH / labels.length;
  const centreFor = (index: number) => PADDING.left + bandWidth * (index + 0.5);

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map(
    (fraction) => minValue + span * fraction
  );

  // Long or many labels overlap horizontally, so they tilt instead.
  const tilt = labels.length > 7 || labels.some((label) => label.length > 8);

  const showValueLabels = chart.type === 'bar' && labels.length <= 12;

  const setHoverFor = (index: number) => {
    const rows = series
      .map((entry, seriesIndex) => ({
        name: entry.name,
        value: entry.points[index]?.y ?? 0,
        color: SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
      }))
      .filter((row) => row.value != null);

    setHover({
      label: labels[index],
      rows,
      left: (centreFor(index) / WIDTH) * 100,
      top: (yFor(Math.max(...rows.map((row) => row.value))) / HEIGHT) * 100,
    });
  };

  return (
    <figure className="bg-white rounded-lg border border-gray-200 p-4 m-0">
      <div className="flex items-start justify-between gap-3">
        <figcaption>
          <h3 className="text-sm font-semibold" style={{ color: INK }}>
            {chart.title}
          </h3>
          <p className="text-xs" style={{ color: INK_MUTED }}>
            {chart.y_label} by {chart.x_label}
            {chart.truncated && ` · top ${labels.length}`}
          </p>
        </figcaption>
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="flex-shrink-0 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
          aria-expanded={showTable}
        >
          {showTable ? 'Chart' : 'Table'}
        </button>
      </div>

      {series.length > 1 && (
        <ul className="flex flex-wrap gap-3 mt-2">
          {series.map((entry, index) => (
            <li key={entry.name} className="flex items-center gap-1.5 text-xs" style={{ color: INK_MUTED }}>
              <span
                className="inline-block w-3 h-2 rounded-sm"
                style={{ backgroundColor: SERIES_COLORS[index % SERIES_COLORS.length] }}
              />
              {entry.name}
            </li>
          ))}
        </ul>
      )}

      {showTable ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: INK_MUTED }}>
                <th className="text-left py-1 pr-3 font-medium">{chart.x_label}</th>
                {series.map((entry) => (
                  <th key={entry.name} className="text-right py-1 font-medium">
                    {entry.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, index) => (
                <tr key={label} className="border-t border-gray-100">
                  <td className="py-1 pr-3" style={{ color: INK }}>
                    {label}
                  </td>
                  {series.map((entry) => (
                    <td key={entry.name} className="py-1 text-right" style={{ color: INK }}>
                      {exact(entry.points[index]?.y ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative mt-2">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${chart.title}. ${chart.y_label} by ${chart.x_label}. Use the table view for the values.`}
            onMouseLeave={() => setHover(null)}
          >
            {/* Recessive grid: horizontal only, behind the marks. */}
            {gridValues.map((value) => (
              <g key={value}>
                <line
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={yFor(value)}
                  y2={yFor(value)}
                  stroke={GRID}
                  strokeWidth={1}
                />
                <text
                  x={PADDING.left - 8}
                  y={yFor(value) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill={INK_MUTED}
                >
                  {compact(value)}
                </text>
              </g>
            ))}

            {chart.type === 'line'
              ? series.map((entry, seriesIndex) => {
                  const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
                  const path = entry.points
                    .map(
                      (point, index) =>
                        `${index === 0 ? 'M' : 'L'} ${centreFor(index)} ${yFor(point.y ?? 0)}`
                    )
                    .join(' ');
                  return (
                    <g key={entry.name}>
                      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                      {entry.points.map((point, index) => (
                        <circle
                          key={point.x}
                          cx={centreFor(index)}
                          cy={yFor(point.y ?? 0)}
                          r={4}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      ))}
                    </g>
                  );
                })
              : series.map((entry, seriesIndex) => {
                  const color = SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
                  // A 2px gap of surface between neighbouring fills.
                  const barWidth = Math.max(
                    2,
                    bandWidth / series.length - 2 - Math.min(12, bandWidth * 0.25)
                  );
                  return (
                    <g key={entry.name}>
                      {entry.points.map((point, index) => {
                        const value = point.y ?? 0;
                        const top = yFor(Math.max(value, minValue));
                        const base = yFor(Math.min(0, minValue));
                        return (
                          <rect
                            key={point.x}
                            x={
                              centreFor(index) -
                              (barWidth * series.length + 2 * (series.length - 1)) / 2 +
                              seriesIndex * (barWidth + 2)
                            }
                            y={Math.min(top, base)}
                            width={barWidth}
                            height={Math.max(1, Math.abs(base - top))}
                            rx={4}
                            fill={color}
                          />
                        );
                      })}
                    </g>
                  );
                })}

            {showValueLabels &&
              series[0].points.map((point, index) => (
                <text
                  key={`label-${point.x}`}
                  x={centreFor(index)}
                  y={yFor(point.y ?? 0) - 6}
                  textAnchor="middle"
                  fontSize={11}
                  fill={INK_MUTED}
                >
                  {compact(point.y ?? 0)}
                </text>
              ))}

            {/* The baseline sits above the marks so bars read as anchored. */}
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(Math.min(0, minValue))}
              y2={yFor(Math.min(0, minValue))}
              stroke={INK_MUTED}
              strokeWidth={1}
            />

            {labels.map((label, index) => (
              <text
                key={`x-${label}`}
                x={centreFor(index)}
                y={HEIGHT - PADDING.bottom + 18}
                textAnchor={tilt ? 'end' : 'middle'}
                fontSize={11}
                fill={INK_MUTED}
                transform={tilt ? `rotate(-35 ${centreFor(index)} ${HEIGHT - PADDING.bottom + 18})` : undefined}
              >
                {label.length > 16 ? `${label.slice(0, 15)}…` : label}
              </text>
            ))}

            {/* Hit targets wider than the marks, so hovering is easy. */}
            {labels.map((label, index) => (
              <rect
                key={`hit-${label}`}
                x={PADDING.left + bandWidth * index}
                y={PADDING.top}
                width={bandWidth}
                height={PLOT_HEIGHT}
                fill="transparent"
                onMouseEnter={() => setHoverFor(index)}
              />
            ))}

            {hover && chart.type === 'line' && (
              <line
                x1={(hover.left / 100) * WIDTH}
                x2={(hover.left / 100) * WIDTH}
                y1={PADDING.top}
                y2={PADDING.top + PLOT_HEIGHT}
                stroke={INK_MUTED}
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-full mb-2 rounded-md border border-gray-200 bg-white px-2 py-1.5 shadow-lg text-xs"
              style={{ left: `${hover.left}%`, top: `${hover.top}%` }}
            >
              <p className="font-medium" style={{ color: INK }}>
                {hover.label}
              </p>
              {hover.rows.map((row) => (
                <p key={row.name} className="flex items-center gap-1.5" style={{ color: INK_MUTED }}>
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ backgroundColor: row.color }}
                  />
                  {exact(row.value)}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </figure>
  );
};

export default DataChart;
