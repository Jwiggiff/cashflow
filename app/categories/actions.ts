"use server";

import { prisma } from "@/lib/prisma";

export async function createCategory(data: {
  name: string;
  icon?: string;
}) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        icon: data.icon,
      },
    });
    return { success: true, data: category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
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

export async function updateCategory(id: number, data: {
  name: string;
  icon?: string;
}) {
  try {
    const category = await prisma.category.update({
      where: { id },
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
  try {
    // Check if category is used in any transactions
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      return { 
        success: false, 
        error: `Cannot delete category. It is used in ${transactionCount} transaction(s).` 
      };
    }

    await prisma.category.delete({
      where: { id },
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
} 