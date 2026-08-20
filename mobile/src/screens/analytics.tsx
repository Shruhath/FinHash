import { useMemo, useState } from "react";
import { View } from "react-native";
import { useQuery } from "convex/react";
import { ChartNoAxesCombined, TrendingDown, TrendingUp } from "lucide-react-native";
import { api } from "@convex/_generated/api";
import Screen from "@/components/ui/Screen";
import AppHeader from "@/components/layout/AppHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import SegmentedControl from "@/components/ui/SegmentedControl";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import CategoryIcon from "@/components/ui/CategoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Donut from "@/components/charts/Donut";
import CashFlowChart from "@/components/charts/CashFlowChart";
import TrendChart from "@/components/charts/TrendChart";
import { useCurrency } from "@/hooks/useCurrency";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type Range = "3" | "6" | "12";

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const { format, compact } = useCurrency();
  const [range, setRange] = useState<Range>("6");

  const analytics = useQuery(api.analytics.getAnalyticsData, { months: Number(range) });

  const pieData = useMemo(() => {
    if (!analytics) return [];
    const top = analytics.expenseByCategory.slice(0, 7);
    const rest = analytics.expenseByCategory.slice(7);
    const otherSum = rest.reduce((sum, entry) => sum + entry.amount, 0);
    const data = top.map((entry) => ({
      key: entry.categoryId,
      name: entry.name,
      icon: entry.icon,
      value: entry.amount,
      color: entry.color,
      count: entry.count,
    }));
    if (otherSum > 0) {
      data.push({
        key: "__other",
        name: "Other",
        icon: "MoreHorizontal",
        value: otherSum,
        color: "#71717a",
        count: rest.reduce((sum, entry) => sum + entry.count, 0),
      });
    }
    return data;
  }, [analytics]);

  const pieTotal = pieData.reduce((sum, entry) => sum + entry.value, 0);

  const insights = useMemo(() => {
    if (!analytics || analytics.monthlyTrend.length < 2) return null;
    const trend = analytics.monthlyTrend;
    const current = trend[trend.length - 1]!;
    const previous = trend[trend.length - 2]!;
    const delta =
      previous.expense > 0 ? ((current.expense - previous.expense) / previous.expense) * 100 : 0;
    const months = trend.filter((month) => month.expense > 0);
    const avg =
      months.length > 0
        ? months.reduce((sum, month) => sum + month.expense, 0) / months.length
        : 0;
    const best = [...trend].sort((a, b) => b.balance - a.balance)[0];
    return { delta, avg, best };
  }, [analytics]);

  if (analytics === undefined) {
    return (
      <Screen header={<AppHeader title="Analytics" />} withTabBar={false}>
        <Text variant="title">Analytics</Text>
        <SkeletonCard lines={6} height={280} />
        <SkeletonCard lines={5} />
      </Screen>
    );
  }

  if (analytics === null || analytics.totalTransactions === 0) {
    return (
      <Screen header={<AppHeader title="Analytics" />} withTabBar={false}>
        <Text variant="title">Analytics</Text>
        <Card>
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Not enough data yet"
            description="Add a few transactions and your trends, category splits and month-over-month comparisons appear here."
          />
        </Card>
      </Screen>
    );
  }

  const { monthlyTrend, incomeByCategory, totalIncome, totalExpense } = analytics;

  return (
    <Screen header={<AppHeader title="Analytics" />} withTabBar={false}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Analytics</Text>
        <Text variant="caption" tone="secondary">
          {format(totalExpense)} spent · {format(totalIncome)} earned
        </Text>
      </View>

      <SegmentedControl
        segments={[
          { value: "3", label: "3M" },
          { value: "6", label: "6M" },
          { value: "12", label: "12M" },
        ]}
        value={range}
        onChange={setRange}
      />

      {insights ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          <Insight
            label="This month vs last"
            value={`${Math.abs(insights.delta).toFixed(0)}%`}
            hint={insights.delta > 0 ? "more spending" : "less spending"}
            tone={insights.delta > 0 ? "expense" : "income"}
            icon={
              insights.delta > 0 ? (
                <TrendingUp size={15} color={colors.expense} />
              ) : (
                <TrendingDown size={15} color={colors.income} />
              )
            }
          />
          <Insight
            label="Average month"
            value={compact(insights.avg)}
            hint="across the period"
          />
          <Insight
            label="Best month"
            value={insights.best?.monthLabel ?? "—"}
            hint={insights.best ? `${compact(insights.best.balance)} saved` : ""}
          />
          <Insight
            label="Net across period"
            value={compact(totalIncome - totalExpense)}
            hint="income minus expenses"
            tone={totalIncome - totalExpense >= 0 ? "income" : "expense"}
          />
        </View>
      ) : null}

      <Card>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: space.lg,
            flexWrap: "wrap",
            gap: space.sm,
          }}
        >
          <Text variant="heading">Cash flow</Text>
          <View style={{ flexDirection: "row", gap: space.md }}>
            <Legend color={colors.income} label="Income" />
            <Legend color={colors.expense} label="Expenses" />
            <Legend color={colors.accent} label="Net" />
          </View>
        </View>

        <CashFlowChart
          data={monthlyTrend}
          formatCompact={compact}
          formatFull={format}
        />
      </Card>

      <Card>
        <Text variant="heading" style={{ marginBottom: space.lg }}>
          Spending trend
        </Text>
        <TrendChart
          data={monthlyTrend.map((month) => ({
            monthLabel: month.monthLabel,
            value: month.expense,
          }))}
          formatCompact={compact}
        />
      </Card>

      <Card>
        <Text variant="heading" style={{ marginBottom: space.lg }}>
          Where money goes
        </Text>

        {pieData.length === 0 ? (
          <EmptyState icon={ChartNoAxesCombined} title="No expenses in this period" />
        ) : (
          <View style={{ gap: space.lg }}>
            <View style={{ alignItems: "center" }}>
              <Donut data={pieData} size={200} thickness={28}>
                <Overline>Total</Overline>
                <Text
                  style={{
                    fontFamily: fonts.numeric,
                    fontSize: fontSize.xl,
                    color: colors.text,
                  }}
                >
                  {compact(pieTotal)}
                </Text>
              </Donut>
            </View>

            <View>
              {pieData.map((entry) => (
                <RankRow
                  key={entry.key}
                  icon={entry.icon}
                  color={entry.color}
                  name={entry.name}
                  meta={`${entry.count} transaction${entry.count === 1 ? "" : "s"}`}
                  value={format(entry.value)}
                  pct={pieTotal > 0 ? (entry.value / pieTotal) * 100 : 0}
                />
              ))}
            </View>
          </View>
        )}
      </Card>

      {incomeByCategory.length > 0 ? (
        <Card>
          <Text variant="heading" style={{ marginBottom: space.lg }}>
            Income sources
          </Text>
          {incomeByCategory.slice(0, 8).map((entry) => (
            <RankRow
              key={entry.categoryId}
              color={entry.color}
              name={entry.name}
              meta={`${entry.count} transaction${entry.count === 1 ? "" : "s"}`}
              value={format(entry.amount)}
              valueTone="income"
              pct={totalIncome > 0 ? (entry.amount / totalIncome) * 100 : 0}
            />
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

function Insight({
  label,
  value,
  hint,
  tone,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "income" | "expense";
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const numeric = Number(value.replace(/[^0-9.-]/g, ""));

  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: "47%",
        gap: 3,
        padding: space.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgCard,
      }}
    >
      <Overline numberOfLines={1}>{label}</Overline>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {icon}
        {Number.isFinite(numeric) && value.match(/^[₹$€£¥]?[\d.,]+[KMB%]?$/) ? (
          <AnimatedNumber
            value={numeric}
            format={() => value}
            numberOfLines={1}
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: fontSize.lg,
              letterSpacing: -0.6,
              color:
                tone === "income" ? colors.income : tone === "expense" ? colors.expense : colors.text,
            }}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: fontSize.lg,
              letterSpacing: -0.6,
              color:
                tone === "income" ? colors.income : tone === "expense" ? colors.expense : colors.text,
            }}
          >
            {value}
          </Text>
        )}
      </View>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {hint}
      </Text>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption" tone="muted" style={{ fontFamily: fonts.semibold }}>
        {label}
      </Text>
    </View>
  );
}

function RankRow({
  icon,
  color,
  name,
  meta,
  value,
  valueTone,
  pct,
}: {
  icon?: string;
  color: string;
  name: string;
  meta: string;
  value: string;
  valueTone?: "income";
  pct: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ paddingVertical: space.sm, gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        {icon ? (
          <CategoryIcon name={icon} color={color} size={15} tileSize={30} />
        ) : (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="label" numberOfLines={1}>
            {name}
          </Text>
          <Text variant="caption" tone="muted">
            {meta}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontFamily: fonts.numeric,
              fontSize: fontSize.sm,
              color: valueTone === "income" ? colors.income : colors.text,
            }}
          >
            {value}
          </Text>
          <Text
            style={{
              fontFamily: fonts.numericSemi,
              fontSize: fontSize["2xs"],
              color: colors.textMuted,
            }}
          >
            {pct.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Proportional underline, echoing the web ranking rows */}
      <View style={{ height: 2, backgroundColor: colors.border, borderRadius: 1 }}>
        <View
          style={{
            width: `${Math.min(100, pct)}%`,
            height: "100%",
            borderRadius: 1,
            backgroundColor: color,
            opacity: 0.6,
          }}
        />
      </View>
    </View>
  );
}
