import { RRule } from "rrule";
import { prisma } from "@/lib/prisma";
import { sendNotificationToUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/formatter";
import { TransactionType } from "@prisma/client";

/**
 * Process all due recurring transactions and transfers
 */
export async function processRecurringItems() {
  const now = new Date();

  console.log("[Recurring] Processing recurring items");

  // Process transactions and transfers in parallel
  await Promise.all([
    processRecurringTransactions(now),
    processRecurringTransfers(now),
  ]);
}

/**
 * Process all due recurring transactions
 */
async function processRecurringTransactions(now: Date) {
  const dueTransactions = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextDueDate: {
        lte: now,
      },
    },
    include: {
      account: {
        select: {
          userId: true,
        },
      },
      category: true,
    },
  });

  for (const recurring of dueTransactions) {
    try {
      // Calculate the next occurrence
      const rrule = RRule.fromString(recurring.rrule);
      const nextDate = rrule.after(now, true);

      if (!nextDate) {
        // No more occurrences, deactivate the recurring transaction
        await prisma.recurringTransaction.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
        continue;
      }

      // Create the actual transaction
      await prisma.$transaction(async (tx) => {
        // Create transaction
        await tx.transaction.create({
          data: {
            description: recurring.description,
            amount: recurring.amount,
            type: recurring.type,
            categoryId: recurring.categoryId,
            accountId: recurring.accountId,
            date: recurring.nextDueDate, // Use the scheduled date, not now
          },
        });

        // Update account balance
        await tx.bankAccount.update({
          where: { id: recurring.accountId },
          data: { balance: { increment: recurring.amount } },
        });

        // Update recurring transaction
        await tx.recurringTransaction.update({
          where: { id: recurring.id },
          data: {
            lastProcessedDate: recurring.nextDueDate,
            nextDueDate: nextDate,
          },
        });

        // Send notification
        await sendNotificationToUser(
          recurring.type === TransactionType.EXPENSE
            ? "Recurring Expense"
            : "Recurring Income",
          `${recurring.description} - ${formatCurrency(
            Math.abs(recurring.amount)
          )}`,
          "/transactions",
          recurring.account.userId
        );
      });
    } catch (error) {
      console.error(
        `Failed to process recurring transaction ${recurring.id}:`,
        error
      );
      // Send error notification
      try {
        await sendNotificationToUser(
          "Failed Recurring Transaction",
          `Failed to process recurring transaction: ${recurring.description}`,
          "/recurring",
          recurring.account.userId
        );
      } catch (notifError) {
        console.error("Failed to send error notification:", notifError);
      }
    }
  }
}

/**
 * Process all due recurring transfers
 */
async function processRecurringTransfers(now: Date) {
  const dueTransfers = await prisma.recurringTransfer.findMany({
    where: {
      isActive: true,
      nextDueDate: {
        lte: now,
      },
    },
    include: {
      fromAccount: {
        select: {
          userId: true,
        },
      },
    },
  });

  for (const recurring of dueTransfers) {
    try {
      // Calculate the next occurrence
      const rrule = RRule.fromString(recurring.rrule);
      const nextDate = rrule.after(now, true);

      if (!nextDate) {
        // No more occurrences, deactivate the recurring transfer
        await prisma.recurringTransfer.update({
          where: { id: recurring.id },
          data: { isActive: false },
        });
        continue;
      }

      // Create the actual transfer
      await prisma.$transaction(async (tx) => {
        // Create transfer
        await tx.transfer.create({
          data: {
            description: recurring.description || "Recurring Transfer",
            amount: recurring.amount,
            fromAccountId: recurring.fromAccountId,
            toAccountId: recurring.toAccountId,
            date: recurring.nextDueDate, // Use the scheduled date, not now
          },
        });

        // Update account balances
        await tx.bankAccount.update({
          where: { id: recurring.fromAccountId },
          data: { balance: { decrement: recurring.amount } },
        });
        await tx.bankAccount.update({
          where: { id: recurring.toAccountId },
          data: { balance: { increment: recurring.amount } },
        });

        // Update recurring transfer
        await tx.recurringTransfer.update({
          where: { id: recurring.id },
          data: {
            lastProcessedDate: recurring.nextDueDate,
            nextDueDate: nextDate,
          },
        });

        // Send notification
        await sendNotificationToUser(
          "Recurring Transfer",
          `${recurring.description || "Transfer"} - ${formatCurrency(
            recurring.amount
          )}`,
          "/transfers",
          recurring.fromAccount.userId
        );
      });
    } catch (error) {
      console.error(
        `Failed to process recurring transfer ${recurring.id}:`,
        error
      );
      // Send error notification
      try {
        await sendNotificationToUser(
          "Failed Recurring Transfer",
          `Failed to process recurring transfer${
            recurring.description ? `: ${recurring.description}` : ""
          }`,
          "/recurring",
          recurring.fromAccount.userId
        );
      } catch (notifError) {
        console.error("Failed to send error notification:", notifError);
      }
    }
  }
}
