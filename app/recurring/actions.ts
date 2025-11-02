"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function createRecurringTransaction(data: {
  description: string;
  type: TransactionType;
  categoryId: number | null;
  amount: number;
  accountId: number;
  rrule: string;
  startDate: Date;
  nextDueDate: Date;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify account ownership
    const account = await prisma.bankAccount.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Verify category ownership if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: session.user.id },
      });

      if (!category) {
        return { success: false, error: "Category not found" };
      }
    }

    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
        ? Math.abs(data.amount) * -1
        : Math.abs(data.amount);

    const recurringTransaction = await prisma.recurringTransaction.create({
      data: {
        description: data.description,
        type: data.type,
        categoryId: data.type === TransactionType.EXPENSE ? data.categoryId : null,
        amount: finalAmount,
        accountId: data.accountId,
        rrule: data.rrule,
        startDate: data.startDate,
        nextDueDate: data.nextDueDate,
      },
    });

    return { success: true, data: recurringTransaction };
  } catch (error) {
    console.error("Failed to create recurring transaction:", error);
    return { success: false, error: "Failed to create recurring transaction" };
  }
}

export async function updateRecurringTransaction(
  id: number,
  data: {
    description: string;
    type: TransactionType;
    categoryId: number | null;
    amount: number;
    accountId: number;
    rrule: string;
    startDate: Date;
    nextDueDate: Date;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify recurring transaction ownership
    const existingRecurringTransaction =
      await prisma.recurringTransaction.findFirst({
        where: {
          id,
          account: { userId: session.user.id },
        },
      });

    if (!existingRecurringTransaction) {
      return { success: false, error: "Recurring transaction not found" };
    }

    // Verify account ownership
    const account = await prisma.bankAccount.findFirst({
      where: { id: data.accountId, userId: session.user.id },
    });

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Verify category ownership if provided
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId: session.user.id },
      });

      if (!category) {
        return { success: false, error: "Category not found" };
      }
    }

    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
        ? Math.abs(data.amount) * -1
        : Math.abs(data.amount);

    const recurringTransaction = await prisma.recurringTransaction.update({
      where: { id },
      data: {
        description: data.description,
        type: data.type,
        categoryId: data.type === TransactionType.EXPENSE ? data.categoryId : null,
        amount: finalAmount,
        accountId: data.accountId,
        rrule: data.rrule,
        startDate: data.startDate,
        nextDueDate: data.nextDueDate,
      },
    });

    return { success: true, data: recurringTransaction };
  } catch (error) {
    console.error("Failed to update recurring transaction:", error);
    return { success: false, error: "Failed to update recurring transaction" };
  }
}

export async function deleteRecurringTransaction(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify recurring transaction ownership
    const existingRecurringTransaction =
      await prisma.recurringTransaction.findFirst({
        where: {
          id,
          account: { userId: session.user.id },
        },
      });

    if (!existingRecurringTransaction) {
      return { success: false, error: "Recurring transaction not found" };
    }

    await prisma.recurringTransaction.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete recurring transaction:", error);
    return { success: false, error: "Failed to delete recurring transaction" };
  }
}

export async function createRecurringTransfer(data: {
  description?: string;
  amount: number;
  fromAccountId: number;
  toAccountId: number;
  rrule: string;
  startDate: Date;
  nextDueDate: Date;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify both accounts ownership
    const fromAccount = await prisma.bankAccount.findFirst({
      where: { id: data.fromAccountId, userId: session.user.id },
    });

    const toAccount = await prisma.bankAccount.findFirst({
      where: { id: data.toAccountId, userId: session.user.id },
    });

    if (!fromAccount || !toAccount) {
      return { success: false, error: "One or both accounts not found" };
    }

    if (data.fromAccountId === data.toAccountId) {
      return {
        success: false,
        error: "From and To accounts must be different",
      };
    }

    const recurringTransfer = await prisma.recurringTransfer.create({
      data: {
        description: data.description || "Recurring Transfer",
        amount: Math.abs(data.amount),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        rrule: data.rrule,
        startDate: data.startDate,
        nextDueDate: data.nextDueDate,
      },
    });

    return { success: true, data: recurringTransfer };
  } catch (error) {
    console.error("Failed to create recurring transfer:", error);
    return { success: false, error: "Failed to create recurring transfer" };
  }
}

export async function updateRecurringTransfer(
  id: number,
  data: {
    description?: string;
    amount: number;
    fromAccountId: number;
    toAccountId: number;
    rrule: string;
    startDate: Date;
    nextDueDate: Date;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify recurring transfer ownership
    const existingRecurringTransfer = await prisma.recurringTransfer.findFirst({
      where: {
        id,
        fromAccount: { userId: session.user.id },
        toAccount: { userId: session.user.id },
      },
    });

    if (!existingRecurringTransfer) {
      return { success: false, error: "Recurring transfer not found" };
    }

    // Verify both accounts ownership
    const fromAccount = await prisma.bankAccount.findFirst({
      where: { id: data.fromAccountId, userId: session.user.id },
    });

    const toAccount = await prisma.bankAccount.findFirst({
      where: { id: data.toAccountId, userId: session.user.id },
    });

    if (!fromAccount || !toAccount) {
      return { success: false, error: "One or both accounts not found" };
    }

    if (data.fromAccountId === data.toAccountId) {
      return {
        success: false,
        error: "From and To accounts must be different",
      };
    }

    const recurringTransfer = await prisma.recurringTransfer.update({
      where: { id },
      data: {
        description: data.description || "Recurring Transfer",
        amount: Math.abs(data.amount),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        rrule: data.rrule,
        startDate: data.startDate,
        nextDueDate: data.nextDueDate,
      },
    });

    return { success: true, data: recurringTransfer };
  } catch (error) {
    console.error("Failed to update recurring transfer:", error);
    return { success: false, error: "Failed to update recurring transfer" };
  }
}

export async function deleteRecurringTransfer(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Verify recurring transfer ownership
    const existingRecurringTransfer = await prisma.recurringTransfer.findFirst({
      where: {
        id,
        fromAccount: { userId: session.user.id },
        toAccount: { userId: session.user.id },
      },
    });

    if (!existingRecurringTransfer) {
      return { success: false, error: "Recurring transfer not found" };
    }

    await prisma.recurringTransfer.delete({ where: { id } });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete recurring transfer:", error);
    return { success: false, error: "Failed to delete recurring transfer" };
  }
}

export async function toggleRecurringItemActive(
  type: "transaction" | "transfer",
  id: number,
  isActive: boolean
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    if (type === "transaction") {
      // Verify recurring transaction ownership
      const existingRecurringTransaction =
        await prisma.recurringTransaction.findFirst({
          where: {
            id,
            account: { userId: session.user.id },
          },
        });

      if (!existingRecurringTransaction) {
        return { success: false, error: "Recurring transaction not found" };
      }

      const recurringTransaction = await prisma.recurringTransaction.update({
        where: { id },
        data: { isActive },
      });

      return { success: true, data: recurringTransaction };
    } else {
      // Verify recurring transfer ownership
      const existingRecurringTransfer = await prisma.recurringTransfer.findFirst({
        where: {
          id,
          fromAccount: { userId: session.user.id },
          toAccount: { userId: session.user.id },
        },
      });

      if (!existingRecurringTransfer) {
        return { success: false, error: "Recurring transfer not found" };
      }

      const recurringTransfer = await prisma.recurringTransfer.update({
        where: { id },
        data: { isActive },
      });

      return { success: true, data: recurringTransfer };
    }
  } catch (error) {
    console.error("Failed to toggle recurring item active status:", error);
    return {
      success: false,
      error: "Failed to toggle recurring item active status",
    };
  }
}