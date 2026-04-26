import Link from "next/link";

type Block = {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
};

function NavBlock({ href, title, description, icon, badge }: Block) {
  return (
    <Link
      href={href}
      className="group relative flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-950/60 px-5 py-4 transition hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition group-hover:border-zinc-700 group-hover:text-zinc-200">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-100">{title}</p>
          {badge ? (
            <span className="rounded-full border border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{description}</p>
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600 transition group-hover:text-zinc-400" />
    </Link>
  );
}

type Props = {
  slug: string;
  gscConnected: boolean;
};

export default function PortalNavBlocks({ slug, gscConnected }: Props) {
  const base = `/client/${encodeURIComponent(slug)}`;

  return (
    <section className="mb-8 grid gap-3 sm:grid-cols-2">
      <NavBlock
        href={`${base}/gsc`}
        title="Analytics de búsqueda"
        description={
          gscConnected
            ? "Clics, impresiones, CTR y consultas principales en Google."
            : "Tu operador aún no conectó Google Search Console."
        }
        badge={!gscConnected ? "Pendiente" : undefined}
        icon={<SearchIcon />}
      />
      <NavBlock
        href={`${base}/tickets`}
        title="Soporte y seguimiento"
        description="Consultas, solicitudes y seguimiento de tu proyecto."
        badge="Próximamente"
        icon={<TicketIcon />}
      />
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-4 w-4"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
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
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
