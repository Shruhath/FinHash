import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  ComposedChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartNoAxesCombined, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { useCurrency } from "../hooks/useCurrency";
import { useIsMobile } from "../hooks/useMediaQuery";
import PageHeader from "../components/ui/PageHeader";
import SegmentedControl from "../components/ui/SegmentedControl";
import EmptyState from "../components/ui/EmptyState";
import CategoryIcon from "../components/ui/CategoryIcon";
import ChartTooltip from "../components/ui/ChartTooltip";
import AnimatedNumber from "../components/ui/AnimatedNumber";
import { SkeletonCard } from "../components/ui/Skeleton";
import { listItemVariants, listVariants, riseVariants } from "../lib/motion";
import "./AnalyticsPage.css";

type Range = "3" | "6" | "12";

const SERIES_LABELS = { income: "Income", expense: "Expenses", balance: "Net" };

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("6");
  const { format, compact } = useCurrency();
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  /** Recharts defaults to a 1.5s reveal, which feels sluggish here. */
  const anim = {
    isAnimationActive: !reduceMotion,
    animationDuration: 650,
    animationEasing: "ease-out" as const,
  };

  const analytics = useQuery(api.analytics.getAnalyticsData, {
    months: Number(range),
  });

  const pieData = useMemo(() => {
    if (!analytics) return [];
    const top = analytics.expenseByCategory.slice(0, 7);
    const rest = analytics.expenseByCategory.slice(7);
    const otherSum = rest.reduce((s, c) => s + c.amount, 0);
    const data = top.map((c) => ({
      name: c.name,
      icon: c.icon,
      value: c.amount,
      color: c.color,
      count: c.count,
    }));
    if (otherSum > 0) {
      data.push({
        name: "Other",
        icon: "MoreHorizontal",
        value: otherSum,
        color: "#71717a",
        count: rest.reduce((s, c) => s + c.count, 0),
      });
    }
    return data;
  }, [analytics]);

  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const insights = useMemo(() => {
    if (!analytics || analytics.monthlyTrend.length < 2) return null;
    const trend = analytics.monthlyTrend;
    const current = trend[trend.length - 1]!;
    const previous = trend[trend.length - 2]!;
    const delta =
      previous.expense > 0
        ? ((current.expense - previous.expense) / previous.expense) * 100
        : 0;
    const months = trend.filter((m) => m.expense > 0);
    const avg =
      months.length > 0
        ? months.reduce((s, m) => s + m.expense, 0) / months.length
        : 0;
    const best = [...trend].sort((a, b) => b.balance - a.balance)[0];
    return { delta, avg, best, current };
  }, [analytics]);

  const axisProps = {
    tick: { fill: "var(--color-text-muted)", fontSize: 11 },
    tickLine: false,
  };

  if (analytics === undefined) {
    return (
      <div className="page analytics-page">
        <PageHeader title="Analytics" subtitle="Loading…" />
        <SkeletonCard lines={6} height={320} />
        <div className="grid-2">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
      </div>
    );
  }

  if (analytics === null || analytics.totalTransactions === 0) {
    return (
      <div className="page analytics-page">
        <PageHeader title="Analytics" />
        <div className="card">
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Not enough data yet"
            description="Add a few transactions and your trends, category splits and month-over-month comparisons will appear here."
          />
        </div>
      </div>
    );
  }

  const { monthlyTrend, incomeByCategory, totalIncome, totalExpense } = analytics;

  return (
    <div className="page analytics-page">
      <PageHeader
        title="Analytics"
        subtitle={`${format(totalExpense)} spent · ${format(totalIncome)} earned`}
        actions={
          <SegmentedControl
            size="sm"
            segments={[
              { value: "3", label: "3M" },
              { value: "6", label: "6M" },
              { value: "12", label: "12M" },
            ]}
            value={range}
            onChange={setRange}
          />
        }
      />

      {/* ---------- Insight tiles ---------- */}
      {insights && (
        <motion.div
          className="insight-row"
          variants={listVariants}
          initial="initial"
          animate="animate"
        >
          <motion.div className="insight" variants={listItemVariants}>
            <span className="insight__label">This month vs last</span>
            <span
              className={`insight__value money ${insights.delta > 0 ? "text-expense" : "text-income"}`}
            >
              {insights.delta > 0 ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(insights.delta).toFixed(0)}%
            </span>
            <span className="insight__hint">
              {insights.delta > 0 ? "more spending" : "less spending"}
            </span>
          </motion.div>

          <motion.div className="insight" variants={listItemVariants}>
            <span className="insight__label">Average month</span>
            <AnimatedNumber
              className="insight__value money"
              value={insights.avg}
              format={compact}
            />
            <span className="insight__hint">across the period</span>
          </motion.div>

          <motion.div className="insight" variants={listItemVariants}>
            <span className="insight__label">Best month</span>
            <span className="insight__value money">
              {insights.best?.monthLabel ?? "—"}
            </span>
            <span className="insight__hint">
              {insights.best ? `${compact(insights.best.balance)} saved` : ""}
            </span>
          </motion.div>

          <motion.div className="insight" variants={listItemVariants}>
            <span className="insight__label">Net across period</span>
            <AnimatedNumber
              className={`insight__value money ${totalIncome - totalExpense >= 0 ? "text-income" : "text-expense"}`}
              value={totalIncome - totalExpense}
              format={compact}
            />
            <span className="insight__hint">income minus expenses</span>
          </motion.div>
        </motion.div>
      )}

      {/* ---------- Cash flow ---------- */}
      <motion.section
        className="card"
        variants={riseVariants}
        initial="initial"
        animate="animate"
      >
        <div className="card__header">
          <h2 className="card__title">Cash flow</h2>
          <div className="legend">
            <span className="legend__item">
              <span className="dot" style={{ backgroundColor: "var(--color-income)" }} />
              Income
            </span>
            <span className="legend__item">
              <span className="dot" style={{ backgroundColor: "var(--color-expense)" }} />
              Expenses
            </span>
            <span className="legend__item">
              <span className="dot" style={{ backgroundColor: "var(--color-accent)" }} />
              Net
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={isMobile ? 240 : 300}>
          <ComposedChart
            data={monthlyTrend}
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid
              strokeDasharray="2 6"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis dataKey="monthLabel" {...axisProps} axisLine={false} />
            <YAxis
              {...axisProps}
              axisLine={false}
              tickFormatter={(v: number) => compact(v)}
              width={62}
            />
            <Tooltip
              content={
                <ChartTooltip formatValue={format} labelFor={SERIES_LABELS} />
              }
              cursor={{ fill: "var(--color-bg-hover)", opacity: 0.4 }}
            />
            <Bar
              dataKey="income"
              fill="var(--color-income)"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
              {...anim}
            />
            <Bar
              dataKey="expense"
              fill="var(--color-expense)"
              radius={[5, 5, 0, 0]}
              maxBarSize={22}
              {...anim}
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              dot={false}
              {...anim}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.section>

      <div className="grid-2">
        {/* ---------- Spending trend ---------- */}
        <motion.section
          className="card"
          variants={riseVariants}
          initial="initial"
          animate="animate"
        >
          <div className="card__header">
            <h2 className="card__title">Spending trend</h2>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart
              data={monthlyTrend}
              margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
            >
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5782a" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#cc5500" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 6"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis dataKey="monthLabel" {...axisProps} axisLine={false} />
              <YAxis
                {...axisProps}
                axisLine={false}
                tickFormatter={(v: number) => compact(v)}
                width={62}
              />
              <Tooltip
                content={
                  <ChartTooltip formatValue={format} labelFor={SERIES_LABELS} />
                }
                cursor={{ stroke: "var(--color-border-strong)" }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                fill="url(#spendGrad)"
                activeDot={{ r: 4, strokeWidth: 0 }}
                {...anim}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.section>

        {/* ---------- Category split ---------- */}
        <motion.section
          className="card"
          variants={riseVariants}
          initial="initial"
          animate="animate"
        >
          <div className="card__header">
            <h2 className="card__title">Where money goes</h2>
          </div>

          {pieData.length === 0 ? (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="No expenses in this period"
            />
          ) : (
            <>
              <div className="donut__chart">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={92}
                      paddingAngle={2.5}
                      dataKey="value"
                      stroke="none"
                      {...anim}
                    >
                      {pieData.map((entry, index) => (
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
                    {compact(pieTotal)}
                  </span>
                </div>
              </div>

              <ul className="rank-list">
                {pieData.map((entry) => (
                  <li className="rank-row" key={entry.name}>
                    <CategoryIcon
                      name={entry.icon}
                      color={entry.color}
                      size={15}
                      tileSize={30}
                    />
                    <div className="rank-row__text">
                      <span className="rank-row__name truncate">
                        {entry.name}
                      </span>
                      <span className="rank-row__meta">
                        {entry.count} transaction{entry.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="rank-row__figures">
                      <span className="rank-row__value money">
                        {format(entry.value)}
                      </span>
                      <span className="rank-row__pct money">
                        {pieTotal > 0
                          ? ((entry.value / pieTotal) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                    <div
                      className="rank-row__bar"
                      style={{
                        width: `${pieTotal > 0 ? (entry.value / pieTotal) * 100 : 0}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </motion.section>
      </div>

      {/* ---------- Income sources ---------- */}
      {incomeByCategory.length > 0 && (
        <motion.section
          className="card"
          variants={riseVariants}
          initial="initial"
          animate="animate"
        >
          <div className="card__header">
            <h2 className="card__title">Income sources</h2>
          </div>
          <ul className="rank-list">
            {incomeByCategory.slice(0, 8).map((c) => (
              <li className="rank-row" key={c.categoryId}>
                <span className="dot" style={{ backgroundColor: c.color }} />
                <div className="rank-row__text">
                  <span className="rank-row__name truncate">{c.name}</span>
                  <span className="rank-row__meta">
                    {c.count} transaction{c.count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="rank-row__figures">
                  <span className="rank-row__value money text-income">
                    {format(c.amount)}
                  </span>
                  <span className="rank-row__pct money">
                    {totalIncome > 0
                      ? ((c.amount / totalIncome) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
                <div
                  className="rank-row__bar"
                  style={{
                    width: `${totalIncome > 0 ? (c.amount / totalIncome) * 100 : 0}%`,
                    backgroundColor: c.color,
                  }}
                />
              </li>
            ))}
          </ul>
        </motion.section>
      )}
    </div>
  );
}
