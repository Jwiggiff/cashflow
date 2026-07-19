import {
  getAccountsAndCategoriesForRecurringDialogs,
  getDashboardRecommendations,
  getDashboardStats,
  getExpenseBreakdown,
  getMonthlyData,
  getNetWorthHistory,
} from "@/app/dashboard/actions";
import Dashboard from "./dashboard";

export default async function DashboardWrapper() {
  const [
    stats,
    monthlyData,
    expenseData,
    netWorthHistory,
    recommendations,
  ] = await Promise.all([
    getDashboardStats(),
    getMonthlyData(),
    getExpenseBreakdown(),
    getNetWorthHistory(),
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
      netWorthHistory={netWorthHistory}
      recommendations={recommendations}
      accounts={dialogData.accounts}
      categories={dialogData.categories}
    />
  );
}
