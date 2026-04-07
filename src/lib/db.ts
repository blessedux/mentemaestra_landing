import postgres from "postgres";

let sql: ReturnType<typeof postgres> | null = null;

export function getDb(): ReturnType<typeof postgres> | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!sql) {
    sql = postgres(url, { max: 1, prepare: false });
  }
  return sql;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
