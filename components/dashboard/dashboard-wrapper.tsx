import {
  getAccountsAndCategoriesForRecurringDialogs,
  getDashboardRecommendations,
  getDashboardStats,
  getExpenseBreakdown,
  getMonthlyData,
} from "@/app/dashboard/actions";
import Dashboard from "./dashboard";

export default async function DashboardWrapper() {
  const [stats, monthlyData, expenseData, recommendations] = await Promise.all([
    getDashboardStats(),
    getMonthlyData(),
    getExpenseBreakdown(),
    getDashboardRecommendations(),
  ]);

  const dialogData =
    recommendations.length > 0
      ? await getAccountsAndCategoriesForRecurringDialogs()
      : { accounts: [], categories: [] };

  return (
    <Dashboard
      stats={stats}
      monthlyData={monthlyData}
      expenseData={expenseData}
      recommendations={recommendations}
      accounts={dialogData.accounts}
      categories={dialogData.categories}
    />
  );
}
