import Link from "next/link";

import { getOnboardingSupportEmail } from "@/lib/onboarding-env";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ slug?: string | string[] }>;
};

const SLUG_RE = /^[a-z0-9][-a-z0-9]{0,62}[a-z0-9]$/i;

function pickSlug(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || !SLUG_RE.test(trimmed)) return null;
  return trimmed;
}

export default async function ClientAccessSuccessPage({
  searchParams,
}: PageProps) {
  const supportEmail = getOnboardingSupportEmail();
  const { slug: rawSlug } = await searchParams;
  const slug = pickSlug(rawSlug);
  const portalHref = slug ? `/client/${encodeURIComponent(slug)}` : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 py-16 text-zinc-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          MenteMaestra
        </p>
        <h1 className="mb-4 text-2xl font-semibold text-zinc-50">
          Recibimos tus datos
        </h1>
        <p className="mb-4 text-sm leading-relaxed text-zinc-400">
          Tu sesión quedó iniciada en este navegador. Cada persona del equipo
          también recibirá un correo con un enlace personal para entrar al
          portal desde cualquier dispositivo.
        </p>

        {portalHref ? (
          <Link
            href={portalHref}
            className="mb-5 inline-flex w-full items-center justify-center rounded-xl border border-[#c9a07a]/40 bg-gradient-to-b from-[#8f624c] to-[#6d4536] px-6 py-3 text-sm font-semibold text-[#faf7f5] shadow-sm transition hover:brightness-110"
          >
            Ir a mi portal
          </Link>
        ) : null}

        <p className="text-sm leading-relaxed text-zinc-400">
          Si notaste un error o necesitas cambiar a alguien del equipo,
          escríbenos a{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="text-[#c9a07a] underline decoration-[#c9a07a]/40 underline-offset-2 hover:decoration-[#c9a07a]"
          >
            {supportEmail}
          </a>
          . Más adelante, cuando tu dashboard de MenteMaestra esté activo,
          también podrás editar tu equipo desde tu perfil.
        </p>
      </div>
    </main>
  );
}
