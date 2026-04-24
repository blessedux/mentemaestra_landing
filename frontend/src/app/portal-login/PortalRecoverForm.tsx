"use client";

import Link from "next/link";
import { useState } from "react";

import { useLocale } from "@/i18n/LocaleProvider";

function submitOwningFormOnEnter(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key !== "Enter" && e.key !== "NumpadEnter") return;
  const form = e.currentTarget.form;
  if (!form) return;
  e.preventDefault();
  form.requestSubmit();
}

export default function PortalRecoverForm() {
  const { t } = useLocale();
  const copy = t.portalRecover;
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
      const res = await fetch("/api/portal/request-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
      };
      if (!res.ok || !json.ok) {
        setError(copy.error);
        return;
      }
      setDone(true);
    } catch {
      setError(copy.error);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8">
        <header>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
            MenteMaestra
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">{copy.title}</h1>
        </header>
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/25 px-4 py-3 text-sm text-emerald-100/95">
          {copy.success}
        </div>
        <Link
          href="/"
          className="block text-center text-xs uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-300"
        >
          {copy.backHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 sm:p-8">
      <header>
        <p className="mb-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
          MenteMaestra
        </p>
        <h1 className="text-2xl font-semibold text-zinc-50">{copy.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {copy.subtitle}
        </p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="portal-recover-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-zinc-500"
          >
            {copy.emailLabel}
          </label>
          <input
            id="portal-recover-email"
            name="email"
            type="email"
            autoComplete="email"
            enterKeyHint="send"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={submitOwningFormOnEnter}
            placeholder={copy.emailPlaceholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-0 transition placeholder:text-zinc-600 focus:border-[#c9a07a]/50"
          />
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {copy.hint}
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
          {loading ? copy.sending : copy.submit}
        </button>
      </form>

      <Link
        href="/"
        className="block text-center text-xs uppercase tracking-[0.14em] text-zinc-600 transition hover:text-zinc-400"
      >
        {copy.backHome}
      </Link>
    </div>
  );
}
