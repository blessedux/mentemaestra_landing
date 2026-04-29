import { redirect } from "next/navigation";

import { readPortalSession } from "@/lib/portal-access";

import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function ReportsPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug.toLowerCase();

  const session = await readPortalSession();
  if (!session || session.slug !== slug || session.admin !== true) {
    redirect(`/client/${encodeURIComponent(slug)}/login?reason=no_session`);
  }

  return <ReportsClient slug={slug} />;
}

