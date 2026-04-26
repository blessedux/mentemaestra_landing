import Link from "next/link";

import PortalSupportButton from "./PortalSupportButton";

type Props = {
  /** Client project slug — portal and profile routes. */
  slug: string;
  supportEmail: string;
  /** Optional URL for “Su sitio web” (stored on the project). */
  clientWebsiteUrl?: string | null;
};

function portalHref(slug: string) {
  return `/client/${encodeURIComponent(slug)}`;
}

function profileHref(slug: string) {
  return `/client/${encodeURIComponent(slug)}/profile`;
}

function gscHref(slug: string) {
  return `/client/${encodeURIComponent(slug)}/gsc`;
}

function externalClientSiteHref(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const linkClass =
  "text-sm text-zinc-400 underline-offset-2 transition hover:text-zinc-200 hover:underline whitespace-nowrap";

export default function PortalFooter({
  slug,
  supportEmail,
  clientWebsiteUrl,
}: Props) {
  const site = clientWebsiteUrl?.trim();
  const siteHref = site ? externalClientSiteHref(site) : null;

  return (
    <footer className="mt-auto border-t border-zinc-800/80 pt-10 pb-8">
      <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
        <div className="min-w-0 shrink-0 text-left">
          {/* Same line-height / fonts as landing `Hero` title; `div` avoids a second page-level h1. */}
          <div className="text-4xl font-normal leading-[0.52] tracking-tight text-white md:text-5xl">
            <Link
              href="/"
              className="block text-inherit no-underline transition hover:opacity-90"
              aria-label="Volver a MenteMaestra"
            >
              <span className="block font-hero-bootzy">Mente</span>
              <span className="block font-hero-new-icon-script">Maestra</span>
            </Link>
          </div>
          {/* "DESIGN STUDIO" label — bootzy, super small, letter-spaced to span logotype width */}
          <span className="mt-2 block w-full font-hero-bootzy text-[0.42rem] tracking-[0.38em] text-zinc-600 uppercase">
            DESIGN STUDIO
          </span>
        </div>

        <nav
          aria-label="Enlaces del portal"
          className="flex flex-col gap-2 sm:items-end sm:text-right"
        >
          <Link href={profileHref(slug)} className={linkClass}>
            Mi perfil
          </Link>
          <Link href={gscHref(slug)} className={linkClass}>
            Analytics
          </Link>
          <Link href={portalHref(slug)} className={linkClass}>
            Volver al portal
          </Link>
          <Link href="/" className={linkClass}>
            Volver a MenteMaestra
          </Link>
          {siteHref ? (
            <a
              href={siteHref}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Su sitio web
            </a>
          ) : null}
          {/* Danger icon button — inline with nav links, opens support popover */}
          <PortalSupportButton supportEmail={supportEmail} />
        </nav>
      </div>
    </footer>
  );
}
