"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AccessKey = "notion" | "cms" | "ops";

const ACCESS_OPTIONS: { value: AccessKey; label: string }[] = [
  { value: "notion", label: "Notion" },
  { value: "cms", label: "CMS" },
  { value: "ops", label: "Panel de operaciones" },
];
const DEFAULT_ACCESSES: AccessKey[] = ACCESS_OPTIONS.map((o) => o.value);

type Stakeholder = { email: string; accesses: AccessKey[] };

type Props = {
  projectId: string;
  ready: boolean;
  adminEmail: string | null;
  initialStakeholders: Stakeholder[];
};

export default function TeamMembersPanel(props: Props) {
  const router = useRouter();
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(
    props.initialStakeholders,
  );
  const [newEmail, setNewEmail] = useState("");
  const [newAccesses, setNewAccesses] =
    useState<AccessKey[]>([...DEFAULT_ACCESSES]);
  const [savingEmail, setSavingEmail] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function addMember() {
    const email = newEmail.trim();
    if (!email || newAccesses.length === 0) {
      setError("invalid_stakeholder");
      return;
    }
    setError(null);
    setMessage(null);
    setAddingNew(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, accesses: newAccesses }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        stakeholders?: Stakeholder[];
        email_sent?: boolean;
      };
      if (!res.ok || !json.ok || !json.stakeholders) {
        setError(json.error ?? "add_failed");
        setAddingNew(false);
        return;
      }
      setStakeholders(json.stakeholders);
      setNewEmail("");
      setNewAccesses([...DEFAULT_ACCESSES]);
      setMessage(
        json.email_sent
          ? `Miembro agregado y notificado por correo.`
          : `Miembro agregado (no se envió correo; revisa la configuración de Resend).`,
      );
      router.refresh();
    } catch (err) {
      console.error("[team-members] add failed", err);
      setError("add_failed");
    } finally {
      setAddingNew(false);
    }
  }

  async function saveAccesses(email: string, accesses: AccessKey[]) {
    if (accesses.length === 0) {
      setError("invalid_accesses");
      return;
    }
    setError(null);
    setMessage(null);
    setSavingEmail(email);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/members`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, accesses }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        stakeholders?: Stakeholder[];
      };
      if (!res.ok || !json.ok || !json.stakeholders) {
        setError(json.error ?? "edit_failed");
        return;
      }
      setStakeholders(json.stakeholders);
      setMessage(`Accesos actualizados para ${email}.`);
      router.refresh();
    } catch (err) {
      console.error("[team-members] patch failed", err);
      setError("edit_failed");
    } finally {
      setSavingEmail(null);
    }
  }

  async function removeMember(email: string) {
    if (!confirm(`¿Eliminar a ${email} del equipo?`)) return;
    setError(null);
    setMessage(null);
    setSavingEmail(email);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/members`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        stakeholders?: Stakeholder[];
      };
      if (!res.ok || !json.ok || !json.stakeholders) {
        setError(json.error ?? "delete_failed");
        return;
      }
      setStakeholders(json.stakeholders);
      setMessage(`Miembro ${email} eliminado.`);
      router.refresh();
    } catch (err) {
      console.error("[team-members] delete failed", err);
      setError("delete_failed");
    } finally {
      setSavingEmail(null);
    }
  }

  function toggleNewAccess(access: AccessKey) {
    setNewAccesses((prev) =>
      prev.includes(access)
        ? prev.filter((a) => a !== access)
        : [...prev, access],
    );
  }

  if (!props.ready) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
          Equipo del proyecto
        </h2>
        <p className="text-sm text-zinc-400">
          Esperando envío del cliente. Cuando el cliente complete el formulario
          de acceso, podrás editar el equipo desde aquí.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Equipo del proyecto
        </h2>
        {props.adminEmail ? (
          <p className="mt-1 text-xs text-zinc-500">
            Administrador:{" "}
            <span className="text-zinc-300">{props.adminEmail}</span>
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        {stakeholders.length === 0 ? (
          <p className="text-sm text-zinc-400">
            El cliente no añadió miembros. Agrega abajo los correos que deben
            acceder al portal.
          </p>
        ) : (
          stakeholders.map((s) => (
            <MemberRow
              key={s.email}
              stakeholder={s}
              saving={savingEmail === s.email}
              onSave={(accesses) => saveAccesses(s.email, accesses)}
              onRemove={() => removeMember(s.email)}
            />
          ))
        )}
      </div>

      <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Agregar miembro
        </p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="persona@empresa.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
          />
          <button
            type="button"
            onClick={addMember}
            disabled={addingNew || newEmail.trim().length === 0}
            className="rounded-lg border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addingNew ? "Agregando…" : "Agregar"}
          </button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ACCESS_OPTIONS.map((opt) => {
            const checked = newAccesses.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleNewAccess(opt.value)}
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
                />
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-zinc-500">
          Al agregar un miembro le enviaremos un correo con instrucciones para
          ingresar al portal.
        </p>
      </div>

      {message ? (
        <p className="text-sm text-emerald-300">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {friendlyMemberError(error)}
        </p>
      ) : null}
    </section>
  );
}

function MemberRow({
  stakeholder,
  saving,
  onSave,
  onRemove,
}: {
  stakeholder: Stakeholder;
  saving: boolean;
  onSave: (accesses: AccessKey[]) => void;
  onRemove: () => void;
}) {
  const [accesses, setAccesses] = useState<AccessKey[]>(stakeholder.accesses);
  const dirty =
    accesses.length !== stakeholder.accesses.length ||
    accesses.some((a) => !stakeholder.accesses.includes(a));

  function toggle(access: AccessKey) {
    setAccesses((prev) =>
      prev.includes(access)
        ? prev.filter((a) => a !== access)
        : [...prev, access],
    );
  }

  return (
    <div className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm text-zinc-100">{stakeholder.email}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Eliminar ${stakeholder.email}`}
          title="Eliminar miembro"
          disabled={saving}
          className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-500 transition hover:border-red-800/60 hover:text-red-300 disabled:opacity-50"
        >
          ×
        </button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {ACCESS_OPTIONS.map((opt) => {
          const checked = accesses.includes(opt.value);
          return (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]"
              />
              <span>{opt.label}</span>
            </label>
          );
        })}
        {dirty ? (
          <button
            type="button"
            onClick={() => onSave(accesses)}
            disabled={saving || accesses.length === 0}
            className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function friendlyMemberError(code: string): string {
  switch (code) {
    case "invalid_stakeholder":
    case "invalid_accesses":
      return "Revisa el correo y que haya al menos un acceso marcado.";
    case "duplicate":
      return "Ese correo ya está en el equipo.";
    case "not_found":
      return "No encontramos a ese miembro. Recarga e intenta de nuevo.";
    case "no_submission":
      return "El cliente aún no ha enviado el formulario. Espera a que complete.";
    case "project_not_found":
      return "Proyecto no encontrado.";
    case "database_not_configured":
      return "La base de datos no está configurada.";
    case "add_failed":
      return "No pudimos agregar al miembro.";
    case "edit_failed":
      return "No pudimos guardar los cambios.";
    case "delete_failed":
      return "No pudimos eliminar al miembro.";
    default:
      return "No pudimos completar la acción.";
  }
}
