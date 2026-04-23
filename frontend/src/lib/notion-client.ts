import "server-only";

/**
 * Notion integration for client portals.
 *
 * Supports two modes driven by `projects.notion_url`:
 *   - Database URL → query rows (existing behavior, preserved unchanged).
 *   - Page URL → fetch block tree, render with NotionBlocks components.
 *
 * We hit the REST API directly. The @notionhq/client SDK v5 dropped the
 * database.query helper in favour of a more complex data-sources model; the
 * REST endpoints are stable and sufficient.
 *
 * Setup (one-time per workspace): Notion Settings → Connections → Develop/manage
 * integrations → create internal integration → copy token into NOTION_API_KEY.
 * Per page/DB: open it in Notion → "···" → Connections → pick the integration.
 * Without this connection all queries return `unauthorized`.
 */

const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_API_VERSION = "2022-06-28";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export function getNotionApiKey(): string | null {
  const v = process.env.NOTION_API_KEY?.trim();
  return v && v.length > 0 ? v : null;
}

// ---------------------------------------------------------------------------
// ID parsing
// ---------------------------------------------------------------------------

/**
 * Extract a 32-hex Notion id from any Notion URL (page or database) and
 * return it in dashed UUID form. Also accepts an already-dashed UUID directly
 * (e.g. the id stored in notionMode.id after a first parse).
 *   https://www.notion.so/workspace/Title-32hexchars?v=viewId
 *   https://www.notion.so/32hexchars
 *   31e3124d-efbd-838a-8356-01a69566d441   ← already dashed, returned as-is
 */
export function parseNotionId(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Already a dashed UUID — return it normalised without trying to URL-parse.
  const DASHED_UUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (DASHED_UUID.test(trimmed)) return trimmed.toLowerCase();

  const clean = trimmed.split("#")[0];
  const lastPath = clean.split("?")[0].split("/").filter(Boolean).pop() ?? "";

  const HEX32 = /([0-9a-fA-F]{32})/;
  const m = lastPath.match(HEX32) ?? clean.match(HEX32);
  return m ? toDashedUuid(m[1]) : null;
}

/** @deprecated Use parseNotionId — kept for existing callers. */
export const parseNotionDatabaseId = parseNotionId;

function toDashedUuid(hex32: string): string {
  const s = hex32.toLowerCase();
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */

type NotionFetchError =
  | "unauthorized"
  | "not_found"
  | "rate_limited"
  | "unknown";

type NotionFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: NotionFetchError };

async function notionFetch<T = unknown>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<NotionFetchResult<T>> {
  const key = getNotionApiKey();
  if (!key) return { ok: false, reason: "unauthorized" };

  try {
    const res = await fetch(`${NOTION_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        "Notion-Version": NOTION_API_VERSION,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      next: init?.next ?? { revalidate: 60 },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403)
        return { ok: false, reason: "unauthorized" };
      if (res.status === 404) return { ok: false, reason: "not_found" };
      if (res.status === 429) return { ok: false, reason: "rate_limited" };
      const body = await res.text().catch(() => "");
      // Notion returns 400 validation_error when the caller passes a page id to
      // a database endpoint ("Provided ID is a page, not a database"). Map that
      // to not_found so resolveNotionContentMode switches to page mode.
      if (res.status === 400 && body.includes("validation_error")) {
        return { ok: false, reason: "not_found" };
      }
      console.error("[notion-client] request failed", res.status, path, body);
      return { ok: false, reason: "unknown" };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    console.error("[notion-client] fetch threw", path, err);
    return { ok: false, reason: "unknown" };
  }
}

// ---------------------------------------------------------------------------
// Page vs database detection
// ---------------------------------------------------------------------------

export type NotionContentMode =
  | { mode: "database"; id: string }
  | { mode: "page"; id: string }
  | { mode: "error"; reason: NotionFetchError };

/**
 * Given a URL stored in `projects.notion_url`, determine whether it resolves
 * to a Notion database (→ DB mode, render row list) or a page (→ block tree
 * mode, render NotionPortalPage). Uses a HEAD-style GET on the database
 * endpoint: if it returns 200 it's a database; 404/object_not_found means
 * it's a page (or a DB the integration can't access as a DB).
 */
export async function resolveNotionContentMode(
  url: string | null,
): Promise<NotionContentMode> {
  const id = parseNotionId(url);
  if (!id) return { mode: "error", reason: "not_found" };
  if (!getNotionApiKey()) return { mode: "error", reason: "unauthorized" };

  const result = await notionFetch<{ object: string }>(
    `/databases/${encodeURIComponent(id)}`,
    { method: "GET" },
  );

  if (result.ok) {
    // Notion returned a database object.
    return { mode: "database", id };
  }

  if (result.reason === "not_found") {
    // Not a database or not connected as one → treat as page.
    return { mode: "page", id };
  }

  // unauthorized / rate_limited / unknown
  return { mode: "error", reason: result.reason };
}

// ---------------------------------------------------------------------------
// Database row query (preserved unchanged)
// ---------------------------------------------------------------------------

export type ProjectRow = {
  id: string;
  title: string;
  status: string | null;
  statusColor: string | null;
  date: string | null;
  tags: { name: string; color: string | null }[];
  summary: string | null;
  /** Cover image URL from the page object (external or uploaded). */
  coverUrl: string | null;
  /** Emoji or image URL icon from the page object. */
  icon: string | null;
};

export type QueryResult =
  | { ok: true; rows: ProjectRow[] }
  | { ok: false; reason: NotionFetchError };

function getPlainText(rich: any): string {
  if (!Array.isArray(rich)) return "";
  return rich
    .map((r) => (typeof r?.plain_text === "string" ? r.plain_text : ""))
    .join("")
    .trim();
}

function pickFirstProperty(
  properties: Record<string, any>,
  predicate: (p: any) => boolean,
): any | null {
  for (const key of Object.keys(properties)) {
    const p = properties[key];
    if (p && predicate(p)) return p;
  }
  return null;
}

function mapPageToRow(page: any): ProjectRow {
  const props = (page?.properties ?? {}) as Record<string, any>;
  const titleProp = pickFirstProperty(props, (p) => p?.type === "title");
  const title = titleProp ? getPlainText(titleProp.title) : "";

  const statusProp =
    pickFirstProperty(props, (p) => p?.type === "status") ??
    pickFirstProperty(props, (p) => p?.type === "select");
  let status: string | null = null;
  let statusColor: string | null = null;
  if (statusProp?.type === "status" && statusProp.status) {
    status = statusProp.status.name ?? null;
    statusColor = statusProp.status.color ?? null;
  } else if (statusProp?.type === "select" && statusProp.select) {
    status = statusProp.select.name ?? null;
    statusColor = statusProp.select.color ?? null;
  }

  const dateProp = pickFirstProperty(props, (p) => p?.type === "date");
  const date: string | null = dateProp?.date?.start ?? null;

  const multiProp = pickFirstProperty(props, (p) => p?.type === "multi_select");
  const tags: ProjectRow["tags"] = Array.isArray(multiProp?.multi_select)
    ? multiProp.multi_select.map((t: any) => ({
        name: typeof t?.name === "string" ? t.name : "",
        color: typeof t?.color === "string" ? t.color : null,
      }))
    : [];

  const richProp = pickFirstProperty(props, (p) => p?.type === "rich_text");
  const summary = richProp ? getPlainText(richProp.rich_text) : "";

  const coverUrl = extractCoverUrl(page);
  const pageIcon = extractIconFromObject(page);
  const icon =
    pageIcon?.type === "emoji"
      ? pageIcon.value
      : pageIcon?.type === "url"
        ? pageIcon.value
        : null;

  return {
    id: String(page?.id ?? ""),
    title,
    status,
    statusColor,
    date,
    tags: tags.filter((t) => t.name.length > 0),
    summary: summary.length > 0 ? summary : null,
    coverUrl,
    icon,
  };
}

export async function queryProjectDatabase(
  databaseId: string,
): Promise<QueryResult> {
  const result = await notionFetch<{ results?: unknown[] }>(
    `/databases/${encodeURIComponent(databaseId)}/query`,
    {
      method: "POST",
      body: JSON.stringify({ page_size: 50 }),
    },
  );

  if (!result.ok) return { ok: false, reason: result.reason };
  const results = Array.isArray(result.data.results)
    ? result.data.results
    : [];
  return { ok: true, rows: results.map((r) => mapPageToRow(r)) };
}

// ---------------------------------------------------------------------------
// Block tree fetch
// ---------------------------------------------------------------------------

/** Serializable rich text span. */
export type RichTextSpan = {
  text: string;
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  code: boolean;
  underline: boolean;
  color: string | null;
  href: string | null;
};

export type NotionColor =
  | "default"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "gray_background"
  | "brown_background"
  | "orange_background"
  | "yellow_background"
  | "green_background"
  | "blue_background"
  | "purple_background"
  | "pink_background"
  | "red_background";

// ---------------------------------------------------------------------------
// Page metadata (icon, cover) — used for banner images and page card icons
// ---------------------------------------------------------------------------

/** An icon attached to a Notion page or database. */
export type PageIcon =
  | { type: "emoji"; value: string }
  | { type: "url"; value: string }
  | null;

/** A single Kanban board column (a status/select option). */
export type BoardColumn = {
  id: string;
  name: string;
  color: string | null;
};

export type PageMeta = {
  icon: PageIcon;
  coverUrl: string | null;
  title: string | null;
  /** Non-null when the database uses Notion's built-in `status` property. */
  boardColumns: BoardColumn[] | null;
};

function extractIconFromObject(obj: unknown): PageIcon {
  const iconObj = (obj as any)?.icon;
  if (!iconObj) return null;
  if (iconObj.type === "emoji") return { type: "emoji", value: String(iconObj.emoji ?? "") };
  if (iconObj.type === "external") return { type: "url", value: String(iconObj.external?.url ?? "") };
  if (iconObj.type === "file") return { type: "url", value: String(iconObj.file?.url ?? "") };
  return null;
}

function extractCoverUrl(obj: unknown): string | null {
  const cover = (obj as any)?.cover;
  if (!cover) return null;
  if (cover.type === "external") return String(cover.external?.url ?? "") || null;
  if (cover.type === "file") return String(cover.file?.url ?? "") || null;
  return null;
}

/**
 * Extracts ordered Kanban columns from a database object.
 * Checks Notion's built-in `status` type first (which carries group order),
 * then falls back to `select` type — matching the same priority used by
 * `mapPageToRow` when it reads `row.status`, so column names match row values.
 * Returns null when neither property type is present.
 */
function extractBoardColumns(obj: unknown): BoardColumn[] | null {
  const props = (obj as any)?.properties ?? {};

  // Priority 1: Notion's built-in `status` type (has ordered groups)
  for (const prop of Object.values(props)) {
    const p = prop as any;
    if (p?.type !== "status") continue;

    const options: any[] = p?.status?.options ?? [];
    const groups: any[] = p?.status?.groups ?? [];

    // Notion groups define the visual display order for board columns
    let orderedOptions = options;
    if (groups.length > 0) {
      const ordered: any[] = [];
      for (const g of groups) {
        for (const optId of (g?.option_ids ?? [])) {
          const opt = options.find((o: any) => o.id === optId);
          if (opt) ordered.push(opt);
        }
      }
      if (ordered.length > 0) orderedOptions = ordered;
    }

    if (orderedOptions.length === 0) continue;
    return orderedOptions.map((o: any) => ({
      id: String(o?.id ?? ""),
      name: String(o?.name ?? ""),
      color: String(o?.color ?? "") || null,
    }));
  }

  // Priority 2: `select` type (common in custom task boards)
  for (const prop of Object.values(props)) {
    const p = prop as any;
    if (p?.type !== "select") continue;
    const options: any[] = p?.select?.options ?? [];
    if (options.length === 0) continue;
    return options.map((o: any) => ({
      id: String(o?.id ?? ""),
      name: String(o?.name ?? ""),
      color: String(o?.color ?? "") || null,
    }));
  }

  return null;
}

function extractTitleFromObject(obj: unknown): string | null {
  const o = obj as any;
  if (!o) return null;

  // Database object — top-level `title` is rich_text[]
  if (o.object === "database" && Array.isArray(o.title)) {
    const t = getPlainText(o.title);
    return t.length > 0 ? t : null;
  }

  // Page object — find the property with type "title"
  if (o.object === "page" && o.properties) {
    const prop = pickFirstProperty(o.properties as Record<string, any>, (p) => p?.type === "title");
    if (prop) {
      const t = getPlainText(prop.title);
      return t.length > 0 ? t : null;
    }
  }

  return null;
}

/**
 * Fetch metadata for a Notion page (icon, cover, title).
 * Tries /pages/{id} first, falls back to /databases/{id}.
 * Never throws — returns all-null on any failure.
 *
 * NOTE: when you already know the ID is a database, prefer
 * `getDatabaseMeta` to avoid an unnecessary /pages request and
 * to ensure `boardColumns` is always populated.
 */
export async function getPageMeta(id: string): Promise<PageMeta> {
  const pageResult = await notionFetch<unknown>(`/pages/${encodeURIComponent(id)}`);
  if (pageResult.ok) {
    // Guard: Notion can occasionally return a database object via /pages/{id}.
    // If that happens, extract board columns from it too.
    const isDb = (pageResult.data as any)?.object === "database";
    return {
      icon: extractIconFromObject(pageResult.data),
      coverUrl: extractCoverUrl(pageResult.data),
      title: extractTitleFromObject(pageResult.data),
      boardColumns: isDb ? extractBoardColumns(pageResult.data) : null,
    };
  }
  const dbResult = await notionFetch<unknown>(`/databases/${encodeURIComponent(id)}`);
  if (dbResult.ok) {
    return {
      icon: extractIconFromObject(dbResult.data),
      coverUrl: extractCoverUrl(dbResult.data),
      title: extractTitleFromObject(dbResult.data),
      boardColumns: extractBoardColumns(dbResult.data),
    };
  }
  return { icon: null, coverUrl: null, title: null, boardColumns: null };
}

/**
 * Fetch metadata directly from /databases/{id} — use this when you already
 * know the ID is a Notion database (e.g. after resolveNotionContentMode
 * returns mode === "database"). Skips the /pages fallback so board columns
 * are never missed.
 */
export async function getDatabaseMeta(id: string): Promise<PageMeta> {
  const result = await notionFetch<unknown>(`/databases/${encodeURIComponent(id)}`);
  if (result.ok) {
    return {
      icon: extractIconFromObject(result.data),
      coverUrl: extractCoverUrl(result.data),
      title: extractTitleFromObject(result.data),
      boardColumns: extractBoardColumns(result.data),
    };
  }
  return { icon: null, coverUrl: null, title: null, boardColumns: null };
}

// ---------------------------------------------------------------------------

/** Serializable block node — add new types here as needed. */
export type NotionBlock =
  | { type: "paragraph"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; children: NotionBlock[] }
  | { type: "heading_1"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; is_toggleable: boolean; children: NotionBlock[] }
  | { type: "heading_2"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; is_toggleable: boolean; children: NotionBlock[] }
  | { type: "heading_3"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; is_toggleable: boolean; children: NotionBlock[] }
  | { type: "bulleted_list_item"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; children: NotionBlock[] }
  | { type: "numbered_list_item"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; children: NotionBlock[] }
  | { type: "to_do"; id: string; rich_text: RichTextSpan[]; checked: boolean; color: NotionColor | null; children: NotionBlock[] }
  | { type: "toggle"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; children: NotionBlock[] }
  | { type: "callout"; id: string; rich_text: RichTextSpan[]; icon: string | null; color: NotionColor | null; children: NotionBlock[] }
  | { type: "quote"; id: string; rich_text: RichTextSpan[]; color: NotionColor | null; children: NotionBlock[] }
  | { type: "code"; id: string; rich_text: RichTextSpan[]; language: string; caption: RichTextSpan[] }
  | { type: "divider"; id: string }
  | { type: "image"; id: string; url: string; caption: RichTextSpan[] }
  | { type: "video"; id: string; url: string; caption: RichTextSpan[] }
  | { type: "file"; id: string; url: string; name: string; caption: RichTextSpan[] }
  | { type: "bookmark"; id: string; url: string; caption: RichTextSpan[] }
  | { type: "link_preview"; id: string; url: string }
  | { type: "embed"; id: string; url: string; caption: RichTextSpan[] }
  | { type: "child_database"; id: string; title: string; icon: string | null; columns: BoardColumn[] | null }
  | { type: "child_page"; id: string; title: string; icon: string | null }
  | { type: "column_list"; id: string; columns: NotionBlock[][] }
  | {
      type: "table";
      id: string;
      has_column_header: boolean;
      has_row_header: boolean;
      /** Table body: each row is an array of cells; each cell is rich-text spans. */
      rows: RichTextSpan[][][];
    }
  | {
      type: "link_to_page";
      id: string;
      targetId: string;
      targetType: "page_id" | "database_id";
    }
  | { type: "synced_block"; id: string; children: NotionBlock[] }
  | { type: "unsupported"; id: string; rawType: string };

export type BlockTreeResult =
  | { ok: true; blocks: NotionBlock[] }
  | { ok: false; reason: NotionFetchError };

function mapRichText(raw: any): RichTextSpan[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r: any): RichTextSpan => ({
    text: typeof r?.plain_text === "string" ? r.plain_text : "",
    bold: r?.annotations?.bold === true,
    italic: r?.annotations?.italic === true,
    strikethrough: r?.annotations?.strikethrough === true,
    code: r?.annotations?.code === true,
    underline: r?.annotations?.underline === true,
    color:
      r?.annotations?.color && r.annotations.color !== "default"
        ? String(r.annotations.color)
        : null,
    href: typeof r?.href === "string" ? r.href : null,
  }));
}

function getFileUrl(file: any): string {
  if (!file) return "";
  if (file.type === "external") return String(file.external?.url ?? "");
  if (file.type === "file") return String(file.file?.url ?? "");
  return "";
}

type BlockChildrenPage = {
  results?: unknown[];
  has_more?: boolean;
  next_cursor?: string | null;
};

type ListChildrenResult =
  | { ok: true; blocks: any[] }
  | { ok: false; reason: NotionFetchError };

/**
 * Paginate GET /blocks/{id}/children until exhausted.
 * Returns { ok: false } when the very first request fails so callers can
 * surface a real error (auth, not_found) instead of silently showing empty.
 * Mid-pagination failures are tolerated: we return what we already fetched.
 */
async function listBlockChildren(
  blockId: string,
): Promise<ListChildrenResult> {
  const all: any[] = [];
  let cursor: string | null = null;
  let isFirstRequest = true;

  do {
    const path: string =
      `/blocks/${encodeURIComponent(blockId)}/children?page_size=100` +
      (cursor ? `&start_cursor=${encodeURIComponent(cursor)}` : "");
    const result = await notionFetch<BlockChildrenPage>(path, { method: "GET" });

    if (!result.ok) {
      // Propagate first-request failures so the caller can show the right error.
      if (isFirstRequest) return { ok: false, reason: result.reason };
      // Mid-pagination failure: return what we have so far.
      break;
    }
    isFirstRequest = false;
    const page = result.data;
    if (Array.isArray(page.results)) all.push(...page.results);
    cursor = page.has_more && page.next_cursor ? page.next_cursor : null;
  } while (cursor);

  return { ok: true, blocks: all };
}

/** Convenience wrapper that silently returns [] on failure (used for nested children). */
async function listBlockChildrenSilent(blockId: string): Promise<any[]> {
  const r = await listBlockChildren(blockId);
  return r.ok ? r.blocks : [];
}

/**
 * Recursively fetch children for blocks that may have them. We limit depth
 * to 4 (toggle inside toggle inside callout inside column is already rare)
 * to avoid runaway recursion on deeply nested Notion pages.
 */
const RECURSIVE_TYPES = new Set([
  "toggle",
  "bulleted_list_item",
  "numbered_list_item",
  "to_do",
  "callout",
  "quote",
  "paragraph",
  "heading_1",
  "heading_2",
  "heading_3",
  "column",
  "synced_block",
]);

async function mapBlock(raw: any, depth: number): Promise<NotionBlock> {
  const id = String(raw?.id ?? "");
  const t = String(raw?.type ?? "unsupported");
  const body = raw?.[t] ?? {};

  // Fetch children if the block has them and we haven't gone too deep.
  let children: NotionBlock[] = [];
  if (depth < 4 && raw?.has_children && RECURSIVE_TYPES.has(t)) {
    const rawChildren = await listBlockChildrenSilent(id);
    children = await Promise.all(
      rawChildren.map((c) => mapBlock(c, depth + 1)),
    );
  }

  switch (t) {
    case "paragraph":
      return { type: "paragraph", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, children };

    case "heading_1":
      return { type: "heading_1", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, is_toggleable: body.is_toggleable === true, children };
    case "heading_2":
      return { type: "heading_2", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, is_toggleable: body.is_toggleable === true, children };
    case "heading_3":
      return { type: "heading_3", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, is_toggleable: body.is_toggleable === true, children };

    case "bulleted_list_item":
      return { type: "bulleted_list_item", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, children };
    case "numbered_list_item":
      return { type: "numbered_list_item", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, children };
    case "to_do":
      return { type: "to_do", id, rich_text: mapRichText(body.rich_text), checked: body.checked === true, color: body.color ?? null, children };
    case "toggle":
      return { type: "toggle", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, children };

    case "callout": {
      const icon =
        raw.callout?.icon?.type === "emoji"
          ? String(raw.callout.icon.emoji ?? "")
          : raw.callout?.icon?.type === "external"
            ? String(raw.callout.icon.external?.url ?? "")
            : null;
      return { type: "callout", id, rich_text: mapRichText(body.rich_text), icon, color: body.color ?? null, children };
    }
    case "quote":
      return { type: "quote", id, rich_text: mapRichText(body.rich_text), color: body.color ?? null, children };
    case "code":
      return { type: "code", id, rich_text: mapRichText(body.rich_text), language: String(body.language ?? "plain text"), caption: mapRichText(body.caption) };
    case "divider":
      return { type: "divider", id };

    case "image":
      return { type: "image", id, url: getFileUrl(body), caption: mapRichText(body.caption) };
    case "video":
      return { type: "video", id, url: getFileUrl(body), caption: mapRichText(body.caption) };

    case "bookmark":
      return { type: "bookmark", id, url: String(body.url ?? ""), caption: mapRichText(body.caption) };
    case "link_preview":
      return { type: "link_preview", id, url: String(body.url ?? "") };

    case "file":
    case "pdf":
      return {
        type: "file",
        id,
        url: getFileUrl(body),
        name: String(body.name ?? (t === "pdf" ? "documento.pdf" : "archivo")),
        caption: mapRichText(body.caption),
      };

    case "child_database": {
      const dbMeta = await notionFetch<unknown>(`/databases/${encodeURIComponent(id)}`);
      const dbData = dbMeta.ok ? dbMeta.data : null;
      const dbIcon = dbData ? extractIconFromObject(dbData) : null;
      const iconStr = dbIcon?.type === "emoji" ? dbIcon.value : dbIcon?.type === "url" ? dbIcon.value : null;
      const columns = dbData ? extractBoardColumns(dbData) : null;
      return { type: "child_database", id, title: String(body.title ?? ""), icon: iconStr, columns };
    }
    case "child_page": {
      const pgMeta = await notionFetch<unknown>(`/pages/${encodeURIComponent(id)}`);
      const pgIcon = pgMeta.ok ? extractIconFromObject(pgMeta.data) : null;
      const iconStr = pgIcon?.type === "emoji" ? pgIcon.value : pgIcon?.type === "url" ? pgIcon.value : null;
      return { type: "child_page", id, title: String(body.title ?? ""), icon: iconStr };
    }

    case "column_list": {
      const rawCols = await listBlockChildrenSilent(id);
      const columns = await Promise.all(
        rawCols.map(async (col) => {
          const colBlocks = await listBlockChildrenSilent(String(col?.id ?? ""));
          return Promise.all(colBlocks.map((c) => mapBlock(c, depth + 1)));
        }),
      );
      return { type: "column_list", id, columns };
    }

    case "table": {
      // Fetch table_row children — each has `cells: rich_text[][]`
      const rawRows = await listBlockChildrenSilent(id);
      const rows = rawRows.map((row: any) => {
        const cells: any[] = Array.isArray(row?.table_row?.cells)
          ? row.table_row.cells
          : [];
        return cells.map((cell) => mapRichText(cell));
      });
      return {
        type: "table",
        id,
        has_column_header: body.has_column_header === true,
        has_row_header: body.has_row_header === true,
        rows,
      };
    }

    case "link_to_page": {
      const pageRef = body.page_id ?? null;
      const dbRef = body.database_id ?? null;
      const targetId = pageRef ?? dbRef ?? "";
      const targetType: "page_id" | "database_id" = pageRef
        ? "page_id"
        : "database_id";
      return { type: "link_to_page", id, targetId, targetType };
    }

    case "embed":
      return {
        type: "embed",
        id,
        url: String(body.url ?? ""),
        caption: mapRichText(body.caption),
      };

    case "synced_block": {
      const syncedChildren =
        depth < 4 && raw?.has_children
          ? await (async () => {
              const rawCh = await listBlockChildrenSilent(id);
              return Promise.all(rawCh.map((c) => mapBlock(c, depth + 1)));
            })()
          : ([] as NotionBlock[]);
      return { type: "synced_block", id, children: syncedChildren };
    }

    // Intentionally silenced — not useful in a portal context.
    case "table_of_contents":
    case "breadcrumb":
      return { type: "unsupported", id, rawType: t };

    default:
      return { type: "unsupported", id, rawType: t };
  }
}

/**
 * Fetch the full block tree for a Notion page.
 * Returns { ok: false } when access is denied, so callers show the right
 * error instead of a misleading "empty page" message.
 */
export async function fetchBlockTree(pageId: string): Promise<BlockTreeResult> {
  if (!getNotionApiKey()) return { ok: false, reason: "unauthorized" };

  const result = await listBlockChildren(pageId);
  if (!result.ok) return { ok: false, reason: result.reason };

  const blocks = await Promise.all(result.blocks.map((b) => mapBlock(b, 0)));
  return { ok: true, blocks };
}

/* eslint-enable @typescript-eslint/no-explicit-any */
