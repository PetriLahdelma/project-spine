import { defineConfig } from "drizzle-kit";

if (!process.env.POSTGRES_URL) {
  // Not fatal — allow generate-without-push workflows — but warn loudly.
  console.warn("drizzle-kit: POSTGRES_URL is not set. Migration push will fail.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL ?? "",
  },
  strict: true,
  verbose: true,
});
