export const MERCADOPUBLICO_BASE_URL =
  "https://api.mercadopublico.cl/servicios/v1/publico";

export type MercadoPublicoLicitacionEstado =
  | "publicada"
  | "cerrada"
  | "desierta"
  | "adjudicada"
  | "revocada"
  | "suspendida"
  | "todos"
  | "activas";

export function isMercadoPublicoCodigoLicitacion(s: string): boolean {
  // Example: 1509-5-L114
  return /^[0-9]+-[0-9]+-[A-Za-z0-9]+$/.test(s.trim());
}

export function normalizeDdmmaaaa(s: string): string | null {
  const digits = s.replace(/[^\d]/g, "");
  if (!/^\d{8}$/.test(digits)) return null;
  return digits;
}

export function buildLicitacionesUrl(params: {
  ticket: string;
  codigo?: string;
  fecha?: string; // ddmmaaaa
  estado?: MercadoPublicoLicitacionEstado;
  CodigoProveedor?: string;
  CodigoOrganismo?: string;
}): string {
  const url = new URL(`${MERCADOPUBLICO_BASE_URL}/licitaciones.json`);
  url.searchParams.set("ticket", params.ticket);
  if (params.codigo) url.searchParams.set("codigo", params.codigo);
  if (params.fecha) url.searchParams.set("fecha", params.fecha);
  if (params.estado) url.searchParams.set("estado", params.estado);
  if (params.CodigoProveedor) {
    url.searchParams.set("CodigoProveedor", params.CodigoProveedor);
  }
  if (params.CodigoOrganismo) {
    url.searchParams.set("CodigoOrganismo", params.CodigoOrganismo);
  }
  return url.toString();
}

export type MercadoPublicoListadoResponse = {
  Cantidad?: number;
  FechaCreacion?: string;
  Version?: string;
  Listado?: unknown[];
  [k: string]: unknown;
};

export type MercadoPublicoLicitacionDetalleResponse = {
  Cantidad?: number;
  FechaCreacion?: string;
  Version?: string;
  Listado?: unknown[];
  [k: string]: unknown;
};

