import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  BASIC_AUTH_CHALLENGE_HEADER,
  verifyBasicAuth,
} from "@/lib/basic-auth";

/**
 * Gates `/internal/*` (CRM pages) and `/api/internal/*` (CRM route handlers)
 * with HTTP Basic Auth. Public `/client/*` is untouched — its RSC reads the
 * HMAC-signed `mm_portal_session` cookie (see `src/lib/portal-access.ts`)
 * and re-checks the live allowlist on every request, which is all the gate
 * that route needs.
 *
 * Fails closed: if `CRM_BASIC_AUTH_USER` / `CRM_BASIC_AUTH_PASS` are not set
 * the middleware returns 503 so the CRM cannot accidentally be exposed
 * without credentials. See docs/client-access-onboarding-crm.md §3.
 */
export function middleware(req: NextRequest) {
  const expectedUser = process.env.CRM_BASIC_AUTH_USER?.trim();
  const expectedPass = process.env.CRM_BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    return new NextResponse(
      "CRM disabled: set CRM_BASIC_AUTH_USER and CRM_BASIC_AUTH_PASS.",
      { status: 503 },
    );
  }

  const authHeader = req.headers.get("authorization");
  const ok = verifyBasicAuth(authHeader, {
    user: expectedUser,
    pass: expectedPass,
  });
  if (ok) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": BASIC_AUTH_CHALLENGE_HEADER },
  });
}

export const config = {
  matcher: ["/internal/:path*", "/api/internal/:path*"],
};
