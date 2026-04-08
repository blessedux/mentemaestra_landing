import { NextResponse } from "next/server";

import { computeNativeAvailability } from "@/lib/compute-native-availability";

export const dynamic = "force-dynamic";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function ymdFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmdParam(s: string | null): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromParam = parseYmdParam(searchParams.get("from"));
  const toParam = parseYmdParam(searchParams.get("to"));
  const debugAvailability = searchParams.get("debug") === "1";

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = fromParam ?? ymdFromDate(defaultFrom);
  const to = toParam ?? ymdFromDate(defaultTo);

  const computed = await computeNativeAvailability({
    fromYmd: from,
    toYmd: to,
    debug: debugAvailability,
  });

  const { debug, ...rest } = computed;

  return NextResponse.json(
    {
      source: "native" as const,
      ...rest,
      ...(debug ? { _debug: debug } : {}),
    },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    },
  );
}
