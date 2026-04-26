import type { VercelAnalyticsDashboardData } from "@/lib/vercel-analytics-client";

type Props = {
  data: VercelAnalyticsDashboardData;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function fmtPct(n: number | null): string {
  if (n === null) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function fmtDuration(sec: number | null): string {
  if (sec === null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4">
      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-50">{value}</p>
    </div>
  );
}

function MiniList({
  title,
  rows,
  labelKey,
  valueKey,
}: {
  title: string;
  rows: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
}) {
  if (!rows.length) return null;
  const maxVal = Math.max(...rows.map((r) => Number(r[valueKey]) || 0));

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {title}
        </h3>
      </div>
      <ul className="divide-y divide-zinc-900">
        {rows.map((row, i) => {
          const pct = maxVal > 0 ? (Number(row[valueKey]) / maxVal) * 100 : 0;
          return (
            <li key={i} className="px-4 py-2.5">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="min-w-0 truncate text-xs text-zinc-200">
                  {String(row[labelKey])}
                </span>
                <span className="shrink-0 tabular-nums text-xs text-zinc-400">
                  {fmt(Number(row[valueKey]))}
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-zinc-800">
                <div
                  className="h-1 rounded-full bg-[#c9a07a]/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function VercelAnalyticsDashboard({ data }: Props) {
  const { overview, topPages, topReferrers, topCountries, devices, dateRange } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          Tráfico del portal
        </h2>
        <p className="text-xs text-zinc-500">
          <span className="tabular-nums text-zinc-400">
            {fmtDate(dateRange.start)} – {fmtDate(dateRange.end)}
          </span>
        </p>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard label="Visitantes" value={fmt(overview.visitors)} />
        <MetricCard label="Páginas vistas" value={fmt(overview.pageviews)} />
        <MetricCard label="Tasa de rebote" value={fmtPct(overview.bounceRate)} />
        <MetricCard label="Duración media" value={fmtDuration(overview.avgDurationSec)} />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MiniList
          title="Páginas más visitadas (portal)"
          rows={topPages.map((p) => ({ label: p.path, value: p.total }))}
          labelKey="label"
          valueKey="value"
        />
        <MiniList
          title="Fuentes de tráfico"
          rows={topReferrers.map((r) => ({ label: r.referrer, value: r.total }))}
          labelKey="label"
          valueKey="value"
        />
        <MiniList
          title="Países"
          rows={topCountries.map((c) => ({ label: c.country, value: c.total }))}
          labelKey="label"
          valueKey="value"
        />
        <MiniList
          title="Dispositivos"
          rows={devices.map((d) => ({ label: d.device, value: d.total }))}
          labelKey="label"
          valueKey="value"
        />
      </div>
    </div>
  );
}
