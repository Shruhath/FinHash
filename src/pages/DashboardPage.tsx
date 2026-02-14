import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getCurrencyByCountry } from "../lib/countries";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  CalendarClock,
  PiggyBank,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import "./DashboardPage.css";

type ViewMode = "monthly" | "yearly" | "alltime";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardPage() {
  const user = useCurrentUser();
  const [view, setView] = useState<ViewMode>("monthly");
  const [showAddModal, setShowAddModal] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const currencySymbol = user
    ? getCurrencyByCountry(user.country).symbol
    : "$";

  const monthlySummary = useQuery(
    api.transactions.getMonthlySummary,
    view === "monthly" ? { month: selectedMonth, year: selectedYear } : "skip"
  );

  const yearlySummary = useQuery(
    api.transactions.getYearlySummary,
    view === "yearly" ? { year: selectedYear } : "skip"
  );

  const allTimeSummary = useQuery(
    api.transactions.getAllTimeSummary,
    view === "alltime" ? {} : "skip"
  );

  const recentTransactions = useQuery(api.transactions.getRecentTransactions, {
    limit: 8,
  });

  const categories = useQuery(api.categories.getCategories) ?? [];

  const getCategoryName = (catId: string) =>
    categories.find((c) => c._id === catId)?.name ?? "Unknown";

  const getCategoryColor = (catId: string) =>
    categories.find((c) => c._id === catId)?.color ?? "#71717a";

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Get the active summary based on view
  const activeSummary =
    view === "monthly"
      ? monthlySummary
      : view === "yearly"
        ? yearlySummary
        : allTimeSummary;

  // Prepare category chart data
  const categorySpending = activeSummary?.categorySpending ?? {};
  const chartData = Object.entries(categorySpending)
    .map(([catId, amount]) => ({
      name: getCategoryName(catId),
      value: amount,
      color: getCategoryColor(catId),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Navigation helpers
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Yearly grid for yearly view
  const yearlyMonths = view === "yearly" ? (yearlySummary?.months ?? []) : [];

  return (
    <DashboardLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard__header">
          <div>
            <h1 className="dashboard__greeting">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
            <p className="dashboard__subtitle">
              Here's your financial overview
            </p>
          </div>
          <button
            className="dashboard__add-btn"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            <span>Add Transaction</span>
          </button>
        </div>

        {/* View Toggle */}
        <div className="view-tabs">
          <button
            className={`view-tabs__btn ${view === "monthly" ? "view-tabs__btn--active" : ""}`}
            onClick={() => setView("monthly")}
          >
            Monthly
          </button>
          <button
            className={`view-tabs__btn ${view === "yearly" ? "view-tabs__btn--active" : ""}`}
            onClick={() => setView("yearly")}
          >
            Yearly
          </button>
          <button
            className={`view-tabs__btn ${view === "alltime" ? "view-tabs__btn--active" : ""}`}
            onClick={() => setView("alltime")}
          >
            All Time
          </button>
        </div>

        {/* Period Selector */}
        {view === "monthly" && (
          <div className="period-selector">
            <button className="period-selector__btn" onClick={goToPrevMonth}>
              <ChevronLeft size={18} />
            </button>
            <span className="period-selector__label">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </span>
            <button className="period-selector__btn" onClick={goToNextMonth}>
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {view === "yearly" && (
          <div className="period-selector">
            <button
              className="period-selector__btn"
              onClick={() => setSelectedYear(selectedYear - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="period-selector__label">{selectedYear}</span>
            <button
              className="period-selector__btn"
              onClick={() => setSelectedYear(selectedYear + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {view === "alltime" && allTimeSummary?.firstTransactionDate && (
          <p className="alltime-since">
            Since{" "}
            {new Date(allTimeSummary.firstTransactionDate).toLocaleDateString(
              undefined,
              { month: "long", year: "numeric" }
            )}
          </p>
        )}

        {/* Top Metric Cards */}
        {activeSummary && (
          <>
            <div className="metric-cards">
              <div className="metric-card metric-card--income">
                <div className="metric-card__icon">
                  <TrendingUp size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__label">Income</span>
                  <span className="metric-card__value">
                    {formatCurrency(activeSummary.totalIncome)}
                  </span>
                </div>
              </div>

              <div className="metric-card metric-card--expense">
                <div className="metric-card__icon">
                  <TrendingDown size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__label">Expenses</span>
                  <span className="metric-card__value">
                    {formatCurrency(activeSummary.totalExpense)}
                  </span>
                </div>
              </div>

              <div className="metric-card metric-card--balance">
                <div className="metric-card__icon">
                  <Scale size={20} />
                </div>
                <div className="metric-card__content">
                  <span className="metric-card__label">Balance</span>
                  <span className="metric-card__value">
                    {formatCurrency(activeSummary.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <Receipt size={18} className="summary-card__icon" />
                <span className="summary-card__value">
                  {activeSummary.transactionCount}
                </span>
                <span className="summary-card__label">Transactions</span>
              </div>

              {view === "monthly" && monthlySummary && (
                <div className="summary-card">
                  <CalendarClock size={18} className="summary-card__icon" />
                  <span className="summary-card__value">
                    {formatCurrency(monthlySummary.avgDailySpend)}
                  </span>
                  <span className="summary-card__label">Avg Daily Spend</span>
                </div>
              )}

              <div className="summary-card">
                <PiggyBank size={18} className="summary-card__icon" />
                <span className="summary-card__value">
                  {activeSummary.savingsRate.toFixed(1)}%
                </span>
                <span className="summary-card__label">Savings Rate</span>
              </div>
            </div>
          </>
        )}

        {/* Content Grid: Chart + Recent Transactions */}
        <div className="dashboard__grid">
          {/* Category Chart */}
          {chartData.length > 0 && (
            <div className="dashboard__card">
              <h3 className="dashboard__card-title">
                Top Spending Categories
              </h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-bg-elevated)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--color-text-primary)",
                        fontSize: "0.85rem",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                  {chartData.map((entry, index) => (
                    <div className="chart-legend__item" key={index}>
                      <span
                        className="chart-legend__dot"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="chart-legend__name">{entry.name}</span>
                      <span className="chart-legend__value">
                        {formatCurrency(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="dashboard__card">
            <h3 className="dashboard__card-title">Recent Activity</h3>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="recent-list">
                {recentTransactions.map((tx) => (
                  <div className="recent-item" key={tx._id}>
                    <div
                      className="recent-item__dot"
                      style={{
                        backgroundColor: getCategoryColor(tx.categoryId),
                      }}
                    />
                    <div className="recent-item__info">
                      <span className="recent-item__category">
                        {getCategoryName(tx.categoryId)}
                      </span>
                      <span className="recent-item__date">
                        {formatDate(tx.date)}
                        {tx.description && ` · ${tx.description}`}
                      </span>
                    </div>
                    <span
                      className={`recent-item__amount ${
                        tx.type === "income"
                          ? "text-income"
                          : "text-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="recent-empty">
                No transactions yet. Add your first one!
              </p>
            )}
          </div>
        </div>

        {/* Yearly Grid */}
        {view === "yearly" && yearlyMonths.length > 0 && (
          <div className="dashboard__card">
            <h3 className="dashboard__card-title">Monthly Breakdown</h3>
            <div className="yearly-grid">
              {yearlyMonths.map((m, i) => (
                <div className="yearly-grid__cell" key={i}>
                  <span className="yearly-grid__month">
                    {MONTH_NAMES[i]?.slice(0, 3)}
                  </span>
                  <span className="yearly-grid__income text-income">
                    +{formatCurrency(m.income)}
                  </span>
                  <span className="yearly-grid__expense text-expense">
                    -{formatCurrency(m.expense)}
                  </span>
                  <span
                    className={`yearly-grid__balance ${
                      m.balance >= 0 ? "text-income" : "text-expense"
                    }`}
                  >
                    {formatCurrency(m.balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All-Time Yearly History */}
        {view === "alltime" &&
          allTimeSummary?.yearlyData &&
          Object.keys(allTimeSummary.yearlyData).length > 0 && (
            <div className="dashboard__card">
              <h3 className="dashboard__card-title">Yearly History</h3>
              <div className="yearly-grid">
                {Object.entries(allTimeSummary.yearlyData)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([year, data]) => (
                    <div className="yearly-grid__cell" key={year}>
                      <span className="yearly-grid__month">{year}</span>
                      <span className="yearly-grid__income text-income">
                        +{formatCurrency(data.income)}
                      </span>
                      <span className="yearly-grid__expense text-expense">
                        -{formatCurrency(data.expense)}
                      </span>
                      <span
                        className={`yearly-grid__balance ${
                          data.balance >= 0 ? "text-income" : "text-expense"
                        }`}
                      >
                        {formatCurrency(data.balance)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
      </div>

      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </DashboardLayout>
  );
}
