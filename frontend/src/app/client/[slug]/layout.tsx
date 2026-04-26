import { SpeedInsights } from "@vercel/speed-insights/next";

import ClarityScript from "@/components/portal/ClarityScript";

/**
 * Portal layout — shared by all /client/[slug]/* routes.
 * Adds:
 *   - Vercel Speed Insights (Core Web Vitals tracking)
 *   - Microsoft Clarity (heatmaps + session recordings) when CLARITY_PROJECT_ID is set
 */
export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const clarityId = process.env.CLARITY_PROJECT_ID?.trim();

  return (
    <>
      {children}
      <SpeedInsights />
      {clarityId ? <ClarityScript projectId={clarityId} /> : null}
    </>
  );
}
