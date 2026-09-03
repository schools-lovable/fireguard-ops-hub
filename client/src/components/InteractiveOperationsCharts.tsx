import React, { type CSSProperties, useId, useMemo, useState } from "react";
import type { VisualizationDatum } from "@/lib/visualizationSeries";

type ChartProps = {
  ariaLabel: string;
  data: VisualizationDatum[];
  valueSuffix?: string;
};

const getPointPosition = (value: number, index: number, length: number, maximum: number) => ({
  x: length === 1 ? 50 : 5 + (index / (length - 1)) * 90,
  y: 88 - (value / maximum) * 70,
});

function ChartTooltip({ datum, valueSuffix = "" }: { datum: VisualizationDatum; valueSuffix?: string }) {
  return <div className="fg-chart-tooltip" role="status" aria-live="polite"><strong className="fg-chart-tooltip-label">{datum.label}</strong><span className="fg-chart-tooltip-value">{datum.value}{valueSuffix} · {datum.detail}</span></div>;
}

export function InteractiveLineChart({ ariaLabel, data, valueSuffix = "" }: ChartProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, data.length - 1));
  const areaGradientId = useId().replace(/:/g, "");
  const maximum = useMemo(() => Math.max(1, ...data.map(datum => datum.value)), [data]);
  const activeDatum = data[activeIndex] ?? data[0];
  const points = data.map((datum, index) => getPointPosition(datum.value, index, data.length, maximum));
  const polylinePoints = points.map(point => `${point.x},${point.y}`).join(" ");
  const areaPath = points.length ? `M ${points[0].x} 95 L ${points.map(point => `${point.x} ${point.y}`).join(" L ")} L ${points.at(-1)?.x ?? 95} 95 Z` : "";
  const activePoint = points[activeIndex] ?? points[0];
  const pointGrid = { "--fg-chart-points": data.length } as CSSProperties;

  return <figure className="fg-interactive-chart fg-line-chart" aria-label={ariaLabel}>
    <ChartTooltip datum={activeDatum} valueSuffix={valueSuffix} />
      <div className="fg-chart-plot" style={pointGrid}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={areaGradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".3" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs><g className="fg-chart-grid">{[22, 43, 64, 85].map(value => <line key={value} x1="5" x2="95" y1={value} y2={value} />)}</g>{areaPath && <path className="fg-chart-area" d={areaPath} fill={`url(#${areaGradientId})`} />}{activePoint && <line className="fg-chart-active-guide" x1={activePoint.x} x2={activePoint.x} y1="8" y2="95" /> }<polyline className="fg-chart-series" points={polylinePoints} fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />{points.map((point, index) => <circle key={data[index].id} cx={point.x} cy={point.y} r={index === activeIndex ? "3.3" : "2.2"} className={index === activeIndex ? "is-active" : ""} vectorEffect="non-scaling-stroke" />)}</svg>
      <div className="fg-chart-hit-targets">{data.map((datum, index) => <button key={datum.id} type="button" className={index === activeIndex ? "is-active" : ""} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} aria-label={`${datum.label}: ${datum.value}${valueSuffix}, ${datum.detail}`}><span className="sr-only">{datum.label}</span></button>)}</div>
    </div>
    <figcaption className="fg-chart-axis" style={pointGrid}>{data.map((datum, index) => <span className={index === activeIndex ? "is-active" : ""} key={datum.id} title={datum.label}>{datum.label}</span>)}</figcaption>
  </figure>;
}

export function InteractiveBarChart({ ariaLabel, data, valueSuffix = "" }: ChartProps) {
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, data.length - 1));
  const maximum = useMemo(() => Math.max(1, ...data.map(datum => datum.value)), [data]);
  const activeDatum = data[activeIndex] ?? data[0];
  const pointGrid = { "--fg-chart-points": data.length } as CSSProperties;

  const barTone = (id: string) => id === "complete" || id === "ready" ? "good" : id === "blocked" || id === "attention" ? "risk" : id === "awaiting_review" ? "review" : id === "scheduled" ? "scheduled" : "active";
  return <figure className="fg-interactive-chart fg-bar-chart" aria-label={ariaLabel}>
    <ChartTooltip datum={activeDatum} valueSuffix={valueSuffix} />
    <div className="fg-bar-plot" style={pointGrid}>{data.map((datum, index) => <button key={datum.id} type="button" className={`is-${barTone(datum.id)} ${index === activeIndex ? "is-active" : ""}`} style={{ height: `${Math.max(5, (datum.value / maximum) * 100)}%` }} onMouseEnter={() => setActiveIndex(index)} onFocus={() => setActiveIndex(index)} aria-label={`${datum.label}: ${datum.value}${valueSuffix}, ${datum.detail}`}><span className="fg-chart-value">{datum.value}{valueSuffix}</span><i aria-hidden="true" /></button>)}</div>
    <figcaption className="fg-chart-axis" style={pointGrid}>{data.map((datum, index) => <span className={index === activeIndex ? "is-active" : ""} key={datum.id} title={datum.label}>{datum.label}</span>)}</figcaption>
  </figure>;
}

type MeterProps = {
  label: string;
  value: number;
  total: number;
  tone?: "good" | "risk";
};

export function InteractiveMeter({ label, value, total, tone = "good" }: MeterProps) {
  const [isActive, setActive] = useState(false);
  const safeTotal = Math.max(1, total);
  const percentage = Math.round((value / safeTotal) * 100);
  return <div className={`meter-row is-interactive is-${tone} ${isActive ? "is-active" : ""}`}><span>{label}</span><strong>{value}</strong><button type="button" onMouseEnter={() => setActive(true)} onMouseLeave={() => setActive(false)} onFocus={() => setActive(true)} onBlur={() => setActive(false)} aria-label={`${label}: ${value} of ${total} sites, ${percentage}%`}><span style={{ width: `${Math.min(100, percentage)}%` }} /></button>{isActive && <span className="fg-meter-tooltip" role="status">{value} of {total} sites · {percentage}%</span>}</div>;
}
