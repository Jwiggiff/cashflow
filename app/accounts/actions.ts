"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountType } from "@prisma/client";

export async function createAccount(data: {
  name: string;
  type: AccountType;
  balance: number;
}) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const account = await prisma.bankAccount.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
        userId: session.user.id,
      },
    });
    return { success: true, data: account };
  } catch (error) {
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateAccount(
  id: number,
  data: {
    name: string;
    type: AccountType;
    balance: number;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const account = await prisma.bankAccount.update({
      where: { id, userId: session.user.id },
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
      },
    });
    return { success: true, data: account };
  } catch (error) {
    console.error("Failed to update account:", error);
    return { success: false, error: "Failed to update account" };
  }
}

export async function deleteAccount(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.bankAccount.delete({ where: { id, userId: session.user.id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}
