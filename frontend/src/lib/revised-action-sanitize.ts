/**
 * Normalizes LLM `revisedAction` for strategy suggestion titles.
 * Filters placeholders and punctuation-only junk (e.g. ":") that break the UI.
 */
export function sanitizeRevisedActionTitle(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const t = raw.replace(/\s+/g, " ").trim();
  if (t.length < 2) return null;
  // Single punctuation / separators often come from misparsed tool output
  if (/^[:;|.,\-–—·]+$/.test(t)) return null;
  if (t.length > 220) return t.slice(0, 220).trim();
  return t;
}
