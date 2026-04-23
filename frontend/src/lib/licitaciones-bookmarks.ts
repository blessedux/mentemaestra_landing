export type BookmarkedLicitacion = {
  codigo: string;
  title?: string;
  buyer?: string;
  updatedAt: number;
};

const STORAGE_KEY = "mm_bookmarked_licitaciones_v1";

function safeParseJson<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function loadBookmarkedLicitaciones(): BookmarkedLicitacion[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParseJson<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  const items: BookmarkedLicitacion[] = [];
  for (const v of parsed) {
    if (!v || typeof v !== "object") continue;
    const o = v as Record<string, unknown>;
    const codigo = typeof o.codigo === "string" ? o.codigo : null;
    const updatedAt = typeof o.updatedAt === "number" ? o.updatedAt : null;
    if (!codigo || !updatedAt) continue;
    items.push({
      codigo,
      title: typeof o.title === "string" ? o.title : undefined,
      buyer: typeof o.buyer === "string" ? o.buyer : undefined,
      updatedAt,
    });
  }
  items.sort((a, b) => b.updatedAt - a.updatedAt);
  return items;
}

export function saveBookmarkedLicitaciones(items: BookmarkedLicitacion[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isBookmarked(codigo: string, items: BookmarkedLicitacion[]) {
  const c = codigo.trim();
  return items.some((x) => x.codigo === c);
}

export function toggleBookmark(
  lic: Omit<BookmarkedLicitacion, "updatedAt">,
  items: BookmarkedLicitacion[],
): BookmarkedLicitacion[] {
  const codigo = lic.codigo.trim();
  const exists = items.some((x) => x.codigo === codigo);
  if (exists) {
    return items.filter((x) => x.codigo !== codigo);
  }
  return [
    { codigo, title: lic.title, buyer: lic.buyer, updatedAt: Date.now() },
    ...items,
  ];
}

