import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { AccountType, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { vi } from "vitest";

export async function resetDb() {
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `SELECT name FROM sqlite_master
     WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'`
  );
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  }
  // Deleting accounts fires a trigger that writes snapshots, so clear them last
  await prisma.$executeRawUnsafe(`DELETE FROM "BalanceSnapshot"`);
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
}

export function setSessionUser(user: User | null) {
  vi.mocked(auth as unknown as () => Promise<unknown>).mockResolvedValue(
    user
      ? {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
          },
          expires: new Date(Date.now() + 60_000).toISOString(),
        }
      : null
  );
}

let userCount = 0;

export async function createUser(password = "password123") {
  userCount++;
  return prisma.user.create({
    data: {
      username: `user${userCount}`,
      password: await bcrypt.hash(password, 4),
    },
  });
}

export async function signedInUser() {
  const user = await createUser();
  setSessionUser(user);
  return user;
}

export function createAccountFor(
  user: User,
  data: { name?: string; balance?: number; type?: AccountType } = {}
) {
  return prisma.bankAccount.create({
    data: {
      name: data.name ?? "Checking",
      type: data.type ?? "CHECKING",
      balance: data.balance ?? 0,
      userId: user.id,
    },
  });
}

export async function balanceOf(accountId: number) {
  const account = await prisma.bankAccount.findUniqueOrThrow({
    where: { id: accountId },
  });
  return account.balance;
}
