import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

console.log("=== DEBUG DATABASE_URL ===", process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient({ adapter });
console.log("EXACT DATABASE_URL IS:", process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const pool = new Pool({ 
  connectionString,
  ssl: false // یا { rejectUnauthorized: false }
});