import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL 사용 (마이그레이션은 pgbouncer 안 거쳐야 함)
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
