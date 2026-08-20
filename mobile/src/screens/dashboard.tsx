import { useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  ChartNoAxesCombined,
  HandCoins,
  PiggyBank,
  Receipt,
  Target,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import { MONTH_NAMES, MONTH_SHORT, formatShortDate, monthKey } from "@shared/format";
import Screen from "@/components/ui/Screen";
import HomeHeader from "@/components/layout/HomeHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PressableScale from "@/components/ui/PressableScale";
import SegmentedControl from "@/components/ui/SegmentedControl";
import PeriodStepper from "@/components/ui/PeriodStepper";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import ProgressBar from "@/components/ui/ProgressBar";
import StatStrip, { type Stat } from "@/components/ui/StatStrip";
import CategoryIcon from "@/components/ui/CategoryIcon";
import EmptyState from "@/components/ui/EmptyState";
import { SkeletonCard, SkeletonList } from "@/components/ui/Skeleton";
import Donut from "@/components/charts/Donut";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAddTransaction } from "@/providers/AddTransactionProvider";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type ViewMode = "monthly" | "yearly" | "alltime";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const { format, compact } = useCurrency();
  const { openAdd } = useAddTransaction();

  const now = new Date();
  const [view, setView] = useState<ViewMode>("monthly");
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const monthlySummary = useQuery(
    api.transactions.getMonthlySummary,
    view === "monthly" ? { month, year } : "skip"
  );
  const yearlySummary = useQuery(
    api.transactions.getYearlySummary,
    view === "yearly" ? { year } : "skip"
  );
  const allTimeSummary = useQuery(
    api.transactions.getAllTimeSummary,
    view === "alltime" ? {} : "skip"
  );

  const recent = useQuery(api.transactions.getRecentTransactions, { limit: 6 });
  const categories = useQuery(api.categories.getCategories) ?? [];
  const budgets =
    useQuery(api.budgets.getBudgetsWithSpending, { month: monthKey(year, month) }) ?? [];
  const goals = useQuery(api.savings_goals.getGoalsWithProgress) ?? [];
  const debts = useQuery(api.debts.getDebts) ?? [];

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category._id as string, category])),
    [categories]
  );

  const summary =
    view === "monthly" ? monthlySummary : view === "yearly" ? yearlySummary : allTimeSummary;
  const loading = summary === undefined;

  const chartData = useMemo(() => {
    const spending = summary?.categorySpending ?? {};
    return Object.entries(spending)
      .map(([id, amount]) => {
        const category = categoryById.get(id);
        return {
          id,
          name: category?.name ?? "Uncategorised",
          icon: category?.icon,
          value: amount as number,
          color: category?.color ?? "#71717a",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [summary, categoryById]);

  const chartTotal = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const activeGoals = goals.filter((goal) => !goal.isCompleted);
  const openDebts = debts.filter((debt) => !debt.isCompleted);
  const netDebt = openDebts.reduce(
    (sum, debt) => sum + (debt.type === "lent" ? debt.amount : -debt.amount),
    0
  );

  const topBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.percentage - a.percentage).slice(0, 3),
    [budgets]
  );

  const isNewAccount =
    recent?.length === 0 && budgets.length === 0 && goals.length === 0;

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
  const periodLabel =
    view === "monthly"
      ? `${MONTH_NAMES[month]} ${year}`
      : view === "yearly"
        ? String(year)
        : "All time";

  const stepMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  const balance = summary?.balance ?? 0;
  const savingsRate = summary?.savingsRate ?? 0;

  const stats: Stat[] = [
    { icon: Receipt, label: "Transactions", value: String(summary?.transactionCount ?? 0) },
    ...(view === "monthly" && monthlySummary
      ? [{ icon: CalendarClock, label: "Avg / day", value: compact(monthlySummary.avgDailySpend) }]
      : []),
    { icon: PiggyBank, label: "Saved", value: compact(Math.max(0, balance)) },
    ...(activeGoals.length
      ? [{ icon: Target, label: "Goals", value: `${activeGoals.length} active` }]
      : []),
    ...(openDebts.length
      ? [
          {
            icon: HandCoins,
            label: netDebt >= 0 ? "Owed to you" : "You owe",
            value: compact(Math.abs(netDebt)),
          },
        ]
      : []),
  ];

  return (
    <Screen header={<HomeHeader />}>
      <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 2 }}>
        <Text variant="caption" tone="muted">
          {greeting()},
        </Text>
        <Text variant="title">{user?.name?.split(" ")[0] ?? "there"}</Text>
      </Animated.View>

      {isNewAccount ? <GettingStarted onAdd={() => openAdd()} /> : null}

      <SegmentedControl
        segments={[
          { value: "monthly", label: "Month" },
          { value: "yearly", label: "Year" },
          { value: "alltime", label: "All time" },
        ]}
        value={view}
        onChange={setView}
      />

      {view === "monthly" ? (
        <PeriodStepper
          label={`${MONTH_SHORT[month]} ${year}`}
          onPrev={() => stepMonth(-1)}
          onNext={() => stepMonth(1)}
          nextDisabled={isCurrentMonth}
          onReset={
            !isCurrentMonth
              ? () => {
                  setMonth(now.getMonth());
                  setYear(now.getFullYear());
                }
              : undefined
          }
        />
      ) : null}

      {view === "yearly" ? (
        <PeriodStepper
          label={String(year)}
          onPrev={() => setYear((value) => value - 1)}
          onNext={() => setYear((value) => value + 1)}
          nextDisabled={year >= now.getFullYear()}
          onReset={year !== now.getFullYear() ? () => setYear(now.getFullYear()) : undefined}
        />
      ) : null}

      {/* ---------- Balance hero ---------- */}
      {loading ? (
        <SkeletonCard lines={3} height={210} />
      ) : (
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderLight,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[colors.bgElevated, colors.bgCard]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 1 }}
            style={{ padding: space.lg, gap: space.lg }}
          >
            <Overline>Net balance · {periodLabel}</Overline>

            <AnimatedNumber
              value={balance}
              format={format}
              style={{
                fontFamily: fonts.displayHeavy,
                fontSize: 34,
                letterSpacing: -1.7,
                color: balance >= 0 ? colors.text : colors.expense,
              }}
            />

            <View style={{ flexDirection: "row", gap: space.md }}>
              <BalanceStat
                label="Income"
                value={summary?.totalIncome ?? 0}
                format={format}
                tone="in"
              />
              <BalanceStat
                label="Expenses"
                value={summary?.totalExpense ?? 0}
                format={format}
                tone="out"
              />
            </View>

            {(summary?.totalIncome ?? 0) > 0 ? (
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text variant="caption" tone="secondary" style={{ fontFamily: fonts.semibold }}>
                    Savings rate
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.xs,
                      color: colors.textSecondary,
                    }}
                  >
                    {savingsRate.toFixed(1)}%
                  </Text>
                </View>
                <ProgressBar
                  value={Math.max(0, savingsRate)}
                  tone={savingsRate >= 20 ? "safe" : savingsRate >= 0 ? "warning" : "danger"}
                  height={6}
                  delay={200}
                />
              </View>
            ) : null}
          </LinearGradient>
        </Animated.View>
      )}

      {!loading && summary ? <StatStrip stats={stats} /> : null}

      {/* ---------- Where it went ---------- */}
      <Card>
        <SectionHeader
          title="Where it went"
          actionLabel={chartData.length ? "Analytics" : undefined}
          onAction={() => router.push("/analytics")}
        />

        {loading ? (
          <SkeletonList rows={4} />
        ) : chartData.length === 0 ? (
          <EmptyState
            icon={ChartNoAxesCombined}
            title="No spending yet"
            description="Add an expense and your category breakdown appears here."
          />
        ) : (
          <View style={{ gap: space.lg }}>
            <View style={{ alignItems: "center" }}>
              <Donut
                data={chartData.map((entry) => ({
                  key: entry.id,
                  value: entry.value,
                  color: entry.color,
                }))}
              >
                <Overline>Total</Overline>
                <Text
                  style={{
                    fontFamily: fonts.numeric,
                    fontSize: fontSize.xl,
                    color: colors.text,
                  }}
                >
                  {compact(chartTotal)}
                </Text>
              </Donut>
            </View>

            <View>
              {chartData.map((entry) => (
                <PressableScale
                  key={entry.id}
                  scaleTo={0.985}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/transactions",
                      params: { category: entry.id, type: "expense" },
                    })
                  }
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.sm,
                    paddingVertical: 7,
                  }}
                >
                  <CategoryIcon
                    name={entry.icon}
                    color={entry.color}
                    size={15}
                    tileSize={30}
                  />
                  <Text variant="label" tone="secondary" style={{ flex: 1 }} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                      width: 38,
                      textAlign: "right",
                    }}
                  >
                    {chartTotal > 0 ? ((entry.value / chartTotal) * 100).toFixed(0) : 0}%
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.sm,
                      color: colors.text,
                      minWidth: 78,
                      textAlign: "right",
                    }}
                  >
                    {format(entry.value)}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>
        )}
      </Card>

      {/* ---------- Recent activity ---------- */}
      <Card>
        <SectionHeader
          title="Recent activity"
          actionLabel="See all"
          onAction={() => router.push("/(tabs)/transactions")}
        />

        {recent === undefined ? (
          <SkeletonList rows={5} />
        ) : recent.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nothing here yet"
            description="Your latest income and expenses will show up here."
            action={<Button label="Add your first transaction" size="sm" onPress={() => openAdd()} />}
          />
        ) : (
          <View>
            {recent.map((transaction, index) => {
              const category = categoryById.get(transaction.categoryId);
              return (
                <View
                  key={transaction._id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: space.md,
                    paddingVertical: space.sm,
                    borderBottomWidth: index === recent.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <CategoryIcon
                    name={category?.icon}
                    color={category?.color ?? "#71717a"}
                    size={16}
                    tileSize={34}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {transaction.description || category?.name || "Transaction"}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {formatShortDate(transaction.date)} · {category?.name ?? "Unknown"}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.sm,
                      color: transaction.type === "income" ? colors.income : colors.text,
                    }}
                  >
                    {transaction.type === "income" ? "+" : "−"}
                    {format(transaction.amount)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* ---------- Budget pulse ---------- */}
      {view === "monthly" && topBudgets.length > 0 ? (
        <Card>
          <SectionHeader
            title="Budget pulse"
            actionLabel="Manage"
            onAction={() => router.push("/(tabs)/budget")}
          />
          <View style={{ gap: space.lg }}>
            {topBudgets.map((budget, index) => (
              <View key={budget._id} style={{ gap: 6 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: space.md,
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flex: 1 }}
                  >
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: budget.categoryColor,
                      }}
                    />
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {budget.categoryName}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.xs,
                      color: colors.text,
                    }}
                  >
                    {format(budget.spent)}{" "}
                    <Text
                      style={{
                        fontFamily: fonts.numeric,
                        fontSize: fontSize.xs,
                        color: colors.textMuted,
                      }}
                    >
                      / {format(budget.budgetAmount)}
                    </Text>
                  </Text>
                </View>
                <ProgressBar
                  value={budget.percentage}
                  tone={budget.status}
                  height={6}
                  delay={100 + index * 60}
                />
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      {/* ---------- Quick links ---------- */}
      <View style={{ gap: space.sm }}>
        <QuickLink
          icon={Target}
          title="Savings goals"
          hint={activeGoals.length ? `${activeGoals.length} in progress` : "Set your first goal"}
          onPress={() => router.push("/goals")}
        />
        <QuickLink
          icon={HandCoins}
          title="Debts & loans"
          hint={openDebts.length ? `${openDebts.length} open` : "Nothing outstanding"}
          onPress={() => router.push("/debts")}
        />
        <QuickLink
          icon={Wallet}
          title="Budgets"
          hint={budgets.length ? `${budgets.length} categories` : "Set limits"}
          onPress={() => router.push("/(tabs)/budget")}
        />
        <QuickLink
          icon={ChartNoAxesCombined}
          title="Analytics"
          hint="Trends & insights"
          onPress={() => router.push("/analytics")}
        />
      </View>
    </Screen>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: space.lg,
      }}
    >
      <Text variant="heading">{title}</Text>
      {actionLabel && onAction ? (
        <PressableScale
          onPress={onAction}
          scaleTo={0.94}
          style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        >
          <Text variant="caption" tone="muted" style={{ fontFamily: fonts.semibold }}>
            {actionLabel}
          </Text>
          <ArrowRight size={13} color={colors.textMuted} />
        </PressableScale>
      ) : null}
    </View>
  );
}

function BalanceStat({
  label,
  value,
  format,
  tone,
}: {
  label: string;
  value: number;
  format: (value: number) => string;
  tone: "in" | "out";
}) {
  const { colors } = useTheme();
  const Icon = tone === "in" ? ArrowDownLeft : ArrowUpRight;

  return (
    <View
      style={{
        flex: 1,
        gap: 5,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inlay,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: radius.xs,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: tone === "in" ? colors.successSoft : colors.dangerSoft,
          }}
        >
          <Icon size={13} color={tone === "in" ? colors.success : colors.danger} />
        </View>
        <Overline>{label}</Overline>
      </View>
      <AnimatedNumber
        value={value}
        format={format}
        numberOfLines={1}
        style={{
          fontFamily: fonts.numeric,
          fontSize: fontSize.lg,
          letterSpacing: -0.5,
          color: colors.text,
        }}
      />
    </View>
  );
}

function QuickLink({
  icon: Icon,
  title,
  hint,
  onPress,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.bgCard,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
        }}
      >
        <Icon size={18} color={colors.accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong">{title}</Text>
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      </View>
      <ArrowRight size={16} color={colors.textFaint} />
    </PressableScale>
  );
}

/** Three-step nudge shown while the account is still empty. */
function GettingStarted({ onAdd }: { onAdd: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();

  const steps = [
    { n: 1, title: "Log a transaction", hint: "Amount, category, done", onPress: onAdd },
    {
      n: 2,
      title: "Set a budget",
      hint: "We'll warn you before you overspend",
      onPress: () => router.push("/(tabs)/budget"),
    },
    {
      n: 3,
      title: "Name a savings goal",
      hint: "Watch it fill up as you contribute",
      onPress: () => router.push("/goals"),
    },
  ];

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{
        gap: space.sm,
        padding: space.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.accentRing,
        backgroundColor: colors.bgCard,
      }}
    >
      <Text variant="title" style={{ fontSize: 20 }}>
        Let's get you set up
      </Text>
      <Text variant="caption" tone="secondary" style={{ marginBottom: space.sm }}>
        Three quick steps and your dashboard fills itself in.
      </Text>

      {steps.map((step) => (
        <PressableScale
          key={step.n}
          onPress={step.onPress}
          scaleTo={0.98}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: space.md,
            padding: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.bgElevated,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: radius.full,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent,
            }}
          >
            <Text style={{ fontFamily: fonts.numeric, fontSize: fontSize.xs, color: "#fff" }}>
              {step.n}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text variant="bodyStrong">{step.title}</Text>
            <Text variant="caption" tone="muted">
              {step.hint}
            </Text>
          </View>
          <ArrowRight size={16} color={colors.textFaint} />
        </PressableScale>
      ))}
    </Animated.View>
  );
}
