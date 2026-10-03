import { POST } from "@/app/api/transactions/route";
import {
  assignTransactionAccount,
  deletePendingTransaction,
  getPendingTransaction,
  getPendingTransactionCount,
} from "@/app/transactions/actions";
import { deleteAccount } from "@/app/accounts/actions";
import NeedsAccountPage from "@/app/transactions/needs-account/[id]/page";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import {
  balanceOf,
  createAccountFor,
  createUser,
  setSessionUser,
  signedInUser,
} from "./helpers";

function post(body: unknown, auth?: string) {
  return POST(
    new NextRequest("http://localhost/api/transactions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(auth ? { authorization: auth } : {}),
      },
      body: JSON.stringify(body),
    })
  );
}

const basic = (username: string, password: string) =>
  `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

async function createApiUser(username: string) {
  return prisma.user.create({
    data: { username, password: await bcrypt.hash("password123", 4) },
  });
}

describe("pending transactions (no account on create)", () => {
  it("creates a pending transaction with no account and no balance change when `account` is omitted", async () => {
    const user = await createApiUser("alice");
    const account = await createAccountFor(user, { balance: 100 });

    const res = await post(
      { description: "Deposit", amount: 50, type: "INCOME" },
      basic("alice", "password123")
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.accountId).toBeNull();
    expect(await balanceOf(account.id)).toBe(100);
  });

  it("still 404s when `account` is passed but doesn't resolve", async () => {
    const user = await createApiUser("alice");
    await createAccountFor(user);

    const res = await post(
      { description: "x", amount: 1, type: "EXPENSE", account: "Nope" },
      basic("alice", "password123")
    );

    expect(res.status).toBe(404);
  });

  it("assigning an account applies the balance only once it's assigned, not at creation", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const pending = await prisma.transaction.create({
      data: {
        description: "Deposit",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: user.id,
        date: new Date(),
      },
    });

    expect(await balanceOf(account.id)).toBe(100);

    const result = await assignTransactionAccount(pending.id, account.id);

    expect(result.success).toBe(true);
    expect(await balanceOf(account.id)).toBe(150);
    const updated = await prisma.transaction.findUniqueOrThrow({ where: { id: pending.id } });
    expect(updated.accountId).toBe(account.id);
    expect(updated.userId).toBeNull();
  });

  it("only increments the balance once when assigned twice (double-click / two devices)", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const pending = await prisma.transaction.create({
      data: {
        description: "Deposit",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: user.id,
        date: new Date(),
      },
    });

    const [first, second] = await Promise.all([
      assignTransactionAccount(pending.id, account.id),
      assignTransactionAccount(pending.id, account.id),
    ]);

    const results = [first, second];
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.filter((r) => !r.success)).toHaveLength(1);
    expect(await balanceOf(account.id)).toBe(150);
  });

  it("discards a pending transaction without touching any balance", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const pending = await prisma.transaction.create({
      data: {
        description: "Junk",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: user.id,
        date: new Date(),
      },
    });

    const result = await deletePendingTransaction(pending.id);

    expect(result.success).toBe(true);
    expect(await prisma.transaction.findUnique({ where: { id: pending.id } })).toBeNull();
    expect(await balanceOf(account.id)).toBe(100);
  });

  it("cross-user: user B cannot see, assign, or discard user A's pending transaction", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const bobsAccount = await createAccountFor(bob, { balance: 100 });
    const pending = await prisma.transaction.create({
      data: {
        description: "Alice's deposit",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: alice.id,
        date: new Date(),
      },
    });

    setSessionUser(bob);

    expect(await getPendingTransaction(pending.id)).toBeNull();
    expect(await getPendingTransactionCount()).toBe(0);

    const assignResult = await assignTransactionAccount(pending.id, bobsAccount.id);
    expect(assignResult.success).toBe(false);
    expect(await balanceOf(bobsAccount.id)).toBe(100);

    const deleteResult = await deletePendingTransaction(pending.id);
    expect(deleteResult.success).toBe(false);
    expect(await prisma.transaction.findUnique({ where: { id: pending.id } })).not.toBeNull();
  });

  it("cross-user: cannot assign a pending transaction to another user's account", async () => {
    const alice = await signedInUser();
    const bob = await createUser();
    const bobsAccount = await createAccountFor(bob);
    const pending = await prisma.transaction.create({
      data: {
        description: "Deposit",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: alice.id,
        date: new Date(),
      },
    });

    const result = await assignTransactionAccount(pending.id, bobsAccount.id);

    expect(result.success).toBe(false);
    expect(await prisma.transaction.findUniqueOrThrow({ where: { id: pending.id } })).toMatchObject({
      accountId: null,
    });
  });
});

describe("needs-account page", () => {
  it("redirects to the index for a non-numeric id", async () => {
    await signedInUser();

    await expect(
      NeedsAccountPage({ params: Promise.resolve({ id: "abc" }) })
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/transactions/needs-account;"),
    });
  });
});

describe("account deletion vs. pending transactions", () => {
  it("refuses to delete an account that still has transactions (FK restrict, not a silent null-out)", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const transaction = await prisma.transaction.create({
      data: { description: "x", amount: 10, type: "EXPENSE", accountId: account.id, date: new Date() },
    });

    const result = await deleteAccount(account.id);

    expect(result.success).toBe(false);
    const stillThere = await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } });
    expect(stillThere.accountId).toBe(account.id);
  });

  it("does not touch pending transactions when deleting an account", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const pending = await prisma.transaction.create({
      data: {
        description: "Unrelated pending",
        amount: 50,
        type: "INCOME",
        accountId: null,
        userId: user.id,
        date: new Date(),
      },
    });

    await deleteAccount(account.id);

    expect(await prisma.transaction.findUnique({ where: { id: pending.id } })).not.toBeNull();
  });
});
