import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/**
 * Drizzle client bound to the Neon connection string injected by Vercel
 * (POSTGRES_URL). Import `db` from anywhere in the Next.js app. Do not import
 * from client components.
 */
type Database = ReturnType<typeof createDatabase>;

let database: Database | undefined;

function createDatabase() {
  const connectionString = process.env["POSTGRES_URL"];
  if (!connectionString) {
    throw new Error("POSTGRES_URL is required before accessing the database");
  }

  return drizzle({ client: new Pool({ connectionString }), schema });
}

export function getDb(): Database {
  database ??= createDatabase();
  return database;
}

export const db = new Proxy({} as Database, {
  get(_target, property) {
    const active = getDb();
    const value: unknown = Reflect.get(active, property, active);
    return typeof value === "function" ? value.bind(active) : value;
  },
});

export { schema };
export * from "./schema";
