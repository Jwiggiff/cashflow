"use server";

import prisma from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { CSVTransaction } from "@/lib/csv-parser";

// Helper function to parse CSV dates properly
function parseCSVDate(dateString: string): Date | null {
  const trimmed = dateString.trim();

  if (!trimmed) {
    return null;
  }

  try {
    // Parse the date string
    const parsedDate = new Date(trimmed);

    // Validate the date
    if (isNaN(parsedDate.getTime())) {
      return null;
    }

    // Check if the original string contains time information
    const hasTime = /\d{1,2}:\d{1,2}/.test(trimmed);

    if (!hasTime) {
      // For dates without time, create a date at noon in local time
      // This ensures consistent behavior and avoids timezone edge cases
      return new Date(
        parsedDate.getFullYear(),
        parsedDate.getMonth(),
        parsedDate.getDate(),
        12, // noon
        0,
        0,
        0
      );
    }

    // For dates with time, return the parsed date
    // Prisma will handle the timezone conversion to UTC for storage
    return parsedDate;
  } catch (error) {
    console.error(`Failed to parse date: ${trimmed}`, error);
    return null;
  }
}

export async function createTransaction(data: {
  description: string;
  type: TransactionType;
  categoryId: number | null;
  amount: number;
  accountId: number;
}) {
  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
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

export async function updateTransaction(
  id: number,
  data: {
    description: string;
    type: TransactionType;
    categoryId: number | null;
    amount: number;
    accountId: number;
  }
) {
  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
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

export async function updateTransfer(
  id: number,
  data: {
    description?: string;
    amount: number;
    fromAccountId: number;
    toAccountId: number;
  }
) {
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

export async function bulkDeleteItems(
  items: Array<{ id: number; type: string }>
) {
  try {
    const transactionIds: number[] = [];
    const transferIds: number[] = [];

    // Separate transactions and transfers
    items.forEach((item) => {
      if (item.type === "TRANSFER") {
        transferIds.push(item.id);
      } else {
        transactionIds.push(item.id);
      }
    });

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      let deletedTransactions = 0;
      let deletedTransfers = 0;

      // Delete transactions
      if (transactionIds.length > 0) {
        await tx.transaction.deleteMany({
          where: { id: { in: transactionIds } },
        });
        deletedTransactions = transactionIds.length;
      }

      // Delete transfers and revert account balances
      if (transferIds.length > 0) {
        const transfers = await tx.transfer.findMany({
          where: { id: { in: transferIds } },
        });

        // Revert account balances for all transfers
        for (const transfer of transfers) {
          await tx.account.update({
            where: { id: transfer.fromAccountId },
            data: { balance: { increment: transfer.amount } },
          });

          await tx.account.update({
            where: { id: transfer.toAccountId },
            data: { balance: { decrement: transfer.amount } },
          });
        }

        await tx.transfer.deleteMany({
          where: { id: { in: transferIds } },
        });
        deletedTransfers = transferIds.length;
      }

      return { deletedTransactions, deletedTransfers };
    });

    return {
      success: true,
      deletedTransactions: result.deletedTransactions,
      deletedTransfers: result.deletedTransfers,
    };
  } catch (error) {
    console.error("Failed to bulk delete items:", error);
    return { success: false, error: "Failed to delete selected items" };
  }
}

export async function bulkImportTransactions(
  transactions: CSVTransaction[],
  accountId: number
) {
  try {
    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      let totalBalanceChange = 0;
      let skippedTransactions = 0;

      for (const csvTransaction of transactions) {
        // Parse the date from the CSV using our helper function
        const transactionDate = parseCSVDate(csvTransaction.date);

        if (!transactionDate) {
          console.warn(
            `Skipping transaction with invalid date: ${csvTransaction.date}`
          );
          skippedTransactions++;
          continue;
        }

        // Determine transaction type and amount
        const amount = csvTransaction.income - csvTransaction.expense;
        const type =
          amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;

        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            description: csvTransaction.merchant,
            type,
            amount,
            accountId,
            date: transactionDate,
            categoryId: null, // No category mapping for now
          },
        });

        createdTransactions.push(transaction);
        totalBalanceChange += amount;
      }

      // Update the account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: totalBalanceChange } },
      });

      return {
        transactions: createdTransactions,
        totalBalanceChange,
        skippedTransactions,
      };
    });

    const message = `Successfully imported ${
      result.transactions.length
    } transactions${
      result.skippedTransactions > 0
        ? ` (${result.skippedTransactions} skipped due to invalid dates)`
        : ""
    }`;

    return {
      success: true,
      data: result,
      message,
    };
  } catch (error) {
    console.error("Failed to bulk import transactions:", error);
    return {
      success: false,
      error:
        "Failed to import transactions. Please check your CSV format and try again.",
    };
  }
}
