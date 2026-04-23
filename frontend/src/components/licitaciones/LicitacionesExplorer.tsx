"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  isMercadoPublicoCodigoLicitacion,
  normalizeDdmmaaaa,
  type MercadoPublicoListadoResponse,
  type MercadoPublicoLicitacionEstado,
} from "@/lib/mercadopublico";
import {
  loadBookmarkedLicitaciones,
  toggleBookmark,
  type BookmarkedLicitacion,
} from "@/lib/licitaciones-bookmarks";

type UiResult = {
  codigo: string;
  raw: unknown;
  title?: string;
  buyer?: string;
};

function pickString(o: unknown, path: string[]): string | undefined {
  let cur: unknown = o;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === "string" ? cur : undefined;
}

function extractResults(payload: MercadoPublicoListadoResponse): UiResult[] {
  const listado = payload?.Listado;
  if (!Array.isArray(listado)) return [];
  const out: UiResult[] = [];
  for (const item of listado) {
    const codigo =
      pickString(item, ["Codigo"]) ??
      pickString(item, ["CodigoExterno"]) ??
      pickString(item, ["CodigoLicitacion"]) ??
      pickString(item, ["Codigo"]) ??
      undefined;
    if (!codigo || typeof codigo !== "string") continue;
    const title =
      pickString(item, ["Nombre"]) ??
      pickString(item, ["NombreLicitacion"]) ??
      pickString(item, ["Titulo"]) ??
      pickString(item, ["Descripcion"]) ??
      undefined;
    const buyer =
      pickString(item, ["Comprador", "NombreOrganismo"]) ??
      pickString(item, ["Comprador", "Nombre"]) ??
      pickString(item, ["NombreOrganismo"]) ??
      undefined;
    out.push({ codigo, raw: item, title, buyer });
  }
  return out;
}

async function fetchLicitaciones(params: Record<string, string>) {
  const url = new URL("/api/mercadopublico/licitaciones", window.location.origin);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return JSON.parse(text) as unknown;
}

const estadoOptions: { value: MercadoPublicoLicitacionEstado; label: string }[] =
  [
    { value: "activas", label: "Activas" },
    { value: "publicada", label: "Publicada" },
    { value: "cerrada", label: "Cerrada" },
    { value: "adjudicada", label: "Adjudicada" },
    { value: "desierta", label: "Desierta" },
    { value: "revocada", label: "Revocada" },
    { value: "suspendida", label: "Suspendida" },
    { value: "todos", label: "Todos" },
  ];

export default function LicitacionesExplorer() {
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<MercadoPublicoLicitacionEstado>("activas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UiResult[]>([]);
  const [rawMeta, setRawMeta] = useState<{ cantidad?: number; version?: string }>(
    {},
  );
  const [bookmarks, setBookmarks] = useState<BookmarkedLicitacion[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarkedLicitaciones());
  }, []);

  const bookmarkSet = useMemo(() => new Set(bookmarks.map((b) => b.codigo)), [bookmarks]);

  async function runSearch() {
    setError(null);
    const trimmed = q.trim();
    const fecha = normalizeDdmmaaaa(trimmed);

    const params: Record<string, string> = {};
    if (isMercadoPublicoCodigoLicitacion(trimmed)) {
      params.codigo = trimmed;
    } else if (fecha) {
      params.fecha = fecha;
      params.estado = estado;
    } else {
      // Default to active without query unless user gives a date.
      params.estado = estado;
    }

    setLoading(true);
    try {
      const payload = (await fetchLicitaciones(params)) as MercadoPublicoListadoResponse;
      setRawMeta({
        cantidad: typeof payload?.Cantidad === "number" ? payload.Cantidad : undefined,
        version: typeof payload?.Version === "string" ? payload.Version : undefined,
      });
      const extracted = extractResults(payload);
      setResults(extracted);
    } catch (e) {
      setResults([]);
      setRawMeta({});
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  function onToggleBookmark(r: UiResult) {
    const next = toggleBookmark(
      { codigo: r.codigo, title: r.title, buyer: r.buyer },
      bookmarks,
    );
    setBookmarks(next);
    // Persist
    try {
      window.localStorage.setItem(
        "mm_bookmarked_licitaciones_v1",
        JSON.stringify(next),
      );
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Búsqueda</CardTitle>
          <CardDescription className="text-white/60">
            La API soporta búsqueda por código o listados por fecha/estado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white/80">Código o fecha</div>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="1509-5-L114 o 12062026"
                className="border-white/10 bg-black/30 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-white/80">Estado</div>
              <Select value={estado} onValueChange={(v) => setEstado(v as MercadoPublicoLicitacionEstado)}>
                <SelectTrigger className="border-white/10 bg-black/30 text-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0a0a0a] text-white">
                  {estadoOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runSearch}
              disabled={loading}
              className="bg-white text-black hover:bg-zinc-200"
            >
              {loading ? "Buscando…" : "Buscar"}
            </Button>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 text-sm text-white/60">
            <div>
              {typeof rawMeta.cantidad === "number"
                ? `Resultados: ${rawMeta.cantidad}`
                : results.length
                  ? `Resultados: ${results.length}`
                  : "—"}
            </div>
            {rawMeta.version ? <div>API v{rawMeta.version}</div> : null}
          </div>

          <ScrollArea className="h-[520px] rounded-lg border border-white/10">
            <div className="divide-y divide-white/10">
              {results.length ? (
                results.map((r) => {
                  const saved = bookmarkSet.has(r.codigo);
                  return (
                    <div key={r.codigo} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white">
                            <Link
                              href={`/licitaciones/${encodeURIComponent(r.codigo)}`}
                              className="hover:underline"
                            >
                              {r.codigo}
                            </Link>
                          </div>
                          {r.title ? (
                            <div className="mt-1 line-clamp-2 text-sm text-white/80">
                              {r.title}
                            </div>
                          ) : null}
                          {r.buyer ? (
                            <div className="mt-1 text-xs text-white/55">
                              {r.buyer}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            variant="outline"
                            className="border-white/15 bg-transparent text-white hover:bg-white/10"
                            onClick={() => onToggleBookmark(r)}
                          >
                            {saved ? "Guardada" : "Guardar"}
                          </Button>
                          <Button asChild className="bg-white text-black hover:bg-zinc-200">
                            <Link href={`/licitaciones/${encodeURIComponent(r.codigo)}`}>
                              Ver
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-sm text-white/60">
                  Aún no hay resultados. Prueba “activas” o ingresa una fecha (ddmmaaaa).
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Bookmarks</CardTitle>
          <CardDescription className="text-white/60">
            Guardadas en este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] rounded-lg border border-white/10">
            <div className="divide-y divide-white/10">
              {bookmarks.length ? (
                bookmarks.map((b) => (
                  <div key={b.codigo} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">
                          <Link
                            href={`/licitaciones/${encodeURIComponent(b.codigo)}`}
                            className="hover:underline"
                          >
                            {b.codigo}
                          </Link>
                        </div>
                        {b.title ? (
                          <div className="mt-1 line-clamp-2 text-xs text-white/70">
                            {b.title}
                          </div>
                        ) : null}
                        {b.buyer ? (
                          <div className="mt-1 text-xs text-white/55">
                            {b.buyer}
                          </div>
                        ) : null}
                      </div>
                      <Button
                        variant="outline"
                        className="border-white/15 bg-transparent text-white hover:bg-white/10"
                        onClick={() =>
                          setBookmarks(
                            toggleBookmark(
                              { codigo: b.codigo, title: b.title, buyer: b.buyer },
                              bookmarks,
                            ),
                          )
                        }
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-sm text-white/60">
                  Aún no guardas licitaciones.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

