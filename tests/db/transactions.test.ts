import {
  bulkDeleteItems,
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

  // Known bug: the transaction row is written before the account ownership
  // check, so it is left behind for another user's account. Change to it()
  // once createTransaction verifies the account first.
  it.fails("does not create transactions on another user's account", async () => {
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

  // Known bug: the transaction is deleted before the ownership check.
  // Change to it() once deleteTransaction verifies ownership first.
  it.fails("does not delete another user's transaction", async () => {
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

  // Known bug: createTransfer never checks account ownership. Change to it()
  // once it does.
  it.fails("does not transfer out of another user's account", async () => {
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
});
