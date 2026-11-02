import "dotenv/config";
// @ts-expect-error - Prisma exposes this module at runtime when the Prisma CLI is installed.
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
