"use client";

import { useEffect, useRef, useState } from "react";
import type { DailySales } from "@/lib/api";
import { rupiah } from "@/lib/money";

const HEIGHT = 240;
const MARGIN = { top: 14, right: 16, bottom: 26, left: 48 };
const Y_DIVISIONS = 4;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const compactNumber = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function niceMax(value: number): number {
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (step * power >= value) return step * power;
  }
  return 10 * power;
}

function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(day)} ${MONTHS[Number(month) - 1]}`;
}

export function SalesChart({ data }: { data: DailySales[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 0);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const yMax = niceMax(Math.max(...data.map((d) => d.revenue), 1));
  const xAt = (index: number) =>
    MARGIN.left + (data.length < 2 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
  const yAt = (value: number) => MARGIN.top + innerHeight - (value / yMax) * innerHeight;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(d.revenue).toFixed(1)}`)
    .join("");
  const areaPath =
    data.length > 1
      ? `${linePath}L${xAt(data.length - 1).toFixed(1)},${yAt(0)}L${xAt(0).toFixed(1)},${yAt(0)}Z`
      : "";

  const xLabelStep = Math.max(1, Math.ceil(data.length / 6));
  const lastIndex = data.length - 1;
  const activePoint = active !== null ? data[active] : null;
  const tooltipLeft =
    active !== null ? Math.min(Math.max(xAt(active), 84), Math.max(width - 84, 84)) : 0;

  const moveActive = (clientX: number) => {
    const svgRect = containerRef.current?.getBoundingClientRect();
    if (!svgRect || data.length === 0 || innerWidth === 0) return;
    const ratio = (clientX - svgRect.left - MARGIN.left) / innerWidth;
    setActive(Math.min(Math.max(Math.round(ratio * lastIndex), 0), lastIndex));
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    setActive((current) =>
      Math.min(Math.max((current ?? lastIndex) + delta, 0), lastIndex),
    );
  };

  if (data.length === 0) {
    return <p className="py-16 text-center text-sm text-muted">No sales in this range.</p>;
  }

  return (
    <div ref={containerRef} className="relative select-none">
      <svg
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label={`Daily revenue from ${shortDate(data[0].date)} to ${shortDate(data[lastIndex].date)}. Use arrow keys to inspect days.`}
        tabIndex={0}
        className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-bright"
        onPointerMove={(event) => moveActive(event.clientX)}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
        onKeyDown={handleKeyDown}
      >
        {Array.from({ length: Y_DIVISIONS + 1 }, (_, i) => {
          const value = (yMax / Y_DIVISIONS) * i;
          return (
            <g key={i}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={yAt(value)}
                y2={yAt(value)}
                stroke="var(--color-line)"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 8}
                y={yAt(value) + 3}
                textAnchor="end"
                className="fill-muted font-mono text-[10px]"
              >
                {compactNumber.format(value)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) =>
          i % xLabelStep === 0 || i === lastIndex ? (
            <text
              key={d.date}
              x={xAt(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-muted font-mono text-[10px]"
            >
              {shortDate(d.date)}
            </text>
          ) : null,
        )}

        {areaPath && <path d={areaPath} fill="var(--color-accent)" fillOpacity={0.08} />}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active !== null && (
          <line
            x1={xAt(active)}
            x2={xAt(active)}
            y1={MARGIN.top}
            y2={MARGIN.top + innerHeight}
            stroke="var(--color-muted)"
            strokeWidth={1}
          />
        )}

        {[...new Set([active, lastIndex])]
          .filter((index): index is number => index !== null)
          .map((index) => (
            <g key={index}>
              <circle cx={xAt(index)} cy={yAt(data[index].revenue)} r={6} fill="var(--color-cream)" />
              <circle cx={xAt(index)} cy={yAt(data[index].revenue)} r={4} fill="var(--color-accent)" />
            </g>
          ))}

        {active === null && (
          <text
            x={Math.min(xAt(lastIndex), width - MARGIN.right)}
            y={yAt(data[lastIndex].revenue) - 12}
            textAnchor="end"
            className="fill-ink font-mono text-[11px] font-medium"
          >
            {compactNumber.format(data[lastIndex].revenue)}
          </text>
        )}
      </svg>

      {activePoint && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-[10px] border border-line bg-white px-3 py-2 shadow-sm"
          style={{ left: tooltipLeft }}
        >
          <p className="flex items-center gap-2 whitespace-nowrap font-mono text-sm font-semibold">
            <span className="inline-block h-0.5 w-3 rounded-full bg-accent" aria-hidden />
            {rupiah(activePoint.revenue)}
          </p>
          <p className="mt-0.5 whitespace-nowrap text-xs text-muted">
            {shortDate(activePoint.date)} · {activePoint.transactions}{" "}
            {activePoint.transactions === 1 ? "sale" : "sales"}
          </p>
        </div>
      )}
    </div>
  );
}
