import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
  log: ["query", "info", "warn", "error"],
});

export async function dbConnect(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connection successful");
}
