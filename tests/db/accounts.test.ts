import { createAccount, deleteAccount, updateAccount } from "@/app/accounts/actions";
import { prisma } from "@/lib/prisma";
import { describe, expect, it } from "vitest";
import { createAccountFor, createUser, signedInUser } from "./helpers";

describe("account actions", () => {
  it("rejects unauthenticated requests", async () => {
    const result = await createAccount({ name: "Checking", type: "CHECKING", balance: 0 });

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(await prisma.bankAccount.count()).toBe(0);
  });

  it("creates an account for the signed-in user", async () => {
    const user = await signedInUser();

    const result = await createAccount({ name: "Checking", type: "CHECKING", balance: 250 });

    expect(result.success).toBe(true);
    const accounts = await prisma.bankAccount.findMany();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({ name: "Checking", balance: 250, userId: user.id });
  });

  it("adds and removes aliases on update", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user);
    await prisma.accountAlias.create({ data: { name: "old", accountId: account.id } });

    const result = await updateAccount(account.id, {
      name: "Main Checking",
      type: "CHECKING",
      balance: 0,
      aliases: ["chk", "  ", "main"],
    });

    expect(result.success).toBe(true);
    const aliases = await prisma.accountAlias.findMany({ orderBy: { name: "asc" } });
    expect(aliases.map((a) => a.name)).toEqual(["chk", "main"]);
  });

  it("does not update or delete another user's account", async () => {
    const other = await createUser();
    const account = await createAccountFor(other, { name: "Theirs" });
    await signedInUser();

    const update = await updateAccount(account.id, { name: "Mine now", type: "CHECKING", balance: 0 });
    const del = await deleteAccount(account.id);

    expect(update.success).toBe(false);
    expect(del.success).toBe(false);
    expect(await prisma.bankAccount.findUnique({ where: { id: account.id } })).toMatchObject({
      name: "Theirs",
    });
  });
});

describe("balance snapshot triggers", () => {
  it("records a snapshot on insert and on each balance change", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });

    await prisma.bankAccount.update({ where: { id: account.id }, data: { balance: 150 } });
    await prisma.bankAccount.update({ where: { id: account.id }, data: { name: "Renamed" } });

    const snapshots = await prisma.balanceSnapshot.findMany({ orderBy: { id: "asc" } });
    expect(snapshots.map((s) => s.balance)).toEqual([100, 150]);
    expect(snapshots.every((s) => s.userId === user.id)).toBe(true);
  });

  it("records a zero balance when an account is deleted", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });

    await deleteAccount(account.id);

    const snapshots = await prisma.balanceSnapshot.findMany({ orderBy: { id: "asc" } });
    expect(snapshots.map((s) => s.balance)).toEqual([100, 0]);
  });

  it("removes a user's snapshots when the user is deleted", async () => {
    const user = await createUser();
    await createAccountFor(user, { balance: 100 });

    await prisma.user.delete({ where: { id: user.id } });

    expect(await prisma.balanceSnapshot.count()).toBe(0);
  });
});
