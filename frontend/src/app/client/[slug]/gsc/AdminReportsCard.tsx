"use client";

import { useState } from "react";
import Link from "next/link";

type SentPayload = { ok: true; to: string; subject: string };
type ErrPayload = { ok: false; error?: string };

export default function AdminReportsCard({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<SentPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setSent(null);
    setError(null);
    try {
      const res = await fetch(`/api/client/${encodeURIComponent(slug)}/reports/send`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as SentPayload | ErrPayload | null;
      if (!res.ok || !json || json.ok !== true) {
        const code =
          json && typeof json === "object" && "error" in json
            ? String((json as ErrPayload).error ?? "send_failed")
            : "send_failed";
        if (code === "missing_admin_email") {
          setError(
            "Falta admin_email en la última invitación/onboarding del proyecto. Complétalo en el CRM y vuelve a intentar.",
          );
          return;
        }
        setError(`No pudimos enviar el reporte (${code}).`);
        return;
      }
      setSent(json);
    } catch {
      setError("No pudimos enviar el reporte. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Operaciones · Reportes
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Envía reportes SEO (día 1 y 15) con métricas de GSC, gráficos y la recomendación principal.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={`/client/${encodeURIComponent(slug)}/gsc/reports`}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900/40"
          >
            Ver historial de reportes
          </Link>

          <button
            type="button"
            disabled={busy}
            onClick={() => void send()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-xs font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? "Enviando…" : "Enviar reporte ahora"}
          </button>
        </div>

        {sent ? (
          <div className="mt-4 rounded-xl border border-emerald-900/35 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-200">
            <p className="font-semibold">Reporte enviado a:</p>
            <p className="mt-1 text-emerald-100">{sent.to}</p>
            <p className="mt-3 font-semibold">Asunto:</p>
            <p className="mt-1 text-emerald-100">{sent.subject}</p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}

