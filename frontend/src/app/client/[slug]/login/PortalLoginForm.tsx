"use client";

import { useState } from "react";

type Props = {
  slug: string;
};

export default function PortalLoginForm({ slug }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/client/${encodeURIComponent(slug)}/request-magic-link`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!res.ok || !json.ok) {
        setError("No pudimos completar la solicitud. Inténtalo más tarde.");
        return;
      }
      setDone(true);
    } catch {
      setError("No pudimos completar la solicitud. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
        Si tu correo está autorizado para este proyecto, te enviamos un enlace
        en unos minutos. Revisa la bandeja y el spam.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="portal-login-email"
          className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500"
        >
          Correo con acceso al portal
        </label>
        <input
          id="portal-login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@empresa.com"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-[#c9a07a]/50"
        />
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Debe ser el mismo correo que figura en la lista autorizada del
          proyecto. Te enviaremos un enlace seguro; al abrirlo iniciarás sesión
          en este dispositivo.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2.5 text-sm font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar enlace mágico"}
      </button>
    </form>
  );
}
