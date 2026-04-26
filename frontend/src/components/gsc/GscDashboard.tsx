import type {
  GscDashboardData,
  GscQueryRow,
  GscPageRow,
} from "@/lib/gsc-client";
import GscSparkline from "./GscSparkline";

type Props = {
  data: GscDashboardData;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function fmtCtr(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtPos(n: number): string {
  return n.toFixed(1);
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

function truncate(s: string, max = 50): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function OverviewCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-4">
      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </p>
      <p className="text-2xl font-semibold tabular-nums text-zinc-50">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-zinc-500">{sub}</p> : null}
    </div>
  );
}

function DataTable<T>({
  title,
  rows,
  keyCol,
  keyLabel,
  cols,
}: {
  title: string;
  rows: T[];
  keyCol: (r: T) => string;
  keyLabel: string;
  cols: { label: string; value: (r: T) => string }[];
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
          {title}
        </h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-3 text-sm text-zinc-500">Sin datos para el período.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-zinc-900">
                <th className="px-4 py-2 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {keyLabel}
                </th>
                {cols.map((c) => (
                  <th
                    key={c.label}
                    className="px-4 py-2 text-right text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-500"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-zinc-200">
                    {truncate(keyCol(r))}
                  </td>
                  {cols.map((c) => (
                    <td
                      key={c.label}
                      className="px-4 py-2.5 text-right tabular-nums text-zinc-400"
                    >
                      {c.value(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function GscDashboard({ data }: Props) {
  const { overview, trend, topQueries, topPages, dateRange } = data;

  const trendClicks = trend.map((t) => ({ value: t.clicks }));
  const trendImpressions = trend.map((t) => ({ value: t.impressions }));

  return (
    <div className="space-y-6">
      {/* Date range label */}
      <p className="text-xs text-zinc-500">
        Últimos 28 días ·{" "}
        <span className="tabular-nums text-zinc-400">
          {fmtDate(dateRange.start)} – {fmtDate(dateRange.end)}
        </span>
      </p>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <OverviewCard label="Clics" value={fmt(overview.totalClicks)} />
        <OverviewCard label="Impresiones" value={fmt(overview.totalImpressions)} />
        <OverviewCard label="CTR promedio" value={fmtCtr(overview.avgCtr)} />
        <OverviewCard label="Posición promedio" value={fmtPos(overview.avgPosition)} />
      </div>

      {/* Trend sparklines */}
      {trendClicks.length > 1 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Clics · 28 días
            </p>
            <GscSparkline
              data={trendClicks}
              color="#c9a07a"
              className="h-10 w-full"
            />
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-4">
            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              Impresiones · 28 días
            </p>
            <GscSparkline
              data={trendImpressions}
              color="#60a5fa"
              className="h-10 w-full"
            />
          </div>
        </div>
      )}

      {/* Top queries */}
      <DataTable<GscQueryRow>
        title="Consultas principales"
        rows={topQueries}
        keyCol={(r) => r.query}
        keyLabel="Consulta"
        cols={[
          { label: "Clics", value: (r) => fmt(r.clicks) },
          { label: "Impresiones", value: (r) => fmt(r.impressions) },
          { label: "CTR", value: (r) => fmtCtr(r.ctr) },
          { label: "Posición", value: (r) => fmtPos(r.position) },
        ]}
      />

      {/* Top pages */}
      <DataTable<GscPageRow>
        title="Páginas principales"
        rows={topPages}
        keyCol={(r) => r.page}
        keyLabel="Página"
        cols={[
          { label: "Clics", value: (r) => fmt(r.clicks) },
          { label: "Impresiones", value: (r) => fmt(r.impressions) },
          { label: "CTR", value: (r) => fmtCtr(r.ctr) },
          { label: "Posición", value: (r) => fmtPos(r.position) },
        ]}
      />
    </div>
  );
}
