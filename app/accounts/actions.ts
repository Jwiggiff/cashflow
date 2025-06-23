"use server";

import prisma from "@/lib/prisma";
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