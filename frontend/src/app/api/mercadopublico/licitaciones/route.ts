import { NextResponse } from "next/server";

import {
  buildLicitacionesUrl,
  isMercadoPublicoCodigoLicitacion,
  normalizeDdmmaaaa,
  type MercadoPublicoLicitacionEstado,
} from "@/lib/mercadopublico";

export const dynamic = "force-dynamic";

const allowedEstados = new Set<MercadoPublicoLicitacionEstado>([
  "publicada",
  "cerrada",
  "desierta",
  "adjudicada",
  "revocada",
  "suspendida",
  "todos",
  "activas",
]);

function pickEstado(raw: string | null): MercadoPublicoLicitacionEstado | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase() as MercadoPublicoLicitacionEstado;
  return allowedEstados.has(v) ? v : null;
}

export async function GET(req: Request) {
  const ticket = process.env.MERCADOPUBLICO_TICKET?.trim();
  if (!ticket) {
    return NextResponse.json(
      { ok: false, error: "mercadopublico_ticket_not_configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);

  const rawCodigo = searchParams.get("codigo");
  const codigo = rawCodigo?.trim() ? rawCodigo.trim() : undefined;
  if (codigo && !isMercadoPublicoCodigoLicitacion(codigo)) {
    return NextResponse.json({ ok: false, error: "invalid_codigo" }, {
      status: 400,
    });
  }

  const fecha = normalizeDdmmaaaa(searchParams.get("fecha") ?? "") ?? undefined;
  const estado = pickEstado(searchParams.get("estado"));

  const codigoProveedor = searchParams.get("CodigoProveedor")?.trim() || undefined;
  const codigoOrganismo = searchParams.get("CodigoOrganismo")?.trim() || undefined;

  if (!codigo && !fecha && !estado && !codigoProveedor && !codigoOrganismo) {
    // Don’t allow unbounded fetches by default.
    return NextResponse.json(
      {
        ok: false,
        error: "missing_query",
        hint:
          "Provide at least one of: codigo, fecha(ddmmaaaa), estado, CodigoProveedor, CodigoOrganismo",
      },
      { status: 400 },
    );
  }

  const upstreamUrl = buildLicitacionesUrl({
    ticket,
    ...(codigo ? { codigo } : {}),
    ...(fecha ? { fecha } : {}),
    ...(estado ? { estado } : {}),
    ...(codigoProveedor ? { CodigoProveedor: codigoProveedor } : {}),
    ...(codigoOrganismo ? { CodigoOrganismo: codigoOrganismo } : {}),
  });

  const res = await fetch(upstreamUrl, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "upstream_error", status: res.status, body: text },
      { status: 502 },
    );
  }

  // Upstream returns JSON.
  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

