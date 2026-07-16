import { defineConfig } from "drizzle-kit";

const tursoUrl = process.env.TURSO_DATABASE_URL;

export default defineConfig(
  tursoUrl
    ? {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "turso",
        dbCredentials: {
          url: tursoUrl,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        schema: "./src/db/schema.ts",
        out: "./drizzle",
        dialect: "sqlite",
        dbCredentials: {
          url: process.env.DATABASE_URL ?? "file:./data/app.db",
        },
      },
);
