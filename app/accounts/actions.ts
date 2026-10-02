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
    aliases?: string[];
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const account = await prisma.$transaction(async (tx) => {
      // Update the account
      const updatedAccount = await tx.bankAccount.update({
        where: { id, userId: session.user.id },
        data: {
          name: data.name,
          type: data.type,
          balance: data.balance,
        },
      });

      // Handle aliases if provided
      if (data.aliases !== undefined) {
        // Get current aliases
        const currentAliases = await tx.accountAlias.findMany({
          where: { accountId: id },
        });

        // Filter out empty aliases
        const newAliases = data.aliases.filter(alias => alias.trim() !== "");
        
        // Find aliases to add (new ones)
        const aliasesToAdd = newAliases.filter(newAlias => 
          !currentAliases.some(current => current.name === newAlias)
        );

        // Find aliases to remove (ones that no longer exist)
        const aliasesToRemove = currentAliases.filter(current => 
          !newAliases.includes(current.name)
        );

        // Remove aliases that no longer exist
        if (aliasesToRemove.length > 0) {
          await tx.accountAlias.deleteMany({
            where: { 
              id: { in: aliasesToRemove.map(a => a.id) }
            },
          });
        }

        // Add new aliases
        if (aliasesToAdd.length > 0) {
          await tx.accountAlias.createMany({
            data: aliasesToAdd.map(alias => ({
              name: alias,
              accountId: id,
            })),
          });
        }
      }

      return updatedAccount;
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
