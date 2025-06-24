import { CategoriesList } from "@/components/categories/categories-list";
import { Separator } from "@/components/ui/separator";
import prisma from "@/lib/prisma";

export default async function CategoriesPage() {
  // Get current month spending for each category
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get all categories with their spending data
  const categories = await prisma.category.findMany({
    include: {
      transactions: {
        where: {
          type: "EXPENSE",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const currentMonthData = (
    await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        type: "EXPENSE",
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: {
        _all: true,
      },
    })
  ).map(({ categoryId, _sum, _count }) => ({
    categoryId,
    amount: _sum.amount ?? 0,
    transactionCount: _count._all,
  }));

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-8">
        <h1 className="text-3xl font-bold">Categories</h1>
      </div>

      <Separator />

      <div className="flex-1 p-8">
        <CategoriesList
          categories={categories}
          currentMonthData={currentMonthData}
        />
      </div>
    </div>
  );
}
