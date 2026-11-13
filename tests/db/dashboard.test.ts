import { getExpenseBreakdown } from "@/app/dashboard/actions";
import { createTransaction } from "@/app/transactions/actions";
import { prisma } from "@/lib/prisma";
import { describe, expect, it } from "vitest";
import { createAccountFor, signedInUser } from "./helpers";

describe("getExpenseBreakdown", () => {
  it("labels expenses without a category as Uncategorized", async () => {
    const user = await signedInUser();
    const account = await createAccountFor(user, { balance: 500 });
    const food = await prisma.category.create({
      data: { name: "Food", userId: user.id },
    });

    for (const [amount, categoryId] of [
      [30, food.id],
      [20, null],
    ] as const) {
      await createTransaction({
        description: "Expense",
        type: "EXPENSE",
        categoryId,
        amount,
        accountId: account.id,
      });
    }

    const breakdown = await getExpenseBreakdown();
    expect(breakdown).toHaveLength(2);
    expect(breakdown).toEqual(
      expect.arrayContaining([
        { category: "Food", value: 30 },
        { category: "Uncategorized", value: 20 },
      ]),
    );
  });
});
