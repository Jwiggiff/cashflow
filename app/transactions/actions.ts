"use server";

import { auth } from "@/lib/auth";
import { autoCategorize } from "@/lib/auto-categorizer";
import { CSVTransaction } from "@/lib/csv-parser";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

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
  source?: string | null;
  type: TransactionType;
  categoryId: number | null;
  amount: number;
  accountId: number;
  date?: Date;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
        ? Math.abs(data.amount) * -1
        : Math.abs(data.amount);

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        description: data.description,
        source: data.source,
        type: data.type,
        categoryId: data.type === TransactionType.EXPENSE ? data.categoryId : null,
        amount: finalAmount,
        accountId: data.accountId,
        date: data.date || new Date(),
      },
    });

    // Update the account balance
    await prisma.bankAccount.update({
      where: { id: data.accountId, userId: session.user.id },
      data: { balance: { increment: finalAmount } },
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
    source?: string | null;
    type: TransactionType;
    categoryId: number | null;
    amount: number;
    accountId: number;
    date?: Date;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // If it's an expense, ensure the amount is negative
    const finalAmount =
      data.type === TransactionType.EXPENSE
        ? Math.abs(data.amount) * -1
        : Math.abs(data.amount);

    // Get the original transaction to calculate balance adjustments
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!originalTransaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Update the transaction
    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: data.description,
        source: data.source,
        type: data.type,
        categoryId: data.type === TransactionType.EXPENSE ? data.categoryId : null,
        amount: finalAmount,
        accountId: data.accountId,
        date: data.date,
      },
    });

    // Revert the original transaction balance
    await prisma.bankAccount.update({
      where: { id: originalTransaction.accountId, userId: session.user.id },
      data: { balance: { decrement: originalTransaction.amount } },
    });

    // Update the account balance
    await prisma.bankAccount.update({
      where: { id: data.accountId, userId: session.user.id },
      data: { balance: { increment: finalAmount } },
    });

    return { success: true, data: transaction };
  } catch (error) {
    console.error("Failed to update transaction:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the original transaction to calculate balance adjustments
    const originalTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!originalTransaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Delete the transaction
    await prisma.transaction.delete({ where: { id } });

    // Revert the account balance
    await prisma.bankAccount.update({
      where: { id: originalTransaction?.accountId, userId: session.user.id },
      data: { balance: { decrement: originalTransaction?.amount } },
    });
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
  date?: Date;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const transfer = await prisma.transfer.create({
      data: {
        description: data.description || "Transfer",
        amount: Math.abs(data.amount),
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        date: data.date || new Date(),
      },
    });

    // Update account balances
    await prisma.bankAccount.update({
      where: { id: data.fromAccountId },
      data: { balance: { decrement: data.amount } },
    });

    await prisma.bankAccount.update({
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
    date?: Date;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

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
        date: data.date,
      },
    });

    // Revert original transfer balances
    await prisma.bankAccount.update({
      where: { id: originalTransfer.fromAccountId, userId: session.user.id },
      data: { balance: { increment: originalTransfer.amount } },
    });

    await prisma.bankAccount.update({
      where: { id: originalTransfer.toAccountId, userId: session.user.id },
      data: { balance: { decrement: originalTransfer.amount } },
    });

    // Apply new transfer balances
    await prisma.bankAccount.update({
      where: { id: data.fromAccountId, userId: session.user.id },
      data: { balance: { decrement: data.amount } },
    });

    await prisma.bankAccount.update({
      where: { id: data.toAccountId, userId: session.user.id },
      data: { balance: { increment: data.amount } },
    });

    return { success: true, data: transfer };
  } catch (error) {
    console.error("Failed to update transfer:", error);
    return { success: false, error: "Failed to update transfer" };
  }
}

export async function deleteTransfer(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      return { success: false, error: "Transfer not found" };
    }

    // Revert account balances
    await prisma.bankAccount.update({
      where: { id: transfer.fromAccountId, userId: session.user.id },
      data: { balance: { increment: transfer.amount } },
    });

    await prisma.bankAccount.update({
      where: { id: transfer.toAccountId, userId: session.user.id },
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
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

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

      // Delete transactions and revert account balances
      if (transactionIds.length > 0) {
        const transactions = await tx.transaction.findMany({
          where: { id: { in: transactionIds } },
        });

        // Delete transactions
        await tx.transaction.deleteMany({
          where: { id: { in: transactionIds } },
        });
        deletedTransactions = transactionIds.length;

        // Revert account balances for all transactions
        for (const transaction of transactions) {
          await tx.bankAccount.update({
            where: { id: transaction.accountId, userId: session.user.id },
            data: { balance: { increment: transaction.amount } },
          });
        }
      }

      // Delete transfers and revert account balances
      if (transferIds.length > 0) {
        const transfers = await tx.transfer.findMany({
          where: { id: { in: transferIds } },
        });

        // Revert account balances for all transfers
        for (const transfer of transfers) {
          await tx.bankAccount.update({
            where: { id: transfer.fromAccountId, userId: session.user.id },
            data: { balance: { increment: transfer.amount } },
          });

          await tx.bankAccount.update({
            where: { id: transfer.toAccountId, userId: session.user.id },
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
  accountId: number,
  enableAutoCategorize: boolean = false
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get categories for auto-categorization
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    // Pre-process transactions and perform auto-categorization outside the transaction
    const processedTransactions: Array<{
      description: string;
      type: TransactionType;
      amount: number;
      date: Date;
      categoryId: number | null;
    }> = [];
    let skippedTransactions = 0;
    let categorizedTransactions = 0;

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

      // Auto-categorize if enabled (outside transaction to avoid timeouts)
      let categoryId: number | null = null;
      if (enableAutoCategorize && type === TransactionType.EXPENSE) {
        const categorization = await autoCategorize(
          csvTransaction.merchant,
          categories
        );

        if (categorization.categoryId) {
          categoryId = categorization.categoryId;
          categorizedTransactions++;
        }
      }

      processedTransactions.push({
        description: csvTransaction.merchant,
        type,
        amount,
        date: transactionDate,
        categoryId,
      });
    }

    // Use a transaction only for the database operations
    const result = await prisma.$transaction(async (tx) => {
      const createdTransactions = [];
      let totalBalanceChange = 0;

      for (const processedTransaction of processedTransactions) {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            description: processedTransaction.description,
            type: processedTransaction.type,
            amount: processedTransaction.amount,
            accountId,
            date: processedTransaction.date,
            categoryId: processedTransaction.categoryId,
          },
        });

        createdTransactions.push(transaction);
        totalBalanceChange += processedTransaction.amount;
      }

      // Update the account balance
      await tx.bankAccount.update({
        where: { id: accountId, userId: session.user.id },
        data: { balance: { increment: totalBalanceChange } },
      });

      return {
        transactions: createdTransactions,
        totalBalanceChange,
      };
    });

    const message = `Successfully imported ${
      result.transactions.length
    } transactions${
      skippedTransactions > 0
        ? ` (${skippedTransactions} skipped due to invalid dates)`
        : ""
    }${
      enableAutoCategorize
        ? ` (${categorizedTransactions} auto-categorized)`
        : ""
    }`;

    return {
      success: true,
      data: {
        ...result,
        skippedTransactions,
        categorizedTransactions,
      },
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

export async function convertTransactionsToTransfer(transactionIds: number[]) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (transactionIds.length !== 2) {
    return {
      success: false,
      error: "Exactly 2 transactions are required to create a transfer",
    };
  }

  try {
    // Get the two transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        account: {
          userId: session.user.id,
        },
      },
      include: {
        account: true,
      },
    });

    if (transactions.length !== 2) {
      return { success: false, error: "One or more transactions not found" };
    }

    const [transaction1, transaction2] = transactions;

    // Check if transactions are from different accounts
    if (transaction1.accountId === transaction2.accountId) {
      return {
        success: false,
        error:
          "Transactions must be from different accounts to create a transfer",
      };
    }

    // Determine which is the "from" and which is the "to" account
    // We'll use the transaction with negative amount as "from" (money leaving)
    // and positive amount as "to" (money entering)
    let fromTransaction, toTransaction;

    if (transaction1.amount < 0 && transaction2.amount > 0) {
      fromTransaction = transaction1;
      toTransaction = transaction2;
    } else if (transaction1.amount > 0 && transaction2.amount < 0) {
      fromTransaction = transaction2;
      toTransaction = transaction1;
    } else {
      return {
        success: false,
        error:
          "Transactions must have opposite signs (one positive, one negative) to create a transfer",
      };
    }

    // Check if amounts are equal (absolute values)
    if (Math.abs(fromTransaction.amount) !== Math.abs(toTransaction.amount)) {
      return {
        success: false,
        error: "Transaction amounts must be equal to create a transfer",
      };
    }

    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Create the transfer
      const transfer = await tx.transfer.create({
        data: {
          description: `Transfer from ${fromTransaction.account.name} to ${toTransaction.account.name}`,
          amount: Math.abs(fromTransaction.amount),
          fromAccountId: fromTransaction.accountId,
          toAccountId: toTransaction.accountId,
          date: new Date(
            Math.max(
              new Date(fromTransaction.date).getTime(),
              new Date(toTransaction.date).getTime()
            )
          ),
        },
      });

      // Delete the original transactions
      await tx.transaction.deleteMany({
        where: { id: { in: transactionIds } },
      });

      // Revert the balance changes from the original transactions
      await tx.bankAccount.update({
        where: { id: fromTransaction.accountId },
        data: { balance: { decrement: fromTransaction.amount } },
      });

      await tx.bankAccount.update({
        where: { id: toTransaction.accountId },
        data: { balance: { decrement: toTransaction.amount } },
      });

      // Apply the transfer balance changes
      await tx.bankAccount.update({
        where: { id: fromTransaction.accountId },
        data: { balance: { decrement: transfer.amount } },
      });

      await tx.bankAccount.update({
        where: { id: toTransaction.accountId },
        data: { balance: { increment: transfer.amount } },
      });

      return transfer;
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to convert transactions to transfer:", error);
    return {
      success: false,
      error: "Failed to convert transactions to transfer",
    };
  }
}
