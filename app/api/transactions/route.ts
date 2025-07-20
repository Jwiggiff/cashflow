import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";
import { createTransactionSchema } from "@/lib/zod";
import bcrypt from "bcryptjs";
import { autoCategorize as autoCategorizeTransaction } from "@/lib/auto-categorizer";
import { sendNotificationToUser } from "@/lib/notifications";
import { formatCurrency } from "@/lib/formatter";

export async function POST(request: NextRequest) {
  try {
    // Check authentication via Basic Auth
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Basic ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const credentials = Buffer.from(authHeader.slice(6), "base64").toString();
    const [username, password] = credentials.split(":");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Invalid credentials format" },
        { status: 401 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createTransactionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          errorDetails: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const {
      description,
      type,
      category,
      amount,
      account: accountName,
      date,
      autoCategorize,
      source,
    } = validationResult.data;

    // Verify the account belongs to the user (check both name and aliases)
    const account = await prisma.bankAccount.findFirst({
      where: {
        OR: [
          { name: accountName },
          { aliases: { some: { name: accountName } } },
        ],
        userId: user.id,
      },
      include: {
        aliases: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: "Account not found or access denied" },
        { status: 404 }
      );
    }

    // Auto-categorize if enabled and no category provided
    let finalCategoryId = null;
    if (autoCategorize && !category && type === "EXPENSE") {
      // Get user's categories for auto-categorization
      const categories = await prisma.category.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      });
      const categorization = await autoCategorizeTransaction(
        description,
        categories
      );
      if (categorization.categoryId) {
        finalCategoryId = categorization.categoryId;
      }
    }

    // Verify category exists and belongs to user (if provided)
    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: {
          name: category,
          userId: user.id,
        },
      });

      if (!categoryRecord) {
        return NextResponse.json(
          { error: "Category not found or access denied" },
          { status: 404 }
        );
      }
      finalCategoryId = categoryRecord.id;
    }

    // Calculate final amount (negative for expenses)
    const finalAmount =
      type === TransactionType.EXPENSE
        ? Math.abs(amount) * -1
        : Math.abs(amount);

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        description,
        type: type as TransactionType,
        categoryId: finalCategoryId,
        amount: finalAmount,
        accountId: account.id,
        date: date ? new Date(date) : new Date(),
        source: source || null,
      },
      include: {
        account: true,
        category: true,
      },
    });

    // Update account balance
    await prisma.bankAccount.update({
      where: { id: account.id },
      data: { balance: { increment: finalAmount } },
    });

    // Send push notification
    await sendNotificationToUser(
      type === TransactionType.EXPENSE ? "New Expense" : "New Income",
      `${description} - ${formatCurrency(Math.abs(finalAmount))}`,
      "/transactions",
      user.id
    );

    return NextResponse.json(
      {
        success: true,
        data: transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
