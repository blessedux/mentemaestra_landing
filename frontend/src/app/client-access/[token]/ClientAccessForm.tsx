"use client";

import { useState } from "react";

type AccessKey = "notion" | "cms" | "ops";

const ACCESS_OPTIONS: { value: AccessKey; label: string }[] = [
  { value: "notion", label: "Notion" },
  { value: "cms", label: "CMS" },
  { value: "ops", label: "Panel de operaciones" },
];
const DEFAULT_ACCESSES: AccessKey[] = ACCESS_OPTIONS.map((o) => o.value);

type Stakeholder = { email: string; accesses: AccessKey[] };

function EmptyRow(): Stakeholder {
  return { email: "", accesses: [...DEFAULT_ACCESSES] };
}

export default function ClientAccessForm({
  token,
  defaultAdminEmail,
  supportEmail,
}: {
  token: string;
  defaultAdminEmail: string;
  supportEmail: string;
}) {
  const [adminEmail, setAdminEmail] = useState(defaultAdminEmail);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([EmptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateEmail(index: number, email: string) {
    setStakeholders((prev) =>
      prev.map((s, i) => (i === index ? { ...s, email } : s)),
    );
  }

  function toggleAccess(index: number, access: AccessKey) {
    setStakeholders((prev) =>
      prev.map((s, i) => {
        if (i !== index) return s;
        const has = s.accesses.includes(access);
        const next = has
          ? s.accesses.filter((a) => a !== access)
          : [...s.accesses, access];
        return { ...s, accesses: next };
      }),
    );
  }

  function addRow() {
    setStakeholders((prev) => [...prev, EmptyRow()]);
  }

  function removeRow(index: number) {
    setStakeholders((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleaned = stakeholders
        .map((s) => ({
          email: s.email.trim(),
          accesses: [...s.accesses],
        }))
        .filter((s) => s.email.length > 0 && s.accesses.length > 0);
      const res = await fetch(
        `/api/client-access/${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            admin_email: adminEmail.trim(),
            stakeholders: cleaned,
          }),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        project_slug?: string | null;
      };
      if (!res.ok || !json.ok) {
        setError(friendlyError(json.error));
        setSubmitting(false);
        return;
      }
      // The POST handler already set our portal session cookie, so we can
      // send the admin straight into the dashboard. `/client-access/success`
      // is kept as the fallback for when the slug isn't returned (defensive).
      const slug = json.project_slug?.trim();
      window.location.href = slug
        ? `/client/${encodeURIComponent(slug)}`
        : "/client-access/success";
    } catch (err) {
      console.error("[client-access-form] submit failed", err);
      setError("No pudimos enviar el formulario. Intenta de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
    >
      <label className="block">
        <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-500">
          Tu correo de administrador
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
        />
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Miembros del equipo y sus accesos
          </span>
          <button
            type="button"
            onClick={addRow}
            className="text-xs font-medium text-[#c9a07a] transition hover:text-[#e4b890]"
          >
            + Añadir
          </button>
        </div>
        <p className="mb-3 text-xs text-zinc-500">
          Por defecto cada persona recibe acceso a las tres herramientas. Desmarca
          las que no aplican.
        </p>
        <div className="space-y-3">
          {stakeholders.map((s, i) => (
            <div
              key={i}
              className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3"
            >
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="persona@empresa.com"
                  value={s.email}
                  onChange={(e) => updateEmail(i, e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
                />
                {stakeholders.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Eliminar miembro"
                    className="rounded-lg border border-zinc-800 px-3 text-sm text-zinc-500 transition hover:border-zinc-600 hover:text-zinc-200"
                  >
                    ×
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {ACCESS_OPTIONS.map((opt) => {
                  const checked = s.accesses.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleAccess(i, opt.value)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
                      />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        role="note"
        className="rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-xs leading-relaxed text-amber-100/90"
      >
        <p className="mb-1 font-semibold text-amber-100">
          Este formulario se envía una sola vez.
        </p>
        <p>
          Revisa con calma los correos y accesos marcados: al enviar quedan
          registrados y el enlace deja de funcionar. Si más adelante necesitas
          añadir, quitar o cambiar miembros del equipo, escríbenos a{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-amber-100 underline decoration-amber-200/40 underline-offset-2 hover:decoration-amber-200"
          >
            {supportEmail}
          </a>
          . Cuando el dashboard de MenteMaestra esté activo para tu proyecto,
          también podrás editar tu equipo desde tu perfil.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-6 py-3 text-sm font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar y continuar"}
      </button>
    </form>
  );
}

function friendlyError(code: string | undefined): string {
  switch (code) {
    case "invalid_admin_email":
      return "Revisa el correo de administrador.";
    case "invalid_stakeholders":
      return "Revisa los correos de los miembros y que cada uno tenga al menos un acceso marcado.";
    case "rate_limited":
      return "Demasiados intentos. Espera un minuto y vuelve a intentarlo.";
    case "bad_origin":
      return "La solicitud fue rechazada por seguridad. Recarga la página e intenta de nuevo.";
    case "already_submitted":
    case "used":
      return "Este enlace ya fue utilizado.";
    case "expired":
      return "Este enlace ha caducado. Escríbenos para recibir uno nuevo.";
    case "not_found":
      return "Enlace no encontrado.";
    case "database_not_configured":
    case "resend_not_configured":
      return "Servicio no disponible. Vuelve a intentarlo más tarde.";
    default:
      return "No pudimos guardar tu formulario. Intenta de nuevo.";
  }
}
