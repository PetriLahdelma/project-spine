import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "./schema";

/**
 * Drizzle client bound to the Vercel Postgres connection injected by the
 * Vercel integration (POSTGRES_URL). Import `db` from anywhere in the
 * Next.js app. Do not import from client components.
 */
export const db = drizzle(sql, { schema });

export { schema };
export * from "./schema";
