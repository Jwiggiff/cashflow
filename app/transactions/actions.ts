"use server";

import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function createTransaction(data: {
  description: string;
  type: TransactionType;
  categoryId: number | null;
  amount: number;
  accountId: number;
}) {
  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount = data.type === TransactionType.EXPENSE 
      ? Math.abs(data.amount) * -1 
      : Math.abs(data.amount);

    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        type: data.type,
        categoryId: data.categoryId,
        amount: finalAmount,
        accountId: data.accountId,
        date: new Date(),
      },
    });
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}

export async function updateTransaction(id: number, data: {
  description: string;
  type: TransactionType;
  categoryId: number | null;
  amount: number;
  accountId: number;
}) {
  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount = data.type === TransactionType.EXPENSE 
      ? Math.abs(data.amount) * -1 
      : Math.abs(data.amount);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: data.description,
        type: data.type,
        categoryId: data.categoryId,
        amount: finalAmount,
        accountId: data.accountId,
      },
    });
    return { success: true, data: transaction };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: number) {
  try {
    await prisma.transaction.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transaction:", error);
    return { success: false, error: "Failed to delete transaction" };
  }
}

// Transfer actions
export async function createTransfer(data: {
  description?: string;
  amount: number;
  fromAccountId: number;
  toAccountId: number;
}) {
  try {
    const transfer = await prisma.transfer.create({
      data: {
        description: data.description || "Transfer",
        amount: Math.abs(data.amount),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        date: new Date(),
      },
    });

    // Update account balances
    await prisma.account.update({
      where: { id: data.fromAccountId },
      data: { balance: { decrement: data.amount } },
    });

    await prisma.account.update({
      where: { id: data.toAccountId },
      data: { balance: { increment: data.amount } },
    });

    return { success: true, data: transfer };
  } catch (error) {
    console.error("Failed to create transfer:", error);
    return { success: false, error: "Failed to create transfer" };
  }
}

export async function updateTransfer(id: number, data: {
  description?: string;
  amount: number;
  fromAccountId: number;
  toAccountId: number;
}) {
  try {
    // Get the original transfer to calculate balance adjustments
    const originalTransfer = await prisma.transfer.findUnique({
      where: { id },
    });

    if (!originalTransfer) {
      return { success: false, error: "Transfer not found" };
    }

    const transfer = await prisma.transfer.update({
      where: { id },
      data: {
        description: data.description || "Transfer",
        amount: Math.abs(data.amount),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
      },
    });

    // Revert original transfer balances
    await prisma.account.update({
      where: { id: originalTransfer.fromAccountId },
      data: { balance: { increment: originalTransfer.amount } },
    });

    await prisma.account.update({
      where: { id: originalTransfer.toAccountId },
      data: { balance: { decrement: originalTransfer.amount } },
    });

    // Apply new transfer balances
    await prisma.account.update({
      where: { id: data.fromAccountId },
      data: { balance: { decrement: data.amount } },
    });

    await prisma.account.update({
      where: { id: data.toAccountId },
      data: { balance: { increment: data.amount } },
    });

    return { success: true, data: transfer };
  } catch (error) {
    console.error("Failed to update transfer:", error);
    return { success: false, error: "Failed to update transfer" };
  }
}

export async function deleteTransfer(id: number) {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      return { success: false, error: "Transfer not found" };
    }

    // Revert account balances
    await prisma.account.update({
      where: { id: transfer.fromAccountId },
      data: { balance: { increment: transfer.amount } },
    });

    await prisma.account.update({
      where: { id: transfer.toAccountId },
      data: { balance: { decrement: transfer.amount } },
    });

    await prisma.transfer.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete transfer:", error);
    return { success: false, error: "Failed to delete transfer" };
  }
} 