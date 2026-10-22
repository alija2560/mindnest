import { defineConfig } from "prisma/config";
import "dotenv/config";

export default defineConfig({
  schema: "schema.prisma",
  datasource: {
    //url: "postgres:123456@localhost:5433/postgres?schema=public",
    url: process.env.DATABASE_URL,
  },
});



