import "server-only";

import { readFileSync } from "fs";
import path from "path";

import type { GscDashboardData } from "@/lib/gsc-client";
import type { AnalyticsStrategyResult } from "@/lib/analytics-strategy";

let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const p = path.join(process.cwd(), "src/lib/email-templates/analytics-report-es.html");
  cachedTemplate = readFileSync(p, "utf8");
  return cachedTemplate;
}

/** Resend dashboard templates use `{{{VARIABLE_KEY}}}` (triple braces). */
const RESEND_PLACEHOLDER = (key: string) => `{{{${key}}}}`;

export const RESEND_ANALYTICS_REPORT_VARIABLE_KEYS = [
  "PROJECT_NAME",
  "DATE_RANGE",
  "GSC_PROPERTY",
  "TOTAL_CLICKS",
  "TOTAL_IMPRESSIONS",
  "AVG_CTR",
  "AVG_POSITION",
  "TREND_SVG",
  "SEO_ACTION",
  "SEO_TARGET",
  "SEO_IMPACT",
  "SEO_EFFORT",
  "TOP_QUERIES_ROWS",
  "TOP_PAGES_ROWS",
  "ANALYTICS_URL",
  "PORTAL_URL",
  "SUPPORT_EMAIL",
] as const;

export type ResendAnalyticsReportVariableKey =
  (typeof RESEND_ANALYTICS_REPORT_VARIABLE_KEYS)[number];

export type AnalyticsReportEmailVars = {
  projectName: string;
  supportEmail: string;
  analyticsUrl: string;
  portalUrl: string;
  gscProperty: string;
  gscData: GscDashboardData;
  strategy: AnalyticsStrategyResult;
};

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function fmtPos(n: number): string {
  return n.toFixed(1);
}

function escHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildTrendSvg(data: GscDashboardData): string {
  const trend = data.trend.slice(-28);
  const w = 640;
  const h = 160;
  const padX = 10;
  const padY = 12;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  const clicks = trend.map((p) => p.clicks);
  const impressions = trend.map((p) => p.impressions);

  const max = Math.max(1, ...clicks, ...impressions);
  const min = 0;

  const x = (i: number) =>
    padX + (trend.length <= 1 ? 0 : (i / (trend.length - 1)) * innerW);
  const y = (v: number) =>
    padY + innerH - ((v - min) / (max - min)) * innerH;

  const pathFor = (arr: number[]) =>
    arr
      .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(2)} ${y(v).toFixed(2)}`)
      .join(" ");

  const clicksPath = pathFor(clicks);
  const impPath = pathFor(impressions);

  return `
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Tendencia de clics e impresiones">
  <rect x="0" y="0" width="${w}" height="${h}" rx="14" fill="rgba(24,24,27,0.25)"/>
  <path d="${impPath}" fill="none" stroke="rgba(228,228,231,0.45)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${clicksPath}" fill="none" stroke="rgba(201,160,122,0.95)" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  <g font-family="ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" font-size="11" fill="rgba(161,161,170,0.9)">
    <text x="16" y="22">Impresiones</text>
    <text x="120" y="22" fill="rgba(201,160,122,0.95)">Clics</text>
  </g>
</svg>`.trim();
}

function rowHtml(label: string, clicks: number, ctr: number, position: number): string {
  return `
<tr>
  <td class="td">${escHtml(label)}</td>
  <td class="td" style="text-align:right">${Number(clicks).toLocaleString("es-CL")}</td>
  <td class="td" style="text-align:right">${fmtPct(Number(ctr))}</td>
  <td class="td" style="text-align:right">${fmtPos(Number(position))}</td>
</tr>`.trim();
}

function buildTopRows(kind: "query" | "page", data: GscDashboardData): string {
  if (kind === "query") {
    return data.topQueries
      .slice(0, 8)
      .map((r) => rowHtml(r.query, r.clicks, r.ctr, r.position))
      .join("");
  }
  return data.topPages
    .slice(0, 8)
    .map((r) => rowHtml(r.page, r.clicks, r.ctr, r.position))
    .join("");
}

export function buildResendAnalyticsReportVariables(
  vars: AnalyticsReportEmailVars,
): Record<ResendAnalyticsReportVariableKey, string> {
  const { gscData, strategy } = vars;
  const dateRange = `${gscData.dateRange.start} → ${gscData.dateRange.end}`;
  const top = strategy.strategy.seoPriorities[0];

  return {
    PROJECT_NAME: vars.projectName,
    DATE_RANGE: dateRange,
    GSC_PROPERTY: vars.gscProperty,
    TOTAL_CLICKS: Number(gscData.overview.totalClicks).toLocaleString("es-CL"),
    TOTAL_IMPRESSIONS: Number(gscData.overview.totalImpressions).toLocaleString("es-CL"),
    AVG_CTR: fmtPct(gscData.overview.avgCtr),
    AVG_POSITION: fmtPos(gscData.overview.avgPosition),
    TREND_SVG: buildTrendSvg(gscData),
    SEO_ACTION: top?.action ?? "Mejorar meta titles y H1",
    SEO_TARGET: top?.target ?? "Páginas con más impresiones",
    SEO_IMPACT: top?.impact ?? "medio",
    SEO_EFFORT: top?.effort ?? "medio",
    TOP_QUERIES_ROWS: buildTopRows("query", gscData),
    TOP_PAGES_ROWS: buildTopRows("page", gscData),
    ANALYTICS_URL: vars.analyticsUrl,
    PORTAL_URL: vars.portalUrl,
    SUPPORT_EMAIL: vars.supportEmail,
  };
}

function applyPlaceholders(
  html: string,
  map: Record<string, string>,
): string {
  let out = html;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(RESEND_PLACEHOLDER(k)).join(v);
  }
  return out;
}

/** Renders the local HTML file (same markup as uploaded to Resend). */
export function renderAnalyticsReportEmailEs(
  vars: AnalyticsReportEmailVars,
): string {
  const html = loadTemplate();
  const v = buildResendAnalyticsReportVariables(vars);
  return applyPlaceholders(html, v as unknown as Record<string, string>);
}

