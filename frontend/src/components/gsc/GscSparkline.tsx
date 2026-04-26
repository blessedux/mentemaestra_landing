"use client";

type Point = { value: number };

type Props = {
  data: Point[];
  color?: string;
  className?: string;
};

/**
 * Lightweight SVG polyline sparkline — no chart library required.
 * Scales values to fit the 100×32 viewBox.
 */
export default function GscSparkline({
  data,
  color = "#c9a07a",
  className,
}: Props) {
  if (!data.length) return null;

  const W = 100;
  const H = 32;
  const PAD = 2;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) =>
    PAD + (i / Math.max(values.length - 1, 1)) * (W - PAD * 2);
  const toY = (v: number) =>
    H - PAD - ((v - min) / range) * (H - PAD * 2);

  const points = values.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");

  // Area fill: close the path at the bottom.
  const areaPoints = [
    `${toX(0)},${H - PAD}`,
    ...values.map((v, i) => `${toX(i)},${toY(v)}`),
    `${toX(values.length - 1)},${H - PAD}`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`sg-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace("#", "")})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
