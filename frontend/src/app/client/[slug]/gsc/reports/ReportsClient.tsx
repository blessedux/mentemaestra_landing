"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReportRow = {
  id: string;
  sent_to: string;
  sent_by: string;
  subject: string;
  date_start: string;
  date_end: string;
  created_at: string;
};

type ReportDetail = {
  id: string;
  sent_to: string;
  sent_by: string;
  subject: string;
  date_start: string;
  date_end: string;
  created_at: string;
  html: string | null;
};

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ReportsClient({ slug }: { slug: string }) {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [viewerDetail, setViewerDetail] = useState<ReportDetail | null>(null);

  const canRetry = useMemo(() => !sending, [sending]);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/client/${encodeURIComponent(slug)}/reports/history`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "load_failed");
      setReports(Array.isArray(json.reports) ? json.reports : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setLoading(false);
    }
  }

  async function sendNow() {
    setError(null);
    setSentMsg(null);
    setSending(true);
    try {
      const res = await fetch(`/api/client/${encodeURIComponent(slug)}/reports/send`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        if (json?.error === "missing_admin_email") {
          throw new Error(
            "Define el admin_email en la última invitación/onboarding del proyecto (CRM) y vuelve a intentar.",
          );
        }
        throw new Error(json?.error ?? "send_failed");
      }
      setSentMsg(`Enviado a ${json.to}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "send_failed");
    } finally {
      setSending(false);
    }
  }

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setViewerDetail(null);
    setViewerError(null);
    setViewerLoading(false);
  }, []);

  async function openReport(id: string) {
    setViewerOpen(true);
    setViewerDetail(null);
    setViewerError(null);
    setViewerLoading(true);
    try {
      const res = await fetch(
        `/api/client/${encodeURIComponent(slug)}/reports/${encodeURIComponent(id)}`,
        { cache: "no-store", credentials: "include" },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "load_failed");
      const r = json.report as ReportDetail | undefined;
      if (!r?.id) throw new Error("invalid_response");
      setViewerDetail(r);
    } catch (e) {
      setViewerError(e instanceof Error ? e.message : "load_failed");
    } finally {
      setViewerLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") closeViewer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, closeViewer]);

  return (
    <main className="flex min-h-screen flex-col bg-[#0a0a0a] px-6 py-12 text-zinc-100">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
          MenteMaestra · Reportes
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">Historial de reportes enviados</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Genera y envía reportes SEO desde aquí (operaciones).
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void sendNow()}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-xs font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {sending ? "Enviando…" : "Enviar reporte ahora"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            disabled={!canRetry}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900/40 disabled:opacity-60"
          >
            Recargar
          </button>
          <Link
            href={`/client/${encodeURIComponent(slug)}/gsc`}
            className="text-xs uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-300"
          >
            ← Volver a Analytics
          </Link>
        </div>

        {sentMsg ? (
          <p className="mt-4 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
            {sentMsg}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            {error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
          {loading ? (
            <div className="px-4 py-5 text-sm text-zinc-500">Cargando…</div>
          ) : reports.length === 0 ? (
            <div className="px-4 py-5 text-sm text-zinc-500">Aún no se han enviado reportes.</div>
          ) : (
            <ul className="divide-y divide-zinc-900">
              {reports.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => void openReport(r.id)}
                    className="w-full px-4 py-4 text-left transition hover:bg-zinc-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a07a]/50"
                  >
                    <p className="text-sm text-zinc-200">{r.subject}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {r.date_start} → {r.date_end} · Enviado a{" "}
                      <span className="text-zinc-300">{r.sent_to}</span> · por{" "}
                      <span className="text-zinc-300">{r.sent_by}</span> · {fmt(r.created_at)}
                    </p>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                      Ver HTML del correo
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {viewerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-viewer-title"
          onClick={closeViewer}
        >
          <div
            className="flex max-h-[min(100dvh,920px)] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p id="report-viewer-title" className="truncate text-sm font-medium text-zinc-100">
                  {viewerDetail?.subject ?? "Reporte"}
                </p>
                {viewerDetail ? (
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {viewerDetail.date_start} → {viewerDetail.date_end} · {fmt(viewerDetail.created_at)}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={closeViewer}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-900"
              >
                Cerrar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-zinc-900/40">
              {viewerLoading ? (
                <div className="px-4 py-10 text-center text-sm text-zinc-500">Cargando vista previa…</div>
              ) : viewerError ? (
                <div className="px-4 py-10 text-center text-sm text-amber-200">{viewerError}</div>
              ) : viewerDetail?.html && viewerDetail.html.trim().length > 0 ? (
                <iframe
                  title="Vista previa del reporte enviado"
                  sandbox="allow-popups allow-popups-to-escape-sandbox"
                  className="h-[min(75dvh,760px)] w-full border-0 bg-white"
                  srcDoc={viewerDetail.html}
                />
              ) : (
                <div className="px-4 py-10 text-center text-sm text-zinc-400">
                  Este envío no tiene HTML guardado (reportes anteriores a la actualización). Envía
                  uno nuevo para poder comparar aquí.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
