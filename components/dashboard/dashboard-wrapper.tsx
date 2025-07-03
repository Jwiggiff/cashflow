import {
  getDashboardStats,
  getExpenseBreakdown,
  getMonthlyData,
} from "@/app/dashboard/actions";
import Dashboard from "./dashboard";

export default async function DashboardWrapper() {
  const [stats, monthlyData, expenseData] = await Promise.all([
    getDashboardStats(),
    getMonthlyData(),
    getExpenseBreakdown(),
  ]);

  return (
    <Dashboard
      stats={stats}
      monthlyData={monthlyData}
      expenseData={expenseData}
    />
  );
}
