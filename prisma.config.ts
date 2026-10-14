import "dotenv/config";
import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: path.join(process.cwd(), "schema.prisma"),
  migrations: {
    path: path.join(process.cwd(), "prisma/migrations"),
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});