import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// DATABASE_URL overrides the schema's datasource (used by tests)
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    process.env.DATABASE_URL
      ? { datasourceUrl: process.env.DATABASE_URL }
      : undefined
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
