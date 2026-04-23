import type { BoardColumn, ProjectRow } from "@/lib/notion-client";

// Maps Notion status colors → Tailwind classes for the column dot indicator
const DOT_COLOR: Record<string, string> = {
  blue: "bg-blue-400",
  brown: "bg-amber-700",
  default: "bg-zinc-500",
  gray: "bg-zinc-500",
  green: "bg-emerald-400",
  orange: "bg-orange-400",
  pink: "bg-pink-400",
  purple: "bg-purple-400",
  red: "bg-red-400",
  yellow: "bg-yellow-400",
};

function KanbanCard({ row, slug }: { row: ProjectRow; slug: string }) {
  const iconIsUrl = row.icon?.startsWith("http");
  return (
    <a
      href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(row.id)}`}
      className="block rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900"
    >
      <div className="flex items-start gap-2">
        {row.icon && (
          <span className="mt-px flex-none text-sm leading-snug" aria-hidden>
            {iconIsUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.icon} alt="" className="h-4 w-4 object-contain" />
            ) : (
              row.icon
            )}
          </span>
        )}
        <p className="text-sm font-medium leading-snug text-zinc-100 line-clamp-2">
          {row.title || "(Sin título)"}
        </p>
      </div>

      {(row.date || row.tags.length > 0) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
          {row.date && (
            <span className="text-zinc-600">
              {new Date(row.date).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          )}
          {row.tags.slice(0, 2).map((tag) => (
            <span
              key={tag.name}
              className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-zinc-500"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

interface NotionKanbanBoardProps {
  columns: BoardColumn[];
  rows: ProjectRow[];
  slug: string;
  /** Compact inline preview — limits visible cards per column and reduces column width. */
  preview?: boolean;
}

export default function NotionKanbanBoard({
  columns,
  rows,
  slug,
  preview = false,
}: NotionKanbanBoardProps) {
  const maxCards = preview ? 3 : undefined;

  return (
    <div
      className={[
        "flex items-start gap-3 overflow-x-auto",
        preview ? "pb-2" : "pb-4",
      ].join(" ")}
    >
      {columns.map((col) => {
        const colRows = rows.filter(
          (r) => r.status === col.name
        );
        const displayed =
          maxCards !== undefined ? colRows.slice(0, maxCards) : colRows;
        const remaining =
          maxCards !== undefined ? colRows.length - displayed.length : 0;

        const dotCls =
          DOT_COLOR[(col.color ?? "default") as keyof typeof DOT_COLOR] ??
          DOT_COLOR.default;

        return (
          <div
            key={col.id || col.name}
            className={[
              "flex-none rounded-xl border border-zinc-800 bg-zinc-950/60 p-3",
              preview ? "w-52" : "w-72",
            ].join(" ")}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center gap-2">
              <span
                className={["h-2 w-2 flex-none rounded-full", dotCls].join(" ")}
                aria-hidden
              />
              <span className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {col.name}
              </span>
              <span className="ml-auto flex-none text-xs tabular-nums text-zinc-700">
                {colRows.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2">
              {displayed.map((row) => (
                <KanbanCard key={row.id} row={row} slug={slug} />
              ))}

              {remaining > 0 && (
                <p className="px-1 text-xs text-zinc-700">
                  +{remaining} más
                </p>
              )}

              {colRows.length === 0 && (
                <p className="px-1 text-xs text-zinc-800 select-none">—</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
