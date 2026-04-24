/**
 * Server component — renders a NotionBlock[] tree into your portal UI.
 *
 * Block types covered in v1:
 *   paragraph, heading_1/2/3, bulleted/numbered/to_do list items, toggle,
 *   callout, quote, code, divider, image, video (external), bookmark,
 *   link_preview, child_database (inline row query), child_page (linked route),
 *   column_list (stacked on mobile, columns on md+), unsupported (fallback).
 *
 * Consecutive list items of the same list type are automatically grouped into
 * <ul> / <ol> wrappers so indentation and spacing look natural.
 */

import type { NotionBlock, RichTextSpan } from "@/lib/notion-client";
import { getDatabaseMeta, queryProjectDatabase } from "@/lib/notion-client";
import ToggleBlock from "./ToggleBlock";
import NotionDatabaseGallery from "./NotionDatabaseGallery";
import NotionKanbanBoard from "./NotionKanbanBoard";

// ---------------------------------------------------------------------------
// Notion colour → Tailwind class helpers
// ---------------------------------------------------------------------------

const COLOR_TEXT: Record<string, string> = {
  gray: "text-zinc-500",
  brown: "text-amber-700",
  orange: "text-orange-500",
  yellow: "text-yellow-500",
  green: "text-emerald-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  pink: "text-pink-500",
  red: "text-red-500",
};

const COLOR_BG: Record<string, string> = {
  gray_background: "bg-zinc-900/60",
  brown_background: "bg-amber-950/40",
  orange_background: "bg-orange-950/40",
  yellow_background: "bg-yellow-950/40",
  green_background: "bg-emerald-950/40",
  blue_background: "bg-blue-950/40",
  purple_background: "bg-purple-950/40",
  pink_background: "bg-pink-950/40",
  red_background: "bg-red-950/40",
};

function colorClass(
  color: string | null,
): { text: string; bg: string } {
  if (!color) return { text: "", bg: "" };
  return {
    text: COLOR_TEXT[color] ?? "",
    bg: COLOR_BG[color] ?? "",
  };
}

// ---------------------------------------------------------------------------
// Rich text renderer
// ---------------------------------------------------------------------------

export function RichText({ spans }: { spans: RichTextSpan[] }) {
  if (!spans.length) return null;
  return (
    <>
      {spans.map((span, i) => {
        const cls = [
          span.bold ? "font-semibold" : "",
          span.italic ? "italic" : "",
          span.strikethrough ? "line-through" : "",
          span.underline ? "underline underline-offset-2" : "",
          span.code
            ? "rounded bg-zinc-900 px-1 py-0.5 font-mono text-[0.85em] text-zinc-300"
            : "",
          span.color ? (COLOR_TEXT[span.color] ?? "") : "",
        ]
          .filter(Boolean)
          .join(" ");

        const content = span.text;
        const inner = cls ? <span className={cls}>{content}</span> : content;

        if (span.href) {
          return (
            <a
              key={i}
              href={span.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c9a07a] underline underline-offset-2"
            >
              {inner}
            </a>
          );
        }
        return <span key={i}>{inner}</span>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Block group list coalescing
// ---------------------------------------------------------------------------

type ListGroup = {
  kind: "bulleted" | "numbered";
  items: Array<{ block: NotionBlock & { type: "bulleted_list_item" | "numbered_list_item" }; index: number }>;
  startIndex: number;
};

type GroupedItem =
  | { kind: "block"; block: NotionBlock; index: number }
  | { kind: "list_group"; group: ListGroup };

/**
 * Group consecutive bulleted/numbered list items into synthetic groups so we
 * can wrap them in <ul>/<ol>.
 */
function groupListItems(blocks: NotionBlock[]): GroupedItem[] {
  const result: GroupedItem[] = [];
  let currentGroup: ListGroup | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const isBulleted = block.type === "bulleted_list_item";
    const isNumbered = block.type === "numbered_list_item";

    if (isBulleted || isNumbered) {
      const kind = isBulleted ? "bulleted" : "numbered";
      if (!currentGroup || currentGroup.kind !== kind) {
        if (currentGroup) result.push({ kind: "list_group", group: currentGroup });
        currentGroup = { kind, items: [], startIndex: i };
      }
      currentGroup.items.push({
        block: block as NotionBlock & { type: "bulleted_list_item" | "numbered_list_item" },
        index: i,
      });
    } else {
      if (currentGroup) {
        result.push({ kind: "list_group", group: currentGroup });
        currentGroup = null;
      }
      result.push({ kind: "block", block, index: i });
    }
  }
  if (currentGroup) result.push({ kind: "list_group", group: currentGroup });
  return result;
}

// ---------------------------------------------------------------------------
// Video embed helper
// ---------------------------------------------------------------------------

function videoEmbedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "youtu.be") {
      const vid =
        u.searchParams.get("v") ??
        (host === "youtu.be" ? u.pathname.slice(1) : null);
      return vid ? `https://www.youtube-nocookie.com/embed/${vid}` : null;
    }
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "loom.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const id = parts[1] ?? parts[0];
      return id ? `https://www.loom.com/embed/${id}` : null;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

// ---------------------------------------------------------------------------
// Single block renderer
// ---------------------------------------------------------------------------

type BlockProps = {
  block: NotionBlock;
  slug: string;
};

async function Block({ block, slug }: BlockProps) {
  const id = block.id;

  switch (block.type) {
    // Paragraph
    case "paragraph": {
      const { text, bg } = colorClass(block.color);
      if (!block.rich_text.length && !block.children.length) {
        return <div className="h-4" />;
      }
      return (
        <div className={["my-1 leading-7 text-zinc-300", text, bg ? `${bg} rounded px-2 py-1` : ""].filter(Boolean).join(" ")}>
          <RichText spans={block.rich_text} />
          {block.children.length > 0 && (
            <div className="mt-1 pl-4">
              <NotionBlocks blocks={block.children} slug={slug} />
            </div>
          )}
        </div>
      );
    }

    // Headings
    case "heading_1": {
      const { text } = colorClass(block.color);
      const content = (
        <h2 className={["mt-8 mb-3 text-2xl font-bold text-zinc-50", text].filter(Boolean).join(" ")}>
          <RichText spans={block.rich_text} />
        </h2>
      );
      if (block.is_toggleable) {
        return (
          <ToggleBlock summary={content}>
            <NotionBlocks blocks={block.children} slug={slug} />
          </ToggleBlock>
        );
      }
      return content;
    }
    case "heading_2": {
      const { text } = colorClass(block.color);
      const content = (
        <h3 className={["mt-6 mb-2 text-xl font-semibold text-zinc-50", text].filter(Boolean).join(" ")}>
          <RichText spans={block.rich_text} />
        </h3>
      );
      if (block.is_toggleable) {
        return (
          <ToggleBlock summary={content}>
            <NotionBlocks blocks={block.children} slug={slug} />
          </ToggleBlock>
        );
      }
      return content;
    }
    case "heading_3": {
      const { text } = colorClass(block.color);
      const content = (
        <h4 className={["mt-4 mb-1.5 text-base font-semibold text-zinc-200", text].filter(Boolean).join(" ")}>
          <RichText spans={block.rich_text} />
        </h4>
      );
      if (block.is_toggleable) {
        return (
          <ToggleBlock summary={content}>
            <NotionBlocks blocks={block.children} slug={slug} />
          </ToggleBlock>
        );
      }
      return content;
    }

    // List items — rendered individually inside their <ul>/<ol> wrapper below.
    case "bulleted_list_item":
    case "numbered_list_item": {
      const { text } = colorClass(block.color);
      return (
        <li className={["leading-7 text-zinc-300", text].filter(Boolean).join(" ")}>
          <RichText spans={block.rich_text} />
          {block.children.length > 0 && (
            <div className="mt-1 pl-4">
              <NotionBlocks blocks={block.children} slug={slug} />
            </div>
          )}
        </li>
      );
    }

    // To-do
    case "to_do": {
      const { text } = colorClass(block.color);
      return (
        <div className={["my-0.5 flex items-start gap-2 leading-7 text-zinc-300", text].filter(Boolean).join(" ")}>
          <span
            className={[
              "mt-1 flex h-4 w-4 flex-none items-center justify-center rounded border",
              block.checked
                ? "border-[#c9a07a]/60 bg-[#c9a07a]/20 text-[#c9a07a]"
                : "border-zinc-700 bg-zinc-900",
            ].join(" ")}
            aria-hidden
          >
            {block.checked ? "✓" : ""}
          </span>
          <span className={block.checked ? "line-through text-zinc-500" : ""}>
            <RichText spans={block.rich_text} />
          </span>
          {block.children.length > 0 && (
            <div className="mt-1 pl-6">
              <NotionBlocks blocks={block.children} slug={slug} />
            </div>
          )}
        </div>
      );
    }

    // Toggle
    case "toggle": {
      const summary = (
        <span className="leading-7 text-zinc-300">
          <RichText spans={block.rich_text} />
        </span>
      );
      return (
        <ToggleBlock summary={summary}>
          <NotionBlocks blocks={block.children} slug={slug} />
        </ToggleBlock>
      );
    }

    // Callout
    case "callout": {
      const { bg } = colorClass(block.color ?? "gray_background");
      return (
        <div
          className={[
            "my-3 flex gap-3 rounded-lg border border-zinc-800 p-4",
            bg || "bg-zinc-900/60",
          ].join(" ")}
        >
          {block.icon ? (
            <span className="flex-none text-lg leading-7" aria-hidden>
              {block.icon.startsWith("http") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.icon} alt="" className="h-6 w-6 object-contain" />
              ) : (
                block.icon
              )}
            </span>
          ) : null}
          <div className="flex-1 leading-7 text-zinc-300">
            <RichText spans={block.rich_text} />
            {block.children.length > 0 && (
              <div className="mt-1">
                <NotionBlocks blocks={block.children} slug={slug} />
              </div>
            )}
          </div>
        </div>
      );
    }

    // Quote
    case "quote": {
      const { text } = colorClass(block.color);
      return (
        <blockquote
          className={[
            "my-3 border-l-2 border-[#c9a07a]/60 pl-4 leading-7 text-zinc-400 italic",
            text,
          ].filter(Boolean).join(" ")}
        >
          <RichText spans={block.rich_text} />
          {block.children.length > 0 && (
            <div className="mt-1">
              <NotionBlocks blocks={block.children} slug={slug} />
            </div>
          )}
        </blockquote>
      );
    }

    // Code
    case "code": {
      return (
        <div className="my-3">
          {block.language && block.language !== "plain text" ? (
            <div className="rounded-t-lg border border-b-0 border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] uppercase tracking-widest text-zinc-500">
              {block.language}
            </div>
          ) : null}
          <pre
            className={[
              "overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm leading-6 text-zinc-300",
              block.language && block.language !== "plain text" ? "rounded-t-none" : "",
            ].filter(Boolean).join(" ")}
          >
            <code>
              <RichText spans={block.rich_text} />
            </code>
          </pre>
          {block.caption.length > 0 && (
            <p className="mt-1 text-xs text-zinc-500">
              <RichText spans={block.caption} />
            </p>
          )}
        </div>
      );
    }

    // Divider
    case "divider":
      return <hr key={id} className="my-6 border-zinc-800" />;

    // Image
    case "image": {
      if (!block.url) return null;
      return (
        <figure className="my-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.url}
            alt={block.caption.map((s) => s.text).join("") || "Imagen"}
            className="rounded-lg border border-zinc-800 w-full object-contain max-h-[600px]"
            loading="lazy"
          />
          {block.caption.length > 0 && (
            <figcaption className="mt-1.5 text-center text-xs text-zinc-500">
              <RichText spans={block.caption} />
            </figcaption>
          )}
        </figure>
      );
    }

    // Video
    case "video": {
      if (!block.url) return null;
      const embedSrc = videoEmbedSrc(block.url);
      if (embedSrc) {
        return (
          <figure className="my-4">
            <div className="relative overflow-hidden rounded-lg border border-zinc-800 pb-[56.25%]">
              <iframe
                src={embedSrc}
                title={block.caption.map((s) => s.text).join("") || "Video"}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {block.caption.length > 0 && (
              <figcaption className="mt-1.5 text-center text-xs text-zinc-500">
                <RichText spans={block.caption} />
              </figcaption>
            )}
          </figure>
        );
      }
      // Non-embed video URL: render a link.
      return (
        <div className="my-3">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[#c9a07a] underline underline-offset-2"
          >
            ▶ {block.caption.length ? block.caption.map((s) => s.text).join("") : "Ver video"}
          </a>
        </div>
      );
    }

    // Bookmark / link_preview / embed — all become an external link card
    case "bookmark":
    case "link_preview":
    case "embed": {
      const url = block.url;
      const caption = block.type === "bookmark" ? block.caption : block.type === "embed" ? block.caption : [];
      if (!url) return null;
      // For embed/video hosts, try to render inline
      if (block.type === "embed") {
        const embedSrc = videoEmbedSrc(url);
        if (embedSrc) {
          return (
            <figure className="my-4">
              <div className="relative overflow-hidden rounded-lg border border-zinc-800 pb-[56.25%]">
                <iframe
                  src={embedSrc}
                  title={caption.length ? caption.map((s) => s.text).join("") : "Embed"}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {caption.length > 0 && (
                <figcaption className="mt-1.5 text-center text-xs text-zinc-500">
                  <RichText spans={caption} />
                </figcaption>
              )}
            </figure>
          );
        }
      }
      return (
        <div className="my-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-[#c9a07a] transition hover:border-zinc-700"
          >
            <span className="flex-none text-zinc-600">↗</span>
            <span className="flex-1 truncate underline underline-offset-2">
              {caption.length ? caption.map((s) => s.text).join("") : url}
            </span>
          </a>
        </div>
      );
    }

    // File attachment / PDF — download card
    case "file": {
      if (!block.url) return null;
      const name = block.name || "archivo";
      const lowerName = name.toLowerCase();
      const lowerUrl = block.url.toLowerCase().split("?")[0];
      const isPdf =
        lowerName.endsWith(".pdf") || lowerUrl.endsWith(".pdf");
      const isImage =
        /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lowerUrl) ||
        /\.(png|jpe?g|gif|webp|svg|avif)$/.test(lowerName);
      const emoji = isPdf ? "📄" : isImage ? "🖼" : "📎";
      return (
        <div className="my-3">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-zinc-100 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/80"
          >
            <span className="flex-none text-2xl" aria-hidden="true">{emoji}</span>
            <span className="flex-1 font-medium truncate">{name}</span>
            <span className="flex-none text-xs text-zinc-500">Descargar ↓</span>
          </a>
          {block.caption.length > 0 && (
            <p className="mt-1 px-1 text-xs text-zinc-500">
              <RichText spans={block.caption} />
            </p>
          )}
        </div>
      );
    }

    // Child database → inline gallery or kanban board (fetched server-side)
    case "child_database": {
      const rowsResult = await queryProjectDatabase(block.id);
      const isBoard = block.columns !== null && (block.columns?.length ?? 0) > 0;

      // Build title/icon element
      const icon = block.icon;
      const iconEl = icon ? (
        icon.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-6 w-6 object-contain" />
        ) : (
          <span className="text-xl leading-none">{icon}</span>
        )
      ) : (
        <span className="text-xl leading-none text-zinc-500">{isBoard ? "🗃" : "🗂"}</span>
      );

      // If we couldn't fetch the rows, fall back to a simple link card
      if (!rowsResult.ok || rowsResult.rows.length === 0) {
        if (!rowsResult.ok && rowsResult.reason === "no_data_source") {
          return (
            <div className="my-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
              <span className="font-medium text-zinc-200">{block.title}</span>
              {": "}
              Esta base es una vista enlazada en Notion; la API no permite leerla
              en el portal. Pide a tu operador que use la base original o una
              copia completa (no enlazada).
            </div>
          );
        }
        return (
          <a
            href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(id)}`}
            className="my-2 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-zinc-100 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/80"
          >
            <span className="flex-none" aria-hidden="true">{iconEl}</span>
            <span className="flex-1 font-medium">{block.title || "Base de datos"}</span>
            <span className="flex-none text-xs text-zinc-600">
              {isBoard ? "Ver tablero →" : "Ver →"}
            </span>
          </a>
        );
      }

      // Kanban board preview
      if (isBoard) {
        return (
          <div className="my-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span aria-hidden="true">{iconEl}</span>
                <h3 className="text-lg font-semibold text-zinc-100">
                  {block.title || "Tablero"}
                </h3>
              </div>
              <a
                href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(id)}`}
                className="flex-none rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 transition hover:border-[#c9a07a]/40 hover:text-zinc-200"
              >
                Ver tablero completo →
              </a>
            </div>
            <NotionKanbanBoard
              columns={block.columns!}
              rows={rowsResult.rows}
              slug={slug}
              preview
            />
          </div>
        );
      }

      // Gallery / list view
      return (
        <div className="my-6">
          <div className="mb-4 flex items-center gap-2">
            <span aria-hidden="true">{iconEl}</span>
            <h3 className="text-lg font-semibold text-zinc-100">
              {block.title || "Base de datos"}
            </h3>
          </div>
          <NotionDatabaseGallery rows={rowsResult.rows} slug={slug} />
        </div>
      );
    }

    // Child page link → nested block route
    case "child_page": {
      const icon = block.icon;
      const iconEl = icon ? (
        icon.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <span>{icon}</span>
        )
      ) : (
        <span>📄</span>
      );
      return (
        <a
          href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(id)}`}
          className="my-1 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-zinc-100 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/80"
        >
          <span className="flex-none text-lg text-zinc-500" aria-hidden="true">{iconEl}</span>
          <span className="flex-1 font-medium">{block.title || "Subpágina"}</span>
          <span className="flex-none text-xs text-zinc-600">Abrir →</span>
        </a>
      );
    }

    // link_to_page — shortcut/alias to another page or database
    case "link_to_page": {
      if (!block.targetId) return null;

      // For database shortcuts: fetch metadata + rows and render inline,
      // exactly like a child_database block.
      if (block.targetType === "database_id") {
        const [dbMeta, rowsResult] = await Promise.all([
          getDatabaseMeta(block.targetId),
          queryProjectDatabase(block.targetId),
        ]);

        const isBoard = (dbMeta.boardColumns?.length ?? 0) > 0;
        const dbTitle = dbMeta.title || "Base de datos";

        const dbIconRaw = dbMeta.icon;
        const dbIconEl = dbIconRaw ? (
          dbIconRaw.type === "url" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dbIconRaw.value} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-xl leading-none">{dbIconRaw.value}</span>
          )
        ) : (
          <span className="text-xl leading-none text-zinc-500">{isBoard ? "🗃" : "🗂"}</span>
        );

        // Fallback link card when rows unavailable
        if (!rowsResult.ok || rowsResult.rows.length === 0) {
          if (!rowsResult.ok && rowsResult.reason === "no_data_source") {
            return (
              <div className="my-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
                <span className="font-medium text-zinc-200">{dbTitle}</span>
                {": "}
                Esta base es una vista enlazada en Notion; la API no permite leerla
                en el portal. Pide a tu operador que use la base original o una
                copia completa (no enlazada).
              </div>
            );
          }
          return (
            <a
              href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(block.targetId)}`}
              className="my-2 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-zinc-100 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/80"
            >
              <span className="flex-none" aria-hidden="true">{dbIconEl}</span>
              <span className="flex-1 font-medium">{dbTitle}</span>
              <span className="flex-none text-xs text-zinc-600">
                {isBoard ? "Ver tablero →" : "Ver →"}
              </span>
            </a>
          );
        }

        // Kanban board preview
        if (isBoard) {
          return (
            <div className="my-6">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span aria-hidden="true">{dbIconEl}</span>
                  <h3 className="text-lg font-semibold text-zinc-100">{dbTitle}</h3>
                </div>
                <a
                  href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(block.targetId)}`}
                  className="flex-none rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400 transition hover:border-[#c9a07a]/40 hover:text-zinc-200"
                >
                  Ver tablero completo →
                </a>
              </div>
              <NotionKanbanBoard
                columns={dbMeta.boardColumns!}
                rows={rowsResult.rows}
                slug={slug}
                preview
              />
            </div>
          );
        }

        // Gallery / list fallback
        return (
          <div className="my-6">
            <div className="mb-4 flex items-center gap-2">
              <span aria-hidden="true">{dbIconEl}</span>
              <h3 className="text-lg font-semibold text-zinc-100">{dbTitle}</h3>
            </div>
            <NotionDatabaseGallery rows={rowsResult.rows} slug={slug} />
          </div>
        );
      }

      // Page shortcut — render as a page link card
      return (
        <a
          href={`/client/${encodeURIComponent(slug)}/notion/${encodeURIComponent(block.targetId)}`}
          className="my-1 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 text-zinc-100 transition hover:border-[#c9a07a]/40 hover:bg-zinc-900/80"
        >
          <span className="flex-none text-lg text-zinc-500" aria-hidden="true">📄</span>
          <span className="flex-1 font-medium text-sm">Ver página</span>
          <span className="flex-none text-xs text-zinc-600">Abrir →</span>
        </a>
      );
    }

    // Table — render as a styled HTML table
    case "table": {
      if (!block.rows.length) return null;
      return (
        <div className="my-4 overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full min-w-max text-sm text-zinc-300">
            <tbody className="divide-y divide-zinc-800">
              {block.rows.map((row, ri) => (
                <tr
                  key={`${id}-row-${ri}`}
                  className={ri === 0 && block.has_column_header ? "bg-zinc-900/80" : "bg-zinc-950/40 even:bg-zinc-900/20"}
                >
                  {row.map((cell, ci) => {
                    const Tag = (ri === 0 && block.has_column_header) || (ci === 0 && block.has_row_header) ? "th" : "td";
                    return (
                      <Tag
                        key={`${id}-cell-${ri}-${ci}`}
                        className={[
                          "px-4 py-2.5 text-left align-top",
                          Tag === "th" ? "font-semibold text-zinc-100" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        <RichText spans={cell} />
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Synced block — render its children (original or synced copy)
    case "synced_block":
      if (!block.children.length) return null;
      return <NotionBlocks blocks={block.children} slug={slug} />;

    // Column layout (stacked mobile, flex md+)
    case "column_list":
      return (
        <div className="my-4 flex flex-col gap-4 md:flex-row md:gap-6">
          {block.columns.map((col, i) => (
            <div key={`${id}-col-${i}`} className="flex-1">
              <NotionBlocks blocks={col} slug={slug} />
            </div>
          ))}
        </div>
      );

    // Unsupported — only show label in dev; silently omit in production
    case "unsupported":
      if (process.env.NODE_ENV === "development" && block.rawType !== "table_of_contents" && block.rawType !== "breadcrumb") {
        return (
          <div className="my-1 rounded border border-dashed border-zinc-800 px-3 py-1.5 text-xs text-zinc-600">
            Bloque no soportado: {block.rawType}
          </div>
        );
      }
      return null;

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// NotionBlocks — renders a list of blocks with list-group coalescing
// ---------------------------------------------------------------------------

type NotionBlocksProps = {
  blocks: NotionBlock[];
  slug: string;
};

export default async function NotionBlocks({ blocks, slug }: NotionBlocksProps) {
  if (!blocks.length) return null;
  const grouped = groupListItems(blocks);

  return (
    <div>
      {await Promise.all(
        grouped.map(async (item, i) => {
          if (item.kind === "list_group") {
            const { group } = item;
            const Tag = group.kind === "bulleted" ? "ul" : "ol";
            const listClass =
              group.kind === "bulleted"
                ? "my-2 ml-5 list-disc space-y-0.5 text-zinc-300"
                : "my-2 ml-5 list-decimal space-y-0.5 text-zinc-300";
            return (
              <Tag key={`list-${group.startIndex}`} className={listClass}>
                {await Promise.all(
                  group.items.map(async ({ block: b, index }) => (
                    <Block key={`${b.id}-${index}`} block={b} slug={slug} />
                  )),
                )}
              </Tag>
            );
          }
          return (
            <Block key={`${item.block.id}-${i}`} block={item.block} slug={slug} />
          );
        }),
      )}
    </div>
  );
}
