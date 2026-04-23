import { getNotionApiKey, parseNotionDatabaseId, queryProjectDatabase, type ProjectRow } from "@/lib/notion-client";

export default async function NotionRowList({
  notionUrl,
  supportEmail,
}: {
  notionUrl: string | null;
  supportEmail: string;
}) {
  if (!notionUrl) {
    return (
      <EmptyState>
        Tu operador aún no ha conectado el espacio de Notion. En cuanto esté
        listo, verás aquí las tareas y actualizaciones del proyecto.
      </EmptyState>
    );
  }
  if (!getNotionApiKey()) {
    return (
      <EmptyState>
        La integración con Notion no está configurada. Escríbenos a{" "}
        <SupportLink email={supportEmail} /> y te avisamos cuando esté lista.
      </EmptyState>
    );
  }
  const dbId = parseNotionDatabaseId(notionUrl);
  if (!dbId) {
    return (
      <EmptyState>
        El enlace de Notion guardado por el operador no corresponde a una base
        de datos. Pídele que lo actualice o escríbenos a{" "}
        <SupportLink email={supportEmail} />.
      </EmptyState>
    );
  }

  const result = await queryProjectDatabase(dbId);
  if (result.ok === false) {
    if (result.reason === "unauthorized") {
      return (
        <EmptyState>
          Nuestra integración de Notion aún no tiene acceso a esta base.
          Pídele a tu operador que la comparta con la integración de
          MenteMaestra, luego recarga esta página.
        </EmptyState>
      );
    }
    if (result.reason === "not_found") {
      return (
        <EmptyState>
          No encontramos la base de Notion vinculada. Escríbenos a{" "}
          <SupportLink email={supportEmail} />.
        </EmptyState>
      );
    }
    return (
      <EmptyState>
        No pudimos conectar con Notion en este momento. Intenta recargar la
        página en unos minutos.
      </EmptyState>
    );
  }

  if (result.rows.length === 0) {
    return (
      <EmptyState>
        Todavía no hay contenido en el espacio de Notion. Tu operador lo
        poblará pronto.
      </EmptyState>
    );
  }

  return (
    <ul className="divide-y divide-zinc-900 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/60">
      {result.rows.map((row) => (
        <NotionRow key={row.id} row={row} />
      ))}
    </ul>
  );
}

function NotionRow({ row }: { row: ProjectRow }) {
  return (
    <li className="grid gap-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-100">
          {row.title || "(Sin título)"}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
          {row.status ? (
            <span
              className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium"
              style={
                row.statusColor
                  ? {
                      borderColor: withAlpha(row.statusColor, 0.45),
                      backgroundColor: withAlpha(row.statusColor, 0.12),
                      color: withAlpha(row.statusColor, 1),
                    }
                  : undefined
              }
            >
              {row.status}
            </span>
          ) : null}
          {row.date ? (
            <span className="text-zinc-500">{formatDate(row.date)}</span>
          ) : null}
        </div>
      </div>
      {row.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {row.tags.map((tag) => (
            <span
              key={tag.name}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-300"
              style={
                tag.color
                  ? {
                      borderColor: withAlpha(tag.color, 0.4),
                      backgroundColor: withAlpha(tag.color, 0.1),
                      color: withAlpha(tag.color, 1),
                    }
                  : undefined
              }
            >
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
      {row.summary ? (
        <p className="text-xs text-zinc-500 line-clamp-2">{row.summary}</p>
      ) : null}
    </li>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm text-zinc-400">
      {children}
    </div>
  );
}

function SupportLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-[#c9a07a] underline underline-offset-2"
    >
      {email}
    </a>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// Notion select/multi_select colors are strings like "blue", "red", etc. We
// map them to hex (approx. of Notion's UI) and combine with an alpha helper.
const NOTION_COLOR_HEX: Record<string, string> = {
  default: "#a1a1aa",
  gray: "#a1a1aa",
  brown: "#b4886b",
  orange: "#f08a24",
  yellow: "#eab308",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
  red: "#ef4444",
};

function withAlpha(nameOrHex: string, alpha: number): string {
  const hex = NOTION_COLOR_HEX[nameOrHex] ?? nameOrHex;
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
