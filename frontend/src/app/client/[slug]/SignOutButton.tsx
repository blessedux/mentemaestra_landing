"use client";

import { useState } from "react";

/**
 * Clears the portal session cookie via our /logout route handler, then does
 * a hard navigation to the login info page (no Supabase / no SDK).
 */
export default function SignOutButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`/client/${encodeURIComponent(slug)}/logout`, {
        method: "POST",
      });
    } catch (err) {
      console.error("[portal] logout failed", err);
    }
    // Hard navigation so the RSC re-reads cookies from scratch.
    window.location.href = `/client/${encodeURIComponent(slug)}/login?reason=no_session`;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
