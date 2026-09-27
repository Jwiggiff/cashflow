import { prisma } from "@/lib/prisma";
import { afterAll, beforeEach, vi } from "vitest";
import { resetDb, setSessionUser } from "./helpers";

// Server actions read the session through NextAuth; tests set it directly
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(async () => null),
}));

beforeEach(async () => {
  setSessionUser(null);
  await resetDb();
});

afterAll(async () => {
  await prisma.$disconnect();
});
