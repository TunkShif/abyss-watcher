import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: ".dev.vars" });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
  schema: "./app/lib/database/schema.ts",
  dialect: "sqlite",
  dbCredentials: { url: process.env.DATABASE_URL },
  verbose: true,
  strict: true,
});
