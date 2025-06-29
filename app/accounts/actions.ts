"use server";

import { prisma } from "@/lib/prisma";
import { AccountType } from "@prisma/client";

export async function createAccount(data: {
  name: string;
  type: AccountType;
  balance: number;
}) {
  try {
    const account = await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
      },
    });
    return { success: true, data: account };
  } catch (error) {
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateAccount(id: number, data: {
  name: string;
  type: AccountType;
  balance: number;
}) {
  try {
    const account = await prisma.account.update({
      where: { id },
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
  try {
    await prisma.account.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
} 