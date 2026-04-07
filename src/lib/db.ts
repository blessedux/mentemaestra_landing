import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

/**
 * Normalize hosted Postgres URLs for serverless (Supabase pooler, etc.).
 * Transaction pooler on Supabase expects `pgbouncer=true`; SSL is required.
 */
export function resolveDatabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (host.includes("pooler.supabase.com")) {
      if (!u.searchParams.has("pgbouncer")) {
        u.searchParams.set("pgbouncer", "true");
      }
    }
    if (
      (host.includes("supabase.com") || host.endsWith("supabase.co")) &&
      !u.searchParams.has("sslmode")
    ) {
      u.searchParams.set("sslmode", "require");
    }
    return u.toString();
  } catch {
    return trimmed;
  }
}

function isSupabaseHost(url: string): boolean {
  return /supabase\.(com|co)/i.test(url);
}

export function getDb(): ReturnType<typeof postgres> | null {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return null;
  if (!sql) {
    const url = resolveDatabaseUrl(raw);
    // Transaction poolers (Supabase included) break startup type introspection; keep it off.
    sql = postgres(url, {
      max: 1,
      prepare: false,
      fetch_types: false,
      connect_timeout: 20,
      ...(isSupabaseHost(url) ? { ssl: "require" as const } : {}),
    });
  }
  return sql;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
