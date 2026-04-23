/**
 * Server component — fetch + render a Notion page (block tree) for the
 * client portal. Used from the main dashboard and the nested subpage route.
 */

import {
  fetchBlockTree,
  getNotionApiKey,
  getPageMeta,
  parseNotionId,
  type PageIcon,
} from "@/lib/notion-client";
import NotionBlocks from "./NotionBlocks";

type Props = {
  /** The Notion page id (already in dashed UUID form). */
  pageId: string;
  /** Client project slug — needed for child_page links. */
  slug: string;
  supportEmail: string;
  /**
   * When true, this component will NOT render the PageBanner — the caller
   * is responsible for rendering it at the top of the viewport.
   */
  skipBanner?: boolean;
};

export default async function NotionPortalPage({
  pageId,
  slug,
  supportEmail,
  skipBanner = false,
}: Props) {
  if (!getNotionApiKey()) {
    return (
      <Notice>
        La integración con Notion no está configurada. Escríbenos a{" "}
        <SupportLink email={supportEmail} /> y te avisamos cuando esté lista.
      </Notice>
    );
  }

  if (!parseNotionId(pageId)) {
    return (
      <Notice>
        El identificador de página no es válido. Pídele al operador que
        revise el enlace guardado en el CRM.
      </Notice>
    );
  }

  const [result, meta] = await Promise.all([
    fetchBlockTree(pageId),
    getPageMeta(pageId),
  ]);

  if (!result.ok) {
    if (result.reason === "unauthorized") {
      return (
        <Notice>
          Nuestra integración de Notion no tiene acceso a esta página. El
          operador debe compartirla con la integración (Notion → ··· →
          Connections) y luego recargar.
        </Notice>
      );
    }
    if (result.reason === "not_found") {
      return (
        <Notice>
          No encontramos la página de Notion vinculada. Escríbenos a{" "}
          <SupportLink email={supportEmail} />.
        </Notice>
      );
    }
    return (
      <Notice>
        No pudimos conectar con Notion en este momento. Intenta recargar la
        página en unos minutos.
      </Notice>
    );
  }

  if (!result.blocks.length) {
    return (
      <div>
        {!skipBanner && meta.coverUrl && <PageBanner coverUrl={meta.coverUrl} />}
        <PageHeader icon={meta.icon} title={meta.title} />
        <Notice>
          Esta página de Notion está vacía. Tu operador pronto la completará.
        </Notice>
      </div>
    );
  }

  return (
    <div>
      {!skipBanner && meta.coverUrl && <PageBanner coverUrl={meta.coverUrl} />}
      <PageHeader icon={meta.icon} title={meta.title} />
      <NotionBlocks blocks={result.blocks} slug={slug} />
    </div>
  );
}

function PageHeader({
  icon,
  title,
}: {
  icon: PageIcon;
  title: string | null;
}) {
  if (!icon && !title) return null;

  const iconEl =
    icon?.type === "emoji" ? (
      <span className="text-5xl leading-none" aria-hidden="true">
        {icon.value}
      </span>
    ) : icon?.type === "url" ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={icon.value} alt="" className="h-12 w-12 rounded object-contain" />
    ) : null;

  return (
    <div className="mb-8">
      {iconEl && <div className="mb-3">{iconEl}</div>}
      {title && (
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">
          {title}
        </h1>
      )}
    </div>
  );
}

function PageBanner({ coverUrl }: { coverUrl: string }) {
  return (
    <div className="relative left-1/2 mb-10 h-64 w-screen -translate-x-1/2 overflow-hidden">
      {/* Sharp base image — no blur */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* Blur layer — masked so it only appears over the bottom portion */}
      <div className="absolute inset-0 backdrop-blur-[14px] [mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_25%,black_75%)]" />
      {/* Colour fade — blends the blurred bottom into the page background */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
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
