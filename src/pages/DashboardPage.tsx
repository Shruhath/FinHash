import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  CalendarClock,
  ChartNoAxesCombined,
  HandCoins,
  PiggyBank,
  Receipt,
  Target,
  Wallet,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../../convex/_generated/api";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useCurrency } from "../hooks/useCurrency";
import { useShell } from "../components/layout/AppShell";
import SegmentedControl from "../components/ui/SegmentedControl";
import PeriodStepper from "../components/ui/PeriodStepper";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import ProgressBar from "../components/ui/ProgressBar";
import EmptyState from "../components/ui/EmptyState";
import CategoryIcon from "../components/ui/CategoryIcon";
import { SkeletonCard, SkeletonList } from "../components/ui/Skeleton";
import ChartTooltip from "../components/ui/ChartTooltip";
import {
  MONTH_NAMES,
  MONTH_SHORT,
  formatShortDate,
  monthKey,
} from "../lib/format";
import { listItemVariants, listVariants, riseVariants } from "../lib/motion";
import "./DashboardPage.css";

type ViewMode = "monthly" | "yearly" | "alltime";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const { format, compact } = useCurrency();
  const { openAdd } = useShell();

  const now = new Date();
  const [view, setView] = useState<ViewMode>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

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
    limit: 6,
  });
  const categories = useQuery(api.categories.getCategories) ?? [];
  const budgets =
    useQuery(api.budgets.getBudgetsWithSpending, {
      month: monthKey(selectedYear, selectedMonth),
    }) ?? [];
  const goals = useQuery(api.savings_goals.getGoalsWithProgress) ?? [];
  const debts = useQuery(api.debts.getDebts) ?? [];

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c._id as string, c])),
    [categories]
  );

  const summary =
    view === "monthly"
      ? monthlySummary
      : view === "yearly"
        ? yearlySummary
        : allTimeSummary;

  const loading = summary === undefined;

  const chartData = useMemo(() => {
    const spending = summary?.categorySpending ?? {};
    return Object.entries(spending)
      .map(([catId, amount]) => {
        const cat = categoryById.get(catId);
        return {
          name: cat?.name ?? "Uncategorised",
          icon: cat?.icon,
          value: amount as number,
          color: cat?.color ?? "#71717a",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [summary, categoryById]);

  const chartTotal = chartData.reduce((s, d) => s + d.value, 0);

  const topBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.percentage - a.percentage).slice(0, 3),
    [budgets]
  );

  const activeGoals = goals.filter((g) => !g.isCompleted);
  const openDebts = debts.filter((d) => !d.isCompleted);
  const netDebt = openDebts.reduce(
    (sum, d) => sum + (d.type === "lent" ? d.amount : -d.amount),
    0
  );

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const periodLabel =
    view === "monthly"
      ? `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      : view === "yearly"
        ? String(selectedYear)
        : "All time";

  const stepMonth = (delta: number) => {
    const next = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedMonth(next.getMonth());
    setSelectedYear(next.getFullYear());
  };

  const resetPeriod = () => {
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
  };

  const balance = summary?.balance ?? 0;
  const positive = balance >= 0;

  return (
    <div className="page dash">
      {/* ---------- Greeting ---------- */}
      <motion.header
        className="dash__greet"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <p className="dash__greet-label">{greeting()},</p>
          <h1 className="dash__greet-name">
            {user?.name?.split(" ")[0] ?? "there"}
          </h1>
        </div>
      </motion.header>

      {/* ---------- Period controls ---------- */}
      <div className="dash__controls">
        <SegmentedControl
          segments={[
            { value: "monthly", label: "Month" },
            { value: "yearly", label: "Year" },
            { value: "alltime", label: "All time" },
          ]}
          value={view}
          onChange={setView}
        />

        {view === "monthly" && (
          <PeriodStepper
            label={`${MONTH_SHORT[selectedMonth]} ${selectedYear}`}
            onPrev={() => stepMonth(-1)}
            onNext={() => stepMonth(1)}
            nextDisabled={isCurrentMonth}
            onReset={!isCurrentMonth ? resetPeriod : undefined}
          />
        )}

        {view === "yearly" && (
          <PeriodStepper
            label={String(selectedYear)}
            onPrev={() => setSelectedYear((y) => y - 1)}
            onNext={() => setSelectedYear((y) => y + 1)}
            nextDisabled={selectedYear >= now.getFullYear()}
            onReset={
              selectedYear !== now.getFullYear()
                ? () => setSelectedYear(now.getFullYear())
                : undefined
            }
          />
        )}
      </div>

      {/* ---------- Balance hero ---------- */}
      {loading ? (
        <SkeletonCard lines={3} height={220} />
      ) : (
        <motion.section
          className="balance-card"
          variants={riseVariants}
          initial="initial"
          animate="animate"
        >
          <div className="balance-card__glow" aria-hidden />

          <div className="balance-card__top">
            <span className="balance-card__label">
              Net balance · {periodLabel}
            </span>
            {view === "alltime" && allTimeSummary?.firstTransactionDate && (
              <span className="balance-card__since">
                since{" "}
                {new Date(
                  allTimeSummary.firstTransactionDate
                ).toLocaleDateString(undefined, {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <AnimatedNumber
            className={`balance-card__value money ${positive ? "" : "balance-card__value--negative"}`}
            value={balance}
            format={(v) => format(v)}
          />

          <div className="balance-card__split">
            <div className="balance-stat">
              <span className="balance-stat__head">
                <span className="balance-stat__icon balance-stat__icon--in">
                  <ArrowDownLeft size={13} />
                </span>
                Income
              </span>
              <AnimatedNumber
                className="balance-stat__value money"
                value={summary?.totalIncome ?? 0}
                format={(v) => format(v)}
              />
            </div>

            <div className="balance-stat">
              <span className="balance-stat__head">
                <span className="balance-stat__icon balance-stat__icon--out">
                  <ArrowUpRight size={13} />
                </span>
                Expenses
              </span>
              <AnimatedNumber
                className="balance-stat__value money"
                value={summary?.totalExpense ?? 0}
                format={(v) => format(v)}
              />
            </div>
          </div>

          {(summary?.totalIncome ?? 0) > 0 && (
            <div className="balance-card__meter">
              <div className="balance-card__meter-head">
                <span>Savings rate</span>
                <span className="money">
                  {(summary?.savingsRate ?? 0).toFixed(1)}%
                </span>
              </div>
              <ProgressBar
                value={Math.max(0, summary?.savingsRate ?? 0)}
                tone={
                  (summary?.savingsRate ?? 0) >= 20
                    ? "safe"
                    : (summary?.savingsRate ?? 0) >= 0
                      ? "warning"
                      : "danger"
                }
                height={6}
                delay={0.2}
              />
            </div>
          )}
        </motion.section>
      )}

      {/* ---------- Stat strip ---------- */}
      {!loading && summary && (
        <motion.div
          className="stat-strip"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          <StatTile
            icon={Receipt}
            label="Transactions"
            value={String(summary.transactionCount)}
          />
          {view === "monthly" && monthlySummary && (
            <StatTile
              icon={CalendarClock}
              label="Avg / day"
              value={compact(monthlySummary.avgDailySpend)}
            />
          )}
          <StatTile
            icon={PiggyBank}
            label="Saved"
            value={compact(Math.max(0, summary.balance))}
          />
          {activeGoals.length > 0 && (
            <StatTile
              icon={Target}
              label="Goals"
              value={`${activeGoals.length} active`}
            />
          )}
          {openDebts.length > 0 && (
            <StatTile
              icon={HandCoins}
              label={netDebt >= 0 ? "Owed to you" : "You owe"}
              value={compact(Math.abs(netDebt))}
            />
          )}
        </motion.div>
      )}

      {/* ---------- Grid ---------- */}
      <div className="dash__grid">
        {/* Spending breakdown */}
        <section className="card dash__spend">
          <div className="card__header">
            <h2 className="card__title">Where it went</h2>
            {chartData.length > 0 && (
              <Link to="/analytics" className="link-more">
                Analytics <ArrowRight size={14} />
              </Link>
            )}
          </div>

          {loading ? (
            <SkeletonList rows={4} />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="No spending yet"
              description="Add an expense and your category breakdown will appear here."
            />
          ) : (
            <div className="donut">
              <div className="donut__chart">
                <ResponsiveContainer width="100%" height={188}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={2.5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<ChartTooltip formatValue={format} />}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut__center">
                  <span className="donut__center-label">Total</span>
                  <span className="donut__center-value money">
                    {compact(chartTotal)}
                  </span>
                </div>
              </div>

              <motion.ul
                className="breakdown"
                variants={listVariants}
                initial="initial"
                animate="animate"
              >
                {chartData.map((entry) => (
                  <motion.li
                    className="breakdown__row"
                    key={entry.name}
                    variants={listItemVariants}
                  >
                    <CategoryIcon
                      name={entry.icon}
                      color={entry.color}
                      size={15}
                      tileSize={30}
                    />
                    <span className="breakdown__name truncate">
                      {entry.name}
                    </span>
                    <span className="breakdown__pct money">
                      {chartTotal > 0
                        ? ((entry.value / chartTotal) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                    <span className="breakdown__value money">
                      {format(entry.value)}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section className="card dash__recent">
          <div className="card__header">
            <h2 className="card__title">Recent activity</h2>
            <Link to="/transactions" className="link-more">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {recentTransactions === undefined ? (
            <SkeletonList rows={5} />
          ) : recentTransactions.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nothing here yet"
              description="Your latest income and expenses will show up here."
              action={
                <button className="btn btn--accent btn--sm" onClick={() => openAdd()}>
                  Add your first transaction
                </button>
              }
            />
          ) : (
            <motion.ul
              className="tx-mini"
              variants={listVariants}
              initial="initial"
              animate="animate"
            >
              {recentTransactions.map((tx) => {
                const cat = categoryById.get(tx.categoryId);
                return (
                  <motion.li
                    className="tx-mini__row"
                    key={tx._id}
                    variants={listItemVariants}
                  >
                    <CategoryIcon
                      name={cat?.icon}
                      color={cat?.color ?? "#71717a"}
                      size={16}
                      tileSize={34}
                    />
                    <div className="tx-mini__text">
                      <span className="tx-mini__title truncate">
                        {tx.description || cat?.name || "Transaction"}
                      </span>
                      <span className="tx-mini__meta truncate">
                        {formatShortDate(tx.date)} · {cat?.name ?? "Unknown"}
                      </span>
                    </div>
                    <span
                      className={`tx-mini__amount money ${tx.type === "income" ? "text-income" : ""}`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {format(tx.amount)}
                    </span>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </section>
      </div>

      {/* ---------- Budget snapshot ---------- */}
      {view === "monthly" && topBudgets.length > 0 && (
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Budget pulse</h2>
            <Link to="/budget" className="link-more">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          <motion.ul
            className="budget-pulse"
            variants={listVariants}
            initial="initial"
            animate="animate"
          >
            {topBudgets.map((b, i) => (
              <motion.li
                className="budget-pulse__row"
                key={b._id}
                variants={listItemVariants}
              >
                <div className="budget-pulse__head">
                  <span className="budget-pulse__name truncate">
                    <span
                      className="dot"
                      style={{ backgroundColor: b.categoryColor }}
                    />
                    {b.categoryName}
                  </span>
                  <span className="budget-pulse__figures money">
                    {format(b.spent)}{" "}
                    <span className="text-muted">/ {format(b.budgetAmount)}</span>
                  </span>
                </div>
                <ProgressBar
                  value={b.percentage}
                  tone={b.status as "safe" | "warning" | "danger" | "exceeded"}
                  height={6}
                  delay={0.1 + i * 0.05}
                />
              </motion.li>
            ))}
          </motion.ul>
        </section>
      )}

      {/* ---------- Yearly / all-time breakdown ---------- */}
      {view === "yearly" && yearlySummary && (
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Month by month</h2>
          </div>
          <div className="period-grid">
            {yearlySummary.months.map((m, i) => (
              <PeriodCell
                key={i}
                label={MONTH_SHORT[i] ?? ""}
                income={m.income}
                expense={m.expense}
                balance={m.balance}
                format={format}
                compact={compact}
              />
            ))}
          </div>
        </section>
      )}

      {view === "alltime" &&
        allTimeSummary?.yearlyData &&
        Object.keys(allTimeSummary.yearlyData).length > 0 && (
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Year by year</h2>
            </div>
            <div className="period-grid">
              {Object.entries(allTimeSummary.yearlyData)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, data]) => (
                  <PeriodCell
                    key={year}
                    label={year}
                    income={data.income}
                    expense={data.expense}
                    balance={data.balance}
                    format={format}
                    compact={compact}
                  />
                ))}
            </div>
          </section>
        )}

      {/* ---------- Quick links ---------- */}
      <div className="quick-links">
        <QuickLink
          to="/goals"
          icon={Target}
          title="Savings goals"
          hint={
            activeGoals.length
              ? `${activeGoals.length} in progress`
              : "Set your first goal"
          }
        />
        <QuickLink
          to="/debts"
          icon={HandCoins}
          title="Debts & loans"
          hint={
            openDebts.length ? `${openDebts.length} open` : "Nothing outstanding"
          }
        />
        <QuickLink
          to="/budget"
          icon={Wallet}
          title="Budgets"
          hint={budgets.length ? `${budgets.length} categories` : "Set limits"}
        />
        <QuickLink
          to="/analytics"
          icon={ChartNoAxesCombined}
          title="Analytics"
          hint="Trends & insights"
        />
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Receipt;
  label: string;
  value: string;
}) {
  return (
    <motion.div className="stat-tile" variants={listItemVariants}>
      <Icon size={15} className="stat-tile__icon" />
      <span className="stat-tile__value money">{value}</span>
      <span className="stat-tile__label">{label}</span>
    </motion.div>
  );
}

function PeriodCell({
  label,
  income,
  expense,
  balance,
  format,
  compact,
}: {
  label: string;
  income: number;
  expense: number;
  balance: number;
  format: (v: number) => string;
  compact: (v: number) => string;
}) {
  const empty = income === 0 && expense === 0;
  return (
    <div className={`period-cell ${empty ? "period-cell--empty" : ""}`}>
      <span className="period-cell__label">{label}</span>
      <span
        className={`period-cell__balance money ${balance >= 0 ? "text-income" : "text-expense"}`}
        title={format(balance)}
      >
        {compact(balance)}
      </span>
      <div className="period-cell__bars">
        <span
          className="period-cell__bar period-cell__bar--in"
          style={{
            width: `${income + expense > 0 ? (income / (income + expense)) * 100 : 0}%`,
          }}
        />
        <span
          className="period-cell__bar period-cell__bar--out"
          style={{
            width: `${income + expense > 0 ? (expense / (income + expense)) * 100 : 0}%`,
          }}
        />
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  hint,
}: {
  to: string;
  icon: typeof Target;
  title: string;
  hint: string;
}) {
  return (
    <Link to={to} className="quick-link">
      <span className="quick-link__icon">
        <Icon size={18} />
      </span>
      <span className="quick-link__text">
        <span className="quick-link__title">{title}</span>
        <span className="quick-link__hint">{hint}</span>
      </span>
      <ArrowRight size={16} className="quick-link__arrow" />
    </Link>
  );
}
