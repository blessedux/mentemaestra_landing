/**
 * Shared database renderer.
 * Automatically switches between gallery (rows with cover images) and
 * a compact list view (rows without covers, e.g. timeline databases).
 * Used both inline (inside NotionBlocks) and as a full page (subpage route).
 */

import type { ProjectRow } from "@/lib/notion-client";

const STATUS_COLOR: Record<string, string> = {
  gray: "border-zinc-600 text-zinc-400",
  brown: "border-amber-800 text-amber-500",
  orange: "border-orange-700 text-orange-400",
  yellow: "border-yellow-600 text-yellow-400",
  green: "border-emerald-700 text-emerald-400",
  blue: "border-blue-700 text-blue-400",
  purple: "border-purple-700 text-purple-400",
  pink: "border-pink-700 text-pink-400",
  red: "border-red-700 text-red-400",
  default: "border-zinc-700 text-zinc-300",
};

function GalleryCard({ row, slug }: { row: ProjectRow; slug: string }) {
  const iconIsUrl = row.icon?.startsWith("http");
  const statusCls =
    STATUS_COLOR[(row.statusColor ?? "default") as keyof typeof STATUS_COLOR] ??
    STATUS_COLOR.default;

  return (
    <a
      href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(row.id)}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60 transition hover:border-[#c9a07a]/50 hover:bg-zinc-900/70"
    >
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
        {row.coverUrl ? (
          <img
            src={row.coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/80 to-transparent" />
        {row.icon && (
          <div className="absolute bottom-2 left-3 leading-none">
            {iconIsUrl ? (
              <img src={row.icon} alt="" className="h-8 w-8 rounded object-contain" />
            ) : (
              <span className="text-2xl drop-shadow">{row.icon}</span>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <p className="line-clamp-2 font-medium leading-snug text-zinc-100">
          {row.title || "(Sin título)"}
        </p>
        {row.summary && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {row.summary}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {row.status && (
            <span className={["rounded-full border px-2 py-0.5 font-medium", statusCls].join(" ")}>
              {row.status}
            </span>
          )}
          {row.date && (
            <span className="text-zinc-600">
              {new Date(row.date).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          {row.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.name}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-400"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// List view — used when rows have no cover images (e.g. timeline databases)
// ---------------------------------------------------------------------------

function DatabaseList({ rows, slug }: { rows: ProjectRow[]; slug: string }) {
  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const statusCls =
          STATUS_COLOR[(row.statusColor ?? "default") as keyof typeof STATUS_COLOR] ??
          STATUS_COLOR.default;
        const iconIsUrl = row.icon?.startsWith("http");

        return (
          <a
            key={row.id}
            href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(row.id)}`}
            className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/70"
          >
            {/* Icon */}
            {row.icon && (
              <span className="flex-none text-xl leading-none" aria-hidden="true">
                {iconIsUrl ? (
                  <img src={row.icon} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  row.icon
                )}
              </span>
            )}

            {/* Title + summary */}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-zinc-100">
                {row.title || "(Sin título)"}
              </p>
              {row.summary && (
                <p className="mt-0.5 truncate text-xs text-zinc-500">{row.summary}</p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-none flex-wrap items-center justify-end gap-2 text-xs">
              {row.status && (
                <span className={["rounded-full border px-2 py-0.5 font-medium", statusCls].join(" ")}>
                  {row.status}
                </span>
              )}
              {row.date && (
                <span className="text-zinc-600">
                  {new Date(row.date).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {row.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag.name}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-zinc-400"
                >
                  {tag.name}
                </span>
              ))}
              <span className="text-zinc-700">→</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-switching export — gallery when covers exist, list otherwise
// ---------------------------------------------------------------------------

export default function NotionDatabaseGallery({
  rows,
  slug,
}: {
  rows: ProjectRow[];
  slug: string;
}) {
  const hasCovers = rows.some((r) => r.coverUrl);

  if (!hasCovers) {
    return <DatabaseList rows={rows} slug={slug} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => (
        <GalleryCard key={row.id} row={row} slug={slug} />
      ))}
    </div>
  );
}
