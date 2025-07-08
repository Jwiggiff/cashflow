"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createCategory(data: { name: string; icon?: string }) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon,
        userId: session.user.id,
      },
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function getCategories() {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const categories = await prisma.category.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        name: "asc",
      },
    });
    return { success: true, data: categories };
  } catch (error) {
    console.error("Failed to get categories:", error);
    return { success: false, error: "Failed to get categories" };
  }
}

export async function updateCategory(
  id: number,
  data: {
    name: string;
    icon?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const category = await prisma.category.update({
      where: { id, userId: session.user.id },
      data: {
        name: data.name,
        icon: data.icon,
      },
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: number) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Check if category is used in any transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id, account: { userId: session.user.id } },
    });

    if (transactionCount > 0) {
      return {
        success: false,
        error: `Cannot delete category. It is used in ${transactionCount} transaction(s).`,
      };
    }

    await prisma.category.delete({
      where: { id, userId: session.user.id },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
