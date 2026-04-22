"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isMercadoPublicoCodigoLicitacion } from "@/lib/mercadopublico";
import {
  loadBookmarkedLicitaciones,
  toggleBookmark,
  type BookmarkedLicitacion,
} from "@/lib/licitaciones-bookmarks";

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function pickString(o: any, path: string[]): string | undefined {
  let cur = o;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return typeof cur === "string" ? cur : undefined;
}

function pickNumber(o: any, path: string[]): number | undefined {
  let cur = o;
  for (const k of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[k];
  }
  return typeof cur === "number" ? cur : undefined;
}

function getAny(o: any, keys: string[]): unknown | undefined {
  if (!o || typeof o !== "object") return undefined;
  for (const k of keys) {
    if (k in o) return o[k];
  }
  return undefined;
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-white/80">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-white/60">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function extractDetalle(payload: any) {
  const first = Array.isArray(payload?.Listado) ? payload.Listado[0] : null;
  const lic = first?.Licitacion ?? first ?? null;
  const buyer = lic?.Comprador ?? lic?.Comprador ?? null;
  const fechas = lic?.Fechas ?? lic?.Fechas ?? null;
  const items = lic?.Items?.Listado ?? lic?.Items?.Listado ?? null;

  // These keys vary a bit across modalities; we expose whatever the API returns.
  const bases = getAny(lic, ["Bases", "BasesAdministrativas", "BasesTecnicas"]);
  const documentos = getAny(lic, ["Documentos", "Adjuntos", "Anexos"]);
  const etapas = getAny(lic, ["Etapas", "Etapa", "Cronograma"]);
  const preguntas = getAny(lic, ["Preguntas", "Foro", "PreguntasRespuestas"]);
  const evaluacion = getAny(lic, [
    "Evaluacion",
    "CriteriosEvaluacion",
    "Criterios",
    "CriteriosDeEvaluacion",
  ]);
  const adjudicacion = getAny(lic, ["Adjudicacion", "Adjudicación", "Adjudicado"]);
  const garantias = getAny(lic, ["Garantias", "Garantías", "Boletas", "GarantiaSeriedadOferta"]);

  return {
    raw: payload,
    lic,
    buyer,
    fechas,
    items: Array.isArray(items) ? items : [],
    bases,
    documentos,
    etapas,
    preguntas,
    evaluacion,
    adjudicacion,
    garantias,
    nombre:
      pickString(lic, ["Nombre"]) ??
      pickString(lic, ["NombreLicitacion"]) ??
      pickString(lic, ["Titulo"]) ??
      undefined,
    descripcion: pickString(lic, ["Descripcion"]) ?? undefined,
    tipo: pickString(lic, ["Tipo"]) ?? pickString(lic, ["TipoLicitacion"]) ?? undefined,
    moneda: pickString(lic, ["Moneda"]) ?? undefined,
    montoEstimado: pickNumber(lic, ["MontoEstimado"]) ?? undefined,
    organismo: pickString(buyer, ["NombreOrganismo"]) ?? pickString(buyer, ["Nombre"]) ?? undefined,
    rutOrganismo: pickString(buyer, ["RutUnidad"]) ?? pickString(buyer, ["RutOrganismo"]) ?? undefined,
    region: pickString(lic, ["Comprador", "RegionUnidad"]) ?? undefined,
    fechaCierre:
      pickString(fechas, ["FechaCierre"]) ??
      pickString(fechas, ["FechaCierre"] ) ??
      undefined,
    fechaPublicacion:
      pickString(fechas, ["FechaPublicacion"]) ??
      pickString(fechas, ["FechaPublicacion"] ) ??
      undefined,
    urlMercadoPublico: pickString(lic, ["UrlLicitacion"]) ?? undefined,
  };
}

async function fetchDetalle(codigo: string) {
  const url = new URL("/api/mercadopublico/licitaciones", window.location.origin);
  url.searchParams.set("codigo", codigo);
  const res = await fetch(url.toString(), { cache: "no-store" });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  return safeJson(text);
}

function HowToWinPanel({ ctx }: { ctx: ReturnType<typeof extractDetalle> }) {
  const cierre = ctx.fechaCierre;
  const organismo = ctx.organismo;
  const monto =
    typeof ctx.montoEstimado === "number"
      ? `${ctx.montoEstimado.toLocaleString("es-CL")} ${ctx.moneda ?? ""}`.trim()
      : null;

  const checklist = [
    {
      title: "Entiende la evaluación",
      body:
        "Identifica criterios, ponderaciones, mínimos excluyentes y requisitos administrativos. Construye tu oferta mapeando cada requisito a evidencia explícita.",
    },
    {
      title: "Alinea propuesta técnica",
      body:
        "Responde punto por punto a bases técnicas, detalla metodología, equipo, plan de trabajo, entregables y control de calidad. Evita supuestos no respaldados.",
    },
    {
      title: "Optimiza precio con estructura",
      body:
        "Justifica costos, presenta desglose claro, y asegúrate de cumplir formatos/moneda/plazos. Si hay garantías o boletas, incorpóralas desde el inicio.",
    },
    {
      title: "Riesgos y cumplimiento",
      body:
        "Verifica plazos, vigencias de documentos, certificados, experiencia exigida, y compatibilidad legal/tributaria. Prepara anexos con anticipación.",
    },
    {
      title: "Cierra con narrativa ganadora",
      body:
        "Resume por qué eres la mejor alternativa para el organismo: impacto, experiencia comparable, plan de implementación y garantías de continuidad.",
    },
  ];

  return (
    <Card className="border-white/10 bg-white/5 text-white">
      <CardHeader>
        <CardTitle className="text-xl">Cómo ganar (guía práctica)</CardTitle>
        <CardDescription className="text-white/60">
          Checklist accionable basado en los datos de la licitación.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/75">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {organismo ? (
              <div>
                <span className="text-white/50">Organismo:</span>{" "}
                <span className="text-white">{organismo}</span>
              </div>
            ) : null}
            {cierre ? (
              <div>
                <span className="text-white/50">Cierre:</span>{" "}
                <span className="text-white">{cierre}</span>
              </div>
            ) : null}
            {monto ? (
              <div>
                <span className="text-white/50">Monto estimado:</span>{" "}
                <span className="text-white">{monto}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          {checklist.map((c) => (
            <div
              key={c.title}
              className="rounded-lg border border-white/10 bg-black/20 p-3"
            >
              <div className="text-sm font-semibold">{c.title}</div>
              <div className="mt-1 text-sm text-white/70">{c.body}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LicitacionDetail({ codigo }: { codigo: string }) {
  const normalized = codigo.trim();
  const valid = isMercadoPublicoCodigoLicitacion(normalized);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkedLicitacion[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarkedLicitaciones());
  }, []);

  const saved = useMemo(
    () => bookmarks.some((b) => b.codigo === normalized),
    [bookmarks, normalized],
  );

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDetalle(normalized)
      .then((p) => {
        if (cancelled) return;
        setPayload(p);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error desconocido");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normalized, valid]);

  const ctx = useMemo(() => extractDetalle(payload as any), [payload]);

  function onToggleBookmark() {
    const next = toggleBookmark(
      { codigo: normalized, title: ctx.nombre, buyer: ctx.organismo },
      bookmarks,
    );
    setBookmarks(next);
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-white/60">
            <Link href="/licitaciones" className="hover:underline">
              ← Volver a búsqueda
            </Link>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {normalized}
          </h1>
          {ctx.nombre ? (
            <p className="mt-2 max-w-3xl text-sm text-white/75">{ctx.nombre}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-white/15 bg-transparent text-white hover:bg-white/10"
            onClick={onToggleBookmark}
            disabled={!valid}
          >
            {saved ? "Quitar bookmark" : "Guardar bookmark"}
          </Button>
          {ctx.urlMercadoPublico ? (
            <Button asChild className="bg-white text-black hover:bg-zinc-200">
              <a href={ctx.urlMercadoPublico} target="_blank" rel="noreferrer">
                Abrir en MercadoPublico
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      {!valid ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          Código inválido. Formato esperado: <span className="font-mono">1509-5-L114</span>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <SectionCard
            title="Resumen"
            description="Campos principales y contexto del comprador."
          >
            <div className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-white/80">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-xs text-white/50">Organismo</div>
                  <div className="mt-0.5 text-white">
                    {ctx.organismo ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">RUT / Unidad</div>
                  <div className="mt-0.5 text-white">
                    {ctx.rutOrganismo ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Tipo</div>
                  <div className="mt-0.5 text-white">{ctx.tipo ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Región</div>
                  <div className="mt-0.5 text-white">{ctx.region ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Publicación</div>
                  <div className="mt-0.5 text-white">
                    {ctx.fechaPublicacion ?? "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/50">Cierre</div>
                  <div className="mt-0.5 text-white">{ctx.fechaCierre ?? "—"}</div>
                </div>
              </div>

              {ctx.descripcion ? (
                <div className="pt-2">
                  <div className="text-xs text-white/50">Descripción</div>
                  <div className="mt-1 whitespace-pre-wrap text-white/80">
                    {ctx.descripcion}
                  </div>
                </div>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title="Requisitos / Bases / Especificaciones"
            description="Renderizamos todo lo disponible desde el API (bases administrativas/técnicas, anexos y campos de requisitos)."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.bases ?? { info: "No se encontró campo de bases en esta licitación (depende de modalidad).", keysHint: ["Bases", "BasesAdministrativas", "BasesTecnicas"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Criterios de evaluación"
            description="Ponderaciones, criterios, mínimos excluyentes (si el API los entrega)."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.evaluacion ?? { info: "No se encontró campo de evaluación en esta licitación.", keysHint: ["CriteriosEvaluacion", "Evaluacion", "Criterios"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Cronograma / Etapas"
            description="Fechas y etapas del proceso."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.etapas ?? ctx.fechas ?? { info: "No se encontró cronograma/etapas explícitas; revisa Fechas o el JSON crudo.", keysHint: ["Etapas", "Cronograma", "Fechas"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Ítems"
            description="Detalle de productos/servicios requeridos (cuando está disponible)."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.items.length ? ctx.items : { info: "No se encontraron ítems en el payload.", keysHint: ["Items.Listado"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Documentos / Adjuntos / Anexos"
            description="Links o metadatos de archivos, si existen."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.documentos ?? { info: "No se encontraron documentos/adjuntos en el payload.", keysHint: ["Documentos", "Adjuntos", "Anexos"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Garantías / Boletas"
            description="Seriedad de la oferta, boletas, requisitos de garantía (si aplica)."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.garantias ?? { info: "No se encontraron campos de garantías/boletas en el payload.", keysHint: ["Garantias", "Boletas", "GarantiaSeriedadOferta"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Adjudicación"
            description="Información de adjudicación cuando el proceso ya finalizó."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.adjudicacion ?? { info: "No se encontró adjudicación (o aún no aplica).", keysHint: ["Adjudicacion", "Adjudicado"] }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="JSON completo (debug)"
            description={loading ? "Cargando…" : "Datos crudos del endpoint."}
          >
            <ScrollArea className="h-[520px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={payload ?? (loading ? { loading: true } : null)} />
            </ScrollArea>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <HowToWinPanel ctx={ctx} />

          <SectionCard
            title="Comprador (estructura)"
            description="Campo comprador/unidad tal como viene desde la API."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.buyer ?? { info: "No se encontró comprador en el payload." }} />
            </ScrollArea>
          </SectionCard>

          <SectionCard
            title="Preguntas / Foro"
            description="Si el API incluye foro/preguntas y respuestas."
          >
            <ScrollArea className="h-[360px] rounded-lg border border-white/10 bg-black/20">
              <JsonBlock value={ctx.preguntas ?? { info: "No se encontró foro/preguntas en el payload.", keysHint: ["Preguntas", "Foro", "PreguntasRespuestas"] }} />
            </ScrollArea>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

