"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type GscStatus =
  | {
      connected: true;
      id: string;
      property_url: string;
      connected_email: string | null;
      connected_at: string;
    }
  | { connected: false };

type GscSite = { siteUrl: string; permissionLevel: string };

type Props = {
  projectId: string;
  projectSlug: string;
  defaultNotionUrl: string;
  defaultSanityDataset: string;
  defaultDashboardKey: string;
  defaultClientWebsiteUrl: string;
  defaultVercelProjectId: string;
  clientEmail: string;
  projectName: string;
  clientName: string;
  /**
   * Absolute URL to the client portal login page (e.g.
   * https://mentemaestra.studio/client/slug/login). Computed server-side so
   * it matches what the welcome email embeds, even in dev.
   */
  portalLoginUrl: string;
  /** Relative href for same-tab previews (`/client/slug`). */
  portalHref: string;
  /** GSC connection status for this project, fetched server-side. */
  gscStatus: GscStatus;
};

type ModalKind = "edit" | "delete" | "gsc_select_property" | null;

export default function ProjectDetailPanel(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notionUrl, setNotionUrl] = useState(props.defaultNotionUrl);
  const [sanity, setSanity] = useState(props.defaultSanityDataset);
  const [dashboardKey, setDashboardKey] = useState(props.defaultDashboardKey);
  const [clientWebsiteUrl, setClientWebsiteUrl] = useState(
    props.defaultClientWebsiteUrl,
  );
  const [vercelProjectId, setVercelProjectId] = useState(
    props.defaultVercelProjectId,
  );
  const [toEmail, setToEmail] = useState(props.clientEmail);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);

  const [editName, setEditName] = useState(props.projectName);
  const [editClientName, setEditClientName] = useState(props.clientName);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const canDelete = deleteInput === props.projectName;

  const firstModalInputRef = useRef<HTMLInputElement | null>(null);

  // ── GSC state ────────────────────────────────────────────────────────────
  const [gscStatus, setGscStatus] = useState<GscStatus>(props.gscStatus);
  const [gscConnecting, setGscConnecting] = useState(false);
  const [gscDisconnecting, setGscDisconnecting] = useState(false);
  const [gscError, setGscError] = useState<string | null>(null);
  const [gscPendingCredId, setGscPendingCredId] = useState<string | null>(null);
  const [gscSites, setGscSites] = useState<GscSite[]>([]);
  const [gscSelectedProperty, setGscSelectedProperty] = useState<string>("");
  const [gscSaving, setGscSaving] = useState(false);

  // After OAuth callback, read gsc_pending_property + gsc_sites from URL.
  useEffect(() => {
    const pendingId = searchParams.get("gsc_pending_property");
    const sitesRaw = searchParams.get("gsc_sites");
    const oauthError = searchParams.get("gsc_error");

    if (oauthError) {
      setGscError(friendlyGscError(oauthError));
      return;
    }

    if (pendingId) {
      let sites: GscSite[] = [];
      try {
        sites = sitesRaw ? (JSON.parse(decodeURIComponent(sitesRaw)) as GscSite[]) : [];
      } catch {}
      setGscPendingCredId(pendingId);
      setGscSites(sites);
      setGscSelectedProperty(sites[0]?.siteUrl ?? "");
      setModal("gsc_select_property");
      // Clean up URL without re-fetching the page.
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  // Run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the popover menu when clicking outside of it or pressing Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // When a modal is open: lock background scroll, focus first input, close on Esc.
  useEffect(() => {
    if (!modal) return;
    const t = window.setTimeout(() => firstModalInputRef.current?.focus(), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal]);

  function openEditModal() {
    setMenuOpen(false);
    setEditName(props.projectName);
    setEditClientName(props.clientName);
    setEditError(null);
    setModal("edit");
  }

  function openDeleteModal() {
    setMenuOpen(false);
    setDeleteInput("");
    setDeleteError(null);
    setModal("delete");
  }

  function closeModal() {
    if (savingEdit || deleting) return;
    setModal(null);
  }

  async function saveChanges() {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch("/api/internal/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: props.projectId,
          notion_url: notionUrl.trim() || null,
          sanity_dataset: sanity.trim() || null,
          dashboard_project_key: dashboardKey.trim() || null,
          client_website_url: clientWebsiteUrl.trim() || null,
          vercel_project_id: vercelProjectId.trim() || null,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "save_failed");
        return;
      }
      setMessage("Guardado");
      router.refresh();
    } catch (err) {
      console.error("[project-detail] save failed", err);
      setError("save_failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    const projectName = editName.trim();
    const clientName = editClientName.trim();
    if (!projectName) {
      setEditError("invalid_project_name");
      return;
    }
    if (!clientName) {
      setEditError("invalid_client_name");
      return;
    }
    setEditError(null);
    setSavingEdit(true);
    try {
      const res = await fetch("/api/internal/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: props.projectId,
          name: projectName,
          client_name: clientName,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setEditError(json.error ?? "edit_failed");
        setSavingEdit(false);
        return;
      }
      setModal(null);
      setSavingEdit(false);
      setMessage("Datos actualizados");
      router.refresh();
    } catch (err) {
      console.error("[project-detail] edit failed", err);
      setEditError("edit_failed");
      setSavingEdit(false);
    }
  }

  async function confirmDelete() {
    if (!canDelete) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirm_name: deleteInput }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        setDeleteError(json.error ?? "delete_failed");
        setDeleting(false);
        return;
      }
      router.replace("/internal");
      router.refresh();
    } catch (err) {
      console.error("[project-detail] delete failed", err);
      setDeleteError("delete_failed");
      setDeleting(false);
    }
  }

  async function sendOnboarding() {
    setError(null);
    setMessage(null);
    setSending(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/send-onboarding`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to_email: toEmail.trim() }),
        },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email_sent?: boolean;
        cta_url?: string;
      };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "send_failed");
        return;
      }
      setMessage(
        json.email_sent
          ? `Correo enviado a ${toEmail.trim()}.`
          : `Invitación creada. Email NO enviado: copia el enlace: ${json.cta_url ?? ""}`,
      );
      router.refresh();
    } catch (err) {
      console.error("[project-detail] send failed", err);
      setError("send_failed");
    } finally {
      setSending(false);
    }
  }

  async function connectGsc() {
    setGscError(null);
    setGscConnecting(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/gsc/start-oauth`,
        { method: "POST" },
      );
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        authUrl?: string;
      };
      if (!res.ok || !json.ok || !json.authUrl) {
        setGscError(friendlyGscError(json.error ?? "connect_failed"));
        return;
      }
      // Full-page redirect to Google.
      window.location.href = json.authUrl;
    } catch {
      setGscError(friendlyGscError("connect_failed"));
    } finally {
      setGscConnecting(false);
    }
  }

  async function disconnectGsc() {
    setGscError(null);
    setGscDisconnecting(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/gsc`,
        { method: "DELETE" },
      );
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setGscError(friendlyGscError(json.error ?? "disconnect_failed"));
        return;
      }
      setGscStatus({ connected: false });
    } catch {
      setGscError(friendlyGscError("disconnect_failed"));
    } finally {
      setGscDisconnecting(false);
    }
  }

  async function saveGscProperty() {
    if (!gscPendingCredId || !gscSelectedProperty) return;
    setGscError(null);
    setGscSaving(true);
    try {
      const res = await fetch(
        `/api/internal/projects/${encodeURIComponent(props.projectId)}/gsc/select-property`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential_id: gscPendingCredId,
            property_url: gscSelectedProperty,
          }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setGscError(friendlyGscError(json.error ?? "save_property_failed"));
        setGscSaving(false);
        return;
      }
      setGscStatus({
        connected: true,
        id: gscPendingCredId,
        property_url: gscSelectedProperty,
        connected_email: null,
        connected_at: new Date().toISOString(),
      });
      setGscPendingCredId(null);
      setModal(null);
    } catch {
      setGscError(friendlyGscError("save_property_failed"));
    } finally {
      setGscSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <PortalLinkCard
        portalLoginUrl={props.portalLoginUrl}
        portalHref={props.portalHref}
      />

      <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div>
          <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Datos del proyecto
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Estos campos alimentan el portal del cliente. El cliente nunca
            recibe estos enlaces directamente: accede al portal con magic
            link y allí servimos la data desde las fuentes configuradas abajo.
          </p>
        </div>
        <Field
          label="Notion URL — página o base de datos del portal"
          hint={
            <>
              Puede ser la URL de una <strong className="text-zinc-300">página</strong> de Notion (el portal mostrará
              su contenido completo: títulos, listas, toggles, videos embebidos, sub-páginas, etc.) o de una{" "}
              <strong className="text-zinc-300">base de datos</strong> (muestra las filas en modo lista).
              En Notion abre la página o DB → ··· → Connections → conectar la integración de MenteMaestra.
              (<em>•••</em> → <em>Connect to</em>) para que el portal pueda
              leerla. El cliente la verá renderizada dentro de {" "}
              <code className="rounded bg-black/40 px-1 text-[11px]">/client/{props.projectSlug}</code>.
            </>
          }
        >
          <input
            type="url"
            value={notionUrl}
            onChange={(e) => setNotionUrl(e.target.value)}
            className={inputClass}
            placeholder="https://www.notion.so/tu-workspace/Nombre-de-pagina-32hexchars"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sanity dataset">
            <input
              value={sanity}
              onChange={(e) => setSanity(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Dashboard project key">
            <input
              value={dashboardKey}
              onChange={(e) => setDashboardKey(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field
          label="Sitio web del cliente (enlace en el pie del portal)"
          hint="URL pública del cliente (con https). Aparece como “Su sitio web” en el pie del portal cuando está relleno."
        >
          <input
            type="url"
            value={clientWebsiteUrl}
            onChange={(e) => setClientWebsiteUrl(e.target.value)}
            className={inputClass}
            placeholder="https://ejemplo.com"
          />
        </Field>

        <Field
          label="Vercel Project ID"
          hint="ID del proyecto en Vercel (prj_…). Se usa para mostrar las analíticas de tráfico del sitio del cliente en su portal."
        >
          <input
            type="text"
            value={vercelProjectId}
            onChange={(e) => setVercelProjectId(e.target.value)}
            className={inputClass}
            placeholder="prj_xxxxxxxxxxxxxxxxxxxx"
          />
        </Field>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveChanges}
            disabled={saving}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Más acciones del proyecto"
              title="Más acciones"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              <KebabIcon className="h-4 w-4" />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={openEditModal}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-200 transition hover:bg-zinc-900"
                >
                  <PencilIcon className="h-4 w-4 text-zinc-400" />
                  Editar detalles
                </button>
                <div className="h-px bg-zinc-900" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={openDeleteModal}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-300 transition hover:bg-red-950/40"
                >
                  <TrashIcon className="h-4 w-4" />
                  Eliminar proyecto
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div>
          <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Enviar onboarding
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Crea un enlace tokenizado y envía el correo al cliente. El cliente
            completa el formulario una sola vez y luego entra al portal con
            magic link. El envío quedará registrado en el historial abajo.
          </p>
        </div>
        <Field label="Correo del destinatario">
          <input
            type="email"
            enterKeyHint="send"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" && e.key !== "NumpadEnter") return;
              e.preventDefault();
              if (sending) return;
              void sendOnboarding();
            }}
            className={inputClass}
          />
        </Field>
        <button
          type="button"
          onClick={sendOnboarding}
          disabled={sending}
          className="justify-self-start rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-5 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? "Enviando…" : `Enviar correo a ${props.projectName}`}
        </button>
      </section>

      {/* ── Google Search Console section ──────────────────────────────────── */}
      <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <div>
          <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">
            Google Search Console
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Conecta una propiedad de GSC para mostrar analytics de búsqueda en
            el portal del cliente.
          </p>
        </div>
        {gscStatus.connected ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              <div className="min-w-0 text-xs leading-relaxed text-zinc-300">
                <p className="font-medium text-emerald-200">Conectado</p>
                <p className="truncate text-zinc-400">{gscStatus.property_url}</p>
                {gscStatus.connected_email ? (
                  <p className="text-zinc-500">Cuenta: {gscStatus.connected_email}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={connectGsc}
                disabled={gscConnecting}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {gscConnecting ? "Redirigiendo…" : "Reconectar"}
              </button>
              <button
                type="button"
                onClick={disconnectGsc}
                disabled={gscDisconnecting}
                className="rounded-lg border border-red-900/50 bg-transparent px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-950/30 disabled:opacity-60"
              >
                {gscDisconnecting ? "Desconectando…" : "Desconectar"}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={connectGsc}
            disabled={gscConnecting}
            className="justify-self-start rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-5 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gscConnecting ? "Redirigiendo a Google…" : "Conectar GSC"}
          </button>
        )}
        {gscError ? (
          <p className="text-xs text-red-300" role="alert">
            {gscError}
          </p>
        ) : null}
      </section>

      {message ? (
        <p className="text-sm text-emerald-300">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {friendlyError(error)}
        </p>
      ) : null}

      {modal === "gsc_select_property" ? (
        <ModalShell
          titleId="gsc-property-title"
          onBackdrop={() => { if (!gscSaving) setModal(null); }}
          accent="zinc"
          icon={<SearchIcon className="h-4 w-4" />}
          title="Seleccionar propiedad de GSC"
          description="Elige cuál de las propiedades accesibles quieres vincular a este proyecto."
        >
          {gscSites.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No se encontraron propiedades en la cuenta conectada. Asegúrate
              de que la cuenta tiene acceso en Google Search Console.
            </p>
          ) : (
            <div className="grid gap-2">
              {gscSites.map((site) => (
                <label
                  key={site.siteUrl}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm transition hover:bg-zinc-800 has-[:checked]:border-[#c9a07a]/60 has-[:checked]:bg-zinc-900"
                >
                  <input
                    type="radio"
                    name="gsc_property"
                    value={site.siteUrl}
                    checked={gscSelectedProperty === site.siteUrl}
                    onChange={() => setGscSelectedProperty(site.siteUrl)}
                    className="accent-[#c9a07a]"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-zinc-100">{site.siteUrl}</p>
                    <p className="text-xs text-zinc-500">{site.permissionLevel}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {gscError ? (
            <p className="mt-3 text-xs text-red-300" role="alert">{gscError}</p>
          ) : null}
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setModal(null)}
              disabled={gscSaving}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveGscProperty}
              disabled={gscSaving || !gscSelectedProperty}
              className="rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {gscSaving ? "Guardando…" : "Vincular propiedad"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {modal === "edit" ? (
        <ModalShell
          titleId="edit-project-title"
          onBackdrop={closeModal}
          accent="zinc"
          icon={<PencilIcon className="h-4 w-4" />}
          title="Editar detalles"
          description="Actualiza el nombre del proyecto y el nombre del cliente asociado."
        >
          <div className="grid gap-3">
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block uppercase tracking-[0.14em] text-zinc-500">
                Nombre del proyecto
              </span>
              <input
                ref={firstModalInputRef}
                type="text"
                autoComplete="off"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-zinc-400">
              <span className="mb-1 block uppercase tracking-[0.14em] text-zinc-500">
                Nombre del cliente
              </span>
              <input
                type="text"
                autoComplete="off"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          {editError ? (
            <p className="mt-3 text-xs text-red-300" role="alert">
              {friendlyError(editError)}
            </p>
          ) : null}
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={savingEdit}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={savingEdit}
              className="rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-4 py-2 text-sm font-semibold text-[#faf7f5] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingEdit ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </ModalShell>
      ) : null}

      {modal === "delete" ? (
        <ModalShell
          titleId="delete-project-title"
          onBackdrop={closeModal}
          accent="red"
          icon={<TrashIcon className="h-4 w-4" />}
          title={`Eliminar ${props.projectName}`}
          description="Esto borra el proyecto, su cliente asociado, las invitaciones y los formularios enviados. No se puede deshacer."
        >
          <p className="mb-2 text-xs text-zinc-400">
            Escribe{" "}
            <strong className="font-semibold text-zinc-200">
              {props.projectName}
            </strong>{" "}
            para confirmar:
          </p>
          <input
            ref={firstModalInputRef}
            type="text"
            autoComplete="off"
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={props.projectName}
            aria-label={`Escribe ${props.projectName} para confirmar la eliminación`}
            className="w-full rounded-lg border border-red-900/60 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400"
          />
          {deleteError ? (
            <p className="mt-3 text-xs text-red-300" role="alert">
              {friendlyError(deleteError)}
            </p>
          ) : null}
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={deleting}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={!canDelete || deleting}
              className="rounded-xl border border-red-700 bg-gradient-to-b from-red-700 to-red-800 px-4 py-2 text-sm font-semibold text-red-50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-[#c9a07a] focus:ring-1 focus:ring-[#c9a07a]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="mt-1.5 block text-[11px] leading-relaxed text-zinc-500">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

function PortalLinkCard({
  portalLoginUrl,
  portalHref,
}: {
  portalLoginUrl: string;
  portalHref: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(portalLoginUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("[portal-link-card] clipboard failed", err);
    }
  }

  return (
    <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
      <div>
        <h2 className="text-xs uppercase tracking-[0.14em] text-zinc-500">
          Portal del cliente
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Cada miembro del equipo recibe en su correo un enlace firmado y
          personal para entrar al portal. Esta es la URL pública de referencia
          (sin enlace personal no hay acceso); úsala para previsualizar el
          portal o compartir la ruta con alguien que perdió su correo de
          acceso.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200">
          {portalLoginUrl}
        </code>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copied ? "Copiado" : "Copiar"}
        </button>
        <a
          href={portalHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          <ExternalIcon className="h-3.5 w-3.5" />
          Abrir
        </a>
      </div>
    </section>
  );
}

function ModalShell({
  titleId,
  onBackdrop,
  accent,
  icon,
  title,
  description,
  children,
}: {
  titleId: string;
  onBackdrop: () => void;
  accent: "zinc" | "red";
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const iconWrap =
    accent === "red"
      ? "border-red-900/60 bg-red-950/60 text-red-300"
      : "border-zinc-800 bg-zinc-900 text-zinc-300";
  const panelBorder =
    accent === "red" ? "border-red-900/50" : "border-zinc-800";
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      <div
        aria-hidden="true"
        onClick={onBackdrop}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      <div
        className={`relative w-full max-w-md rounded-2xl border ${panelBorder} bg-zinc-950 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.6)]`}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-full border ${iconWrap}`}
          >
            {icon}
          </div>
          <div>
            <h2 id={titleId} className="text-sm font-semibold text-zinc-50">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-400">
              {description}
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function KebabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
      <path d="M13.5 6.5l3 3" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function ExternalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 3h7v7" />
      <path d="M21 3l-9 9" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function friendlyGscError(code: string): string {
  switch (code) {
    case "gsc_not_configured":
      return "GSC no está configurado. Define GSC_CLIENT_ID, GSC_CLIENT_SECRET y GSC_REDIRECT_URI.";
    case "encryption_key_missing":
      return "Falta GSC_TOKEN_ENCRYPTION_KEY. Genera uno con: openssl rand -hex 32.";
    case "access_denied":
    case "invalid_state":
      return "La autorización fue cancelada o el enlace expiró. Intenta de nuevo.";
    case "token_exchange_failed":
      return "Error al canjear el código OAuth. Intenta reconectar.";
    case "no_refresh_token":
      return "Google no devolvió un refresh token. Revoca el acceso en tu cuenta Google y vuelve a conectar.";
    case "save_failed":
      return "No pudimos guardar las credenciales. Revisa la base de datos.";
    case "not_connected":
      return "Esta propiedad no está conectada.";
    case "save_property_failed":
      return "No pudimos guardar la propiedad seleccionada.";
    case "connect_failed":
    default:
      return "No pudimos completar la acción. Intenta de nuevo.";
  }
}

function friendlyError(code: string): string {
  switch (code) {
    case "resend_not_configured":
      return "Resend no está configurado. Define RESEND_API_KEY y RESEND_FROM_EMAIL.";
    case "database_not_configured":
      return "La base de datos no está configurada.";
    case "invalid_to_email":
      return "Correo destinatario inválido.";
    case "not_found":
      return "Proyecto no encontrado.";
    case "invalid_project_name":
      return "El nombre del proyecto no puede quedar vacío.";
    case "invalid_client_name":
      return "El nombre del cliente no puede quedar vacío.";
    case "edit_failed":
      return "No pudimos guardar los cambios. Intenta de nuevo.";
    case "client_update_failed":
      return "No pudimos actualizar el nombre del cliente.";
    case "confirm_name_required":
      return "Escribe el nombre del proyecto para confirmar.";
    case "confirm_name_mismatch":
      return "El nombre no coincide con el proyecto.";
    case "delete_failed":
      return "No pudimos eliminar el proyecto. Intenta de nuevo.";
    default:
      return "No pudimos completar la acción.";
  }
}
