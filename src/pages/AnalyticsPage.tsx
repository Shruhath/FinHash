import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getCurrencyByCountry } from "../lib/countries";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import "./AnalyticsPage.css";

type RangeOption = 6 | 12;

export default function AnalyticsPage() {
  const user = useCurrentUser();
  const [range, setRange] = useState<RangeOption>(6);

  const analytics = useQuery(api.analytics.getAnalyticsData, {
    months: range,
  });

  const currencySymbol = user
    ? getCurrencyByCountry(user.country).symbol
    : "$";

  const formatCurrency = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const formatCurrencyFull = (amount: number) =>
    `${currencySymbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const tooltipStyle = {
    backgroundColor: "var(--color-bg-elevated)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-sm)",
    color: "var(--color-text-primary)",
    fontSize: "0.82rem",
  };

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="analytics-page">
          <h1 className="analytics-page__title">Analytics</h1>
          <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const {
    monthlyTrend,
    expenseByCategory,
    incomeByCategory,
    totalIncome,
    totalExpense,
  } = analytics;

  // Pie chart data — top 8 + "Other"
  const pieData = (() => {
    const top = expenseByCategory.slice(0, 7);
    const rest = expenseByCategory.slice(7);
    const otherSum = rest.reduce((s, c) => s + c.amount, 0);
    const data = top.map((c) => ({
      name: c.name,
      value: c.amount,
      color: c.color,
    }));
    if (otherSum > 0) {
      data.push({ name: "Other", value: otherSum, color: "#71717a" });
    }
    return data;
  })();

  const totalPie = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <DashboardLayout>
      <div className="analytics-page">
        <div className="analytics-page__header">
          <div>
            <h1 className="analytics-page__title">Analytics</h1>
            <p className="analytics-page__subtitle">
              {formatCurrencyFull(totalExpense)} spent ·{" "}
              {formatCurrencyFull(totalIncome)} earned
            </p>
          </div>

          <div className="view-tabs">
            <button
              className={`view-tabs__btn ${range === 6 ? "view-tabs__btn--active" : ""}`}
              onClick={() => setRange(6)}
            >
              6 Months
            </button>
            <button
              className={`view-tabs__btn ${range === 12 ? "view-tabs__btn--active" : ""}`}
              onClick={() => setRange(12)}
            >
              12 Months
            </button>
          </div>
        </div>

        <div className="analytics-grid">
          {/* Spending Trend - Area Chart */}
          <div className="analytics-card analytics-card--wide">
            <h3 className="analytics-card__title">Spending Trend</h3>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [
                      formatCurrencyFull(value),
                      "Expenses",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#expenseGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="analytics-card__empty">No data for this period</p>
            )}
          </div>

          {/* Category Breakdown - Pie Chart */}
          <div className="analytics-card">
            <h3 className="analytics-card__title">Expenses by Category</h3>
            {pieData.length > 0 ? (
              <div className="pie-section">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => formatCurrencyFull(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {pieData.map((entry, index) => (
                    <div className="pie-legend__item" key={index}>
                      <span
                        className="pie-legend__dot"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="pie-legend__name">{entry.name}</span>
                      <span className="pie-legend__pct">
                        {totalPie > 0
                          ? ((entry.value / totalPie) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                      <span className="pie-legend__value">
                        {formatCurrencyFull(entry.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="analytics-card__empty">No expense data</p>
            )}
          </div>

          {/* Income vs Expense - Bar Chart */}
          <div className="analytics-card analytics-card--wide">
            <h3 className="analytics-card__title">Income vs Expense</h3>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(v)}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number, name: string) => [
                      formatCurrencyFull(value),
                      name === "income" ? "Income" : "Expense",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{
                      fontSize: "0.82rem",
                      color: "var(--color-text-secondary)",
                    }}
                    formatter={(value) =>
                      value === "income" ? "Income" : "Expense"
                    }
                  />
                  <Bar
                    dataKey="income"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="analytics-card__empty">No data for this period</p>
            )}
          </div>

          {/* Top Income Sources */}
          {incomeByCategory.length > 0 && (
            <div className="analytics-card">
              <h3 className="analytics-card__title">Income Sources</h3>
              <div className="category-list">
                {incomeByCategory.slice(0, 8).map((c, i) => (
                  <div className="category-list__item" key={i}>
                    <span
                      className="category-list__dot"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="category-list__name">{c.name}</span>
                    <span className="category-list__count">
                      {c.count} txn{c.count !== 1 ? "s" : ""}
                    </span>
                    <span className="category-list__value text-income">
                      {formatCurrencyFull(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
