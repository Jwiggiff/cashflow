import { AppPageHeader } from "@/components/app-page-header";
import { CategoriesList } from "@/components/categories/categories-list";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-auth";

export default async function CategoriesPage() {
  const user = await requireUser();

  // Get current month spending for each category
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get all categories with their spending data
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    include: {
      transactions: {
        where: {
          type: "EXPENSE",
          account: { userId: user.id },
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
        account: { userId: user.id },
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
    <div className="flex min-h-screen w-full flex-col">
      <AppPageHeader title="Categories" />

      <div className="flex-1 py-2 @3xl:p-8">
        <CategoriesList
          categories={categories}
          currentMonthData={currentMonthData}
        />
      </div>
    </div>
  );
}
