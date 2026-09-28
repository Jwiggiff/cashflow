import {
  bulkDeleteItems,
  updateTransfer,
  bulkImportTransactions,
  convertTransactionsToTransfer,
  createTransaction,
  createTransfer,
  deleteTransaction,
  deleteTransfer,
  updateTransaction,
} from "@/app/transactions/actions";
import { prisma } from "@/lib/prisma";
import { describe, expect, it } from "vitest";
import type { User } from "@prisma/client";
import { balanceOf, createAccountFor, createUser, signedInUser } from "./helpers";

describe("transaction actions", () => {
  it("stores expenses as negative amounts and updates the balance", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });

    const result = await createTransaction({
      description: "Groceries",
      type: "EXPENSE",
      categoryId: null,
      amount: 40,
      accountId: account.id,
    });

    expect(result.success).toBe(true);
    expect(result.data?.amount).toBe(-40);
    expect(await balanceOf(account.id)).toBe(60);
  });

  it("drops the category from income", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user);
    const category = await prisma.category.create({ data: { name: "Food", userId: user.id } });

    const result = await createTransaction({
      description: "Paycheck",
      type: "INCOME",
      categoryId: category.id,
      amount: 1000,
      accountId: account.id,
    });

    expect(result.data).toMatchObject({ amount: 1000, categoryId: null });
  });

  it("moves the amount between accounts on update", async () => {
    const user = await signedInUser();
    const checking = await createAccountFor(user, { name: "Checking", balance: 100 });
    const savings = await createAccountFor(user, { name: "Savings", balance: 100 });
    const { data } = await createTransaction({
      description: "Coffee",
      type: "EXPENSE",
      categoryId: null,
      amount: 5,
      accountId: checking.id,
    });

    await updateTransaction(data!.id, {
      description: "Coffee",
      type: "EXPENSE",
      categoryId: null,
      amount: 7,
      accountId: savings.id,
    });

    expect(await balanceOf(checking.id)).toBe(100);
    expect(await balanceOf(savings.id)).toBe(93);
  });

  it("reverts the balance on delete", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });
    const { data } = await createTransaction({
      description: "Coffee",
      type: "EXPENSE",
      categoryId: null,
      amount: 5,
      accountId: account.id,
    });

    await deleteTransaction(data!.id);

    expect(await prisma.transaction.count()).toBe(0);
    expect(await balanceOf(account.id)).toBe(100);
  });

  it("does not create transactions on another user's account", async () => {
    const other = await createUser();
    const account = await createAccountFor(other, { balance: 100 });
    await signedInUser();

    await createTransaction({
      description: "Sneaky",
      type: "INCOME",
      categoryId: null,
      amount: 5,
      accountId: account.id,
    });

    expect(await prisma.transaction.count()).toBe(0);
  });

  it("does not delete another user's transaction", async () => {
    const other = await createUser();
    const account = await createAccountFor(other);
    const tx = await prisma.transaction.create({
      data: { description: "Rent", type: "EXPENSE", amount: -500, accountId: account.id, date: new Date() },
    });
    await signedInUser();

    await deleteTransaction(tx.id);

    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).not.toBeNull();
  });
});

describe("transaction actions across users", () => {
  async function othersTransaction() {
    const other = await createUser();
    const account = await createAccountFor(other, { balance: 100 });
    const tx = await prisma.transaction.create({
      data: { description: "Rent", type: "EXPENSE", amount: -50, accountId: account.id, date: new Date() },
    });
    return { other, account, tx };
  }

  const expense = (accountId: number, categoryId: number | null = null) => ({
    description: "Edited",
    type: "EXPENSE" as const,
    categoryId,
    amount: 1,
    accountId,
  });

  it("does not update another user's transaction", async () => {
    const { account, tx } = await othersTransaction();
    const user = await signedInUser();
    const mine = await createAccountFor(user);

    const result = await updateTransaction(tx.id, expense(mine.id));

    expect(result).toEqual({ success: false, error: "Transaction not found" });
    expect(await prisma.transaction.findUnique({ where: { id: tx.id } })).toMatchObject({
      description: "Rent",
      accountId: account.id,
    });
    expect(await balanceOf(account.id)).toBe(100);
  });

  it("does not move a transaction into another user's account", async () => {
    const { account: theirs } = await othersTransaction();
    const user = await signedInUser();
    const mine = await createAccountFor(user, { balance: 100 });
    const { data } = await createTransaction(expense(mine.id));

    const result = await updateTransaction(data!.id, expense(theirs.id));

    expect(result).toEqual({ success: false, error: "Account not found" });
    expect(await prisma.transaction.findUnique({ where: { id: data!.id } })).toMatchObject({
      accountId: mine.id,
    });
    expect(await balanceOf(mine.id)).toBe(99);
    expect(await balanceOf(theirs.id)).toBe(100);
  });

  it("does not attach another user's category", async () => {
    const other = await createUser();
    const theirCategory = await prisma.category.create({ data: { name: "Secret", userId: other.id } });
    const user = await signedInUser();
    const mine = await createAccountFor(user, { balance: 100 });

    const created = await createTransaction(expense(mine.id, theirCategory.id));
    expect(created).toEqual({ success: false, error: "Category not found" });
    expect(await prisma.transaction.count()).toBe(0);

    const { data } = await createTransaction(expense(mine.id));
    const updated = await updateTransaction(data!.id, expense(mine.id, theirCategory.id));
    expect(updated).toEqual({ success: false, error: "Category not found" });
    expect(await prisma.transaction.findUnique({ where: { id: data!.id } })).toMatchObject({
      categoryId: null,
    });
  });
});

describe("transfer actions across users", () => {
  async function setup() {
    const other = await createUser();
    const theirA = await createAccountFor(other, { name: "A", balance: 100 });
    const theirB = await createAccountFor(other, { name: "B", balance: 100 });
    const transfer = await prisma.transfer.create({
      data: { description: "Theirs", amount: 10, fromAccountId: theirA.id, toAccountId: theirB.id, date: new Date() },
    });
    const user = await signedInUser();
    const mineA = await createAccountFor(user, { name: "Mine A", balance: 100 });
    const mineB = await createAccountFor(user, { name: "Mine B", balance: 100 });
    return { user, theirA, theirB, transfer, mineA, mineB };
  }

  it("does not transfer into another user's account", async () => {
    const { mineA, theirA } = await setup();

    const result = await createTransfer({ amount: 50, fromAccountId: mineA.id, toAccountId: theirA.id });

    expect(result.success).toBe(false);
    expect(await balanceOf(mineA.id)).toBe(100);
    expect(await balanceOf(theirA.id)).toBe(100);
    expect(await prisma.transfer.count()).toBe(1);
  });

  it("does not update another user's transfer", async () => {
    const { transfer, theirA, theirB, mineA, mineB } = await setup();

    const result = await updateTransfer(transfer.id, { amount: 99, fromAccountId: mineA.id, toAccountId: mineB.id });

    expect(result).toEqual({ success: false, error: "Transfer not found" });
    expect(await prisma.transfer.findUnique({ where: { id: transfer.id } })).toMatchObject({
      amount: 10,
      fromAccountId: theirA.id,
    });
    for (const id of [theirA.id, theirB.id, mineA.id, mineB.id]) {
      expect(await balanceOf(id)).toBe(100);
    }
  });

  it("does not repoint a transfer at another user's account", async () => {
    const { mineA, mineB, theirA } = await setup();
    const { data } = await createTransfer({ amount: 10, fromAccountId: mineA.id, toAccountId: mineB.id });

    const result = await updateTransfer(data!.id, { amount: 10, fromAccountId: theirA.id, toAccountId: mineB.id });

    expect(result.success).toBe(false);
    expect(await balanceOf(theirA.id)).toBe(100);
    expect(await balanceOf(mineA.id)).toBe(90);
    expect(await balanceOf(mineB.id)).toBe(110);
  });

  it("does not delete another user's transfer", async () => {
    const { transfer, theirA, theirB } = await setup();

    const result = await deleteTransfer(transfer.id);

    expect(result).toEqual({ success: false, error: "Transfer not found" });
    expect(await prisma.transfer.count()).toBe(1);
    expect(await balanceOf(theirA.id)).toBe(100);
    expect(await balanceOf(theirB.id)).toBe(100);
  });
});

describe("transfer actions", () => {
  it("moves money between accounts and reverts on delete", async () => {
    const user = await signedInUser();
    const checking = await createAccountFor(user, { name: "Checking", balance: 100 });
    const savings = await createAccountFor(user, { name: "Savings", balance: 0 });

    const { data } = await createTransfer({ amount: 30, fromAccountId: checking.id, toAccountId: savings.id });

    expect(data?.description).toBe("Transfer");
    expect(await balanceOf(checking.id)).toBe(70);
    expect(await balanceOf(savings.id)).toBe(30);

    await deleteTransfer(data!.id);

    expect(await balanceOf(checking.id)).toBe(100);
    expect(await balanceOf(savings.id)).toBe(0);
  });

  it("does not transfer out of another user's account", async () => {
    const other = await createUser();
    const theirs = await createAccountFor(other, { balance: 100 });
    const user = await signedInUser();
    const mine = await createAccountFor(user, { balance: 0 });

    await createTransfer({ amount: 100, fromAccountId: theirs.id, toAccountId: mine.id });

    expect(await balanceOf(theirs.id)).toBe(100);
  });

  it("converts a matching expense/income pair into a transfer", async () => {
    const user = await signedInUser();
    const checking = await createAccountFor(user, { name: "Checking", balance: 100 });
    const savings = await createAccountFor(user, { name: "Savings", balance: 100 });
    const out = await createTransaction({ description: "To savings", type: "EXPENSE", categoryId: null, amount: 25, accountId: checking.id });
    const into = await createTransaction({ description: "From checking", type: "INCOME", categoryId: null, amount: 25, accountId: savings.id });

    const result = await convertTransactionsToTransfer([out.data!.id, into.data!.id]);

    expect(result.success).toBe(true);
    expect(await prisma.transaction.count()).toBe(0);
    expect(await prisma.transfer.findFirst()).toMatchObject({
      amount: 25,
      fromAccountId: checking.id,
      toAccountId: savings.id,
    });
    expect(await balanceOf(checking.id)).toBe(75);
    expect(await balanceOf(savings.id)).toBe(125);
  });

  it("refuses to convert transactions with different amounts", async () => {
    const user = await signedInUser();
    const checking = await createAccountFor(user, { name: "Checking" });
    const savings = await createAccountFor(user, { name: "Savings" });
    const out = await createTransaction({ description: "a", type: "EXPENSE", categoryId: null, amount: 25, accountId: checking.id });
    const into = await createTransaction({ description: "b", type: "INCOME", categoryId: null, amount: 20, accountId: savings.id });

    const result = await convertTransactionsToTransfer([out.data!.id, into.data!.id]);

    expect(result).toMatchObject({ success: false });
    expect(await prisma.transfer.count()).toBe(0);
  });
});

describe("bulk actions", () => {
  it("deletes transactions and transfers and reverts balances", async () => {
    const user = await signedInUser();
    const checking = await createAccountFor(user, { name: "Checking", balance: 100 });
    const savings = await createAccountFor(user, { name: "Savings", balance: 0 });
    const tx = await createTransaction({ description: "Coffee", type: "EXPENSE", categoryId: null, amount: 5, accountId: checking.id });
    const tf = await createTransfer({ amount: 20, fromAccountId: checking.id, toAccountId: savings.id });

    const result = await bulkDeleteItems([
      { id: tx.data!.id, type: "EXPENSE" },
      { id: tf.data!.id, type: "TRANSFER" },
    ]);

    expect(result).toMatchObject({ success: true, deletedTransactions: 1, deletedTransfers: 1 });
    expect(await balanceOf(checking.id)).toBe(100);
    expect(await balanceOf(savings.id)).toBe(0);
  });

  it("imports CSV rows, skipping invalid dates", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 100 });

    const result = await bulkImportTransactions(
      [
        { date: "2025-01-02", merchant: "Coffee", expense: 5, income: 0, balance: 95 },
        { date: "2025-01-03", merchant: "Paycheck", expense: 0, income: 1000, balance: 1095 },
        { date: "not a date", merchant: "Broken", expense: 1, income: 0, balance: 0 },
      ],
      account.id
    );

    expect(result.success).toBe(true);
    expect(result.data?.skippedTransactions).toBe(1);
    const rows = await prisma.transaction.findMany({ orderBy: { date: "asc" } });
    expect(rows.map((r) => [r.description, r.type, r.amount])).toEqual([
      ["Coffee", "EXPENSE", -5],
      ["Paycheck", "INCOME", 1000],
    ]);
    expect(await balanceOf(account.id)).toBe(1095);
  });

  it("keeps the CSV calendar date in timezones behind UTC", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 0 });
    const originalTZ = process.env.TZ;
    // The Docker image runs with TZ=America/New_York
    process.env.TZ = "America/New_York";
    try {
      await bulkImportTransactions(
        [
          { date: "2025-01-02", merchant: "ISO date", expense: 5, income: 0, balance: 0 },
          { date: "01/03/2025", merchant: "US date", expense: 5, income: 0, balance: 0 },
        ],
        account.id
      );

      const rows = await prisma.transaction.findMany({ orderBy: { date: "asc" } });
      expect(
        rows.map((r) => [r.description, r.date.getMonth() + 1, r.date.getDate()])
      ).toEqual([
        ["ISO date", 1, 2],
        ["US date", 1, 3],
      ]);
    } finally {
      process.env.TZ = originalTZ;
    }
  });

  it("rolls back the whole import when the account is not the user's", async () => {
    const other = await createUser();
    const account = await createAccountFor(other, { balance: 100 });
    await signedInUser();

    const result = await bulkImportTransactions(
      [{ date: "2025-01-02", merchant: "Coffee", expense: 5, income: 0, balance: 95 }],
      account.id
    );

    expect(result.success).toBe(false);
    expect(await prisma.transaction.count()).toBe(0);
  });

  it("bulk delete only touches the user's own items", async () => {
    const other = await createUser();
    const theirA = await createAccountFor(other, { balance: 100 });
    const theirB = await createAccountFor(other, { balance: 100 });
    const theirTx = await prisma.transaction.create({
      data: { description: "Rent", type: "EXPENSE", amount: -50, accountId: theirA.id, date: new Date() },
    });
    const theirTf = await prisma.transfer.create({
      data: { amount: 10, fromAccountId: theirA.id, toAccountId: theirB.id, date: new Date() },
    });
    const user = await signedInUser();
    const mine = await createAccountFor(user, { balance: 100 });
    const { data: myTx } = await createTransaction({ description: "Coffee", type: "EXPENSE", categoryId: null, amount: 5, accountId: mine.id });

    const result = await bulkDeleteItems([
      { id: myTx!.id, type: "EXPENSE" },
      { id: theirTx.id, type: "EXPENSE" },
      { id: theirTf.id, type: "TRANSFER" },
    ]);

    expect(result).toMatchObject({ success: true, deletedTransactions: 1, deletedTransfers: 0 });
    expect(await prisma.transaction.findUnique({ where: { id: theirTx.id } })).not.toBeNull();
    expect(await prisma.transfer.count()).toBe(1);
    expect(await balanceOf(mine.id)).toBe(100);
    expect(await balanceOf(theirA.id)).toBe(100);
    expect(await balanceOf(theirB.id)).toBe(100);
  });
});

describe("auto-categorization during import", () => {
  async function categorizedHistory(owner: User, merchant: string, categoryName: string) {
    const account = await createAccountFor(owner, { name: `${owner.username} history` });
    const category = await prisma.category.create({ data: { name: categoryName, userId: owner.id } });
    await prisma.transaction.create({
      data: { description: merchant, type: "EXPENSE", amount: -5, accountId: account.id, categoryId: category.id, date: new Date() },
    });
    return category;
  }

  const coffeeRow = [{ date: "2025-01-02", merchant: "Blue Bottle", expense: 5, income: 0, balance: 0 }];

  it("learns categories from the user's own history", async () => {
    const user = await signedInUser();
    const category = await categorizedHistory(user, "Blue Bottle", "Coffee");
    const account = await createAccountFor(user);

    const result = await bulkImportTransactions(coffeeRow, account.id, true);

    expect(result.data?.categorizedTransactions).toBe(1);
    const imported = await prisma.transaction.findFirst({ where: { accountId: account.id } });
    expect(imported?.categoryId).toBe(category.id);
  });

  it("never uses another user's transactions or categories", async () => {
    const other = await createUser();
    await categorizedHistory(other, "Blue Bottle", "Their Coffee");
    const user = await signedInUser();
    const account = await createAccountFor(user);

    const result = await bulkImportTransactions(coffeeRow, account.id, true);

    expect(result.success).toBe(true);
    expect(result.data?.categorizedTransactions).toBe(0);
    const imported = await prisma.transaction.findFirst({ where: { accountId: account.id } });
    expect(imported?.categoryId).toBeNull();
  });
});
