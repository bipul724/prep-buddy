// Prisma 7 config (verified with Prisma CLI 7.10.0, which logs "Loaded Prisma config from prisma.config.ts").
// Prisma 7 does not auto-load .env, so dotenv is imported here.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
