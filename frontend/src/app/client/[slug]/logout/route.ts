import { NextResponse } from "next/server";

import { applyClearPortalSessionCookie } from "@/lib/portal-access";

export const dynamic = "force-dynamic";

/**
 * Clears the portal session cookie and returns 204. The client-side button
 * calls this then does a hard navigation to `/client/<slug>/login`.
 * Cookie is cleared on the response object so the browser reliably drops it.
 */
export async function POST() {
  const res = new NextResponse(null, { status: 204 });
  applyClearPortalSessionCookie(res);
  return res;
}
