"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewProjectForm() {
  const router = useRouter();
  const [state, setState] = useState({
    client_name: "",
    client_email: "",
    project_name: "",
    slug: "",
    notion_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof typeof state>(
    key: K,
    value: (typeof state)[K],
  ) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/internal/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: state.client_name.trim(),
          client_email: state.client_email.trim(),
          project_name: state.project_name.trim(),
          slug: state.slug.trim().toLowerCase(),
          notion_url: state.notion_url.trim() || null,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        project?: { id: string };
      };
      if (!res.ok || !json.ok) {
        setError(friendlyCreateError(json.error));
        setSubmitting(false);
        return;
      }
      if (json.project?.id) {
        router.push(`/internal/projects/${json.project.id}`);
        return;
      }
      router.refresh();
    } catch (err) {
      console.error("[new-project] submit failed", err);
      setError("No pudimos crear el proyecto. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre del cliente">
          <input
            required
            value={state.client_name}
            onChange={(e) => setField("client_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Correo del cliente">
          <input
            type="email"
            required
            value={state.client_email}
            onChange={(e) => setField("client_email", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Nombre del proyecto">
          <input
            required
            value={state.project_name}
            onChange={(e) => setField("project_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Slug (a-z, 0-9, guiones)">
          <input
            required
            pattern="[a-z0-9][-a-z0-9]{0,62}[a-z0-9]"
            value={state.slug}
            onChange={(e) => setField("slug", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Notion URL (opcional)">
        <input
          type="url"
          value={state.notion_url}
          onChange={(e) => setField("notion_url", e.target.value)}
          className={inputClass}
        />
      </Field>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="justify-self-start rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-5 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Creando…" : "Crear proyecto"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function friendlyCreateError(code: string | undefined): string {
  switch (code) {
    case "invalid_slug":
      return "El slug solo admite minúsculas, números y guiones.";
    case "invalid_client_email":
      return "Correo del cliente inválido.";
    case "slug_taken":
      return "Ya existe un proyecto con ese slug.";
    case "missing_fields":
      return "Completa todos los campos obligatorios.";
    default:
      return "No pudimos crear el proyecto.";
  }
}
