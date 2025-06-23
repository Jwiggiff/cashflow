"use server";

import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

export async function createTransaction(data: {
  description: string;
  type: TransactionType;
  category: string;
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
        category: data.category,
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
  category: string;
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
        category: data.category,
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