import { useMemo, useState } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Repeat,
  Trash2,
  Wallet,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { MONTH_NAMES, MONTH_SHORT, monthKey } from "@shared/format";
import Screen from "@/components/ui/Screen";
import HomeHeader from "@/components/layout/HomeHeader";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Badge from "@/components/ui/Badge";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import Switch from "@/components/ui/Switch";
import AmountInput from "@/components/ui/AmountInput";
import Overview from "@/components/ui/Overview";
import ProgressBar from "@/components/ui/ProgressBar";
import PeriodStepper from "@/components/ui/PeriodStepper";
import CategoryIcon from "@/components/ui/CategoryIcon";
import CategoryPicker from "@/components/transactions/CategoryPicker";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { haptic } from "@/lib/haptics";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type BudgetRow = NonNullable<
  ReturnType<typeof useQuery<typeof api.budgets.getBudgetsWithSpending>>
>[number];

export default function BudgetScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { format, compact, symbol } = useCurrency();

  const categories = useQuery(api.categories.getCategories) ?? [];
  const addBudget = useMutation(api.budgets.addBudget);
  const updateBudget = useMutation(api.budgets.updateBudget);
  const deleteBudget = useMutation(api.budgets.deleteBudget);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const monthStr = monthKey(year, month);

  const budgets = useQuery(api.budgets.getBudgetsWithSpending, { month: monthStr });

  const previousDate = new Date(year, month - 1, 1);
  const previousBudgets =
    useQuery(
      api.budgets.getBudgetsWithSpending,
      budgets && budgets.length === 0
        ? { month: monthKey(previousDate.getFullYear(), previousDate.getMonth()) }
        : "skip"
    ) ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formRecurring, setFormRecurring] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<BudgetRow | null>(null);
  const [copying, setCopying] = useState(false);

  const expenseCategories = categories.filter((category) => category.type === "expense");
  const availableCategories = expenseCategories.filter(
    (category) => editing || !(budgets ?? []).some((b) => b.categoryId === category._id)
  );

  const totals = useMemo(() => {
    const list = budgets ?? [];
    const budgeted = list.reduce((sum, b) => sum + b.budgetAmount, 0);
    const spent = list.reduce((sum, b) => sum + b.spent, 0);
    return {
      budgeted,
      spent,
      remaining: budgeted - spent,
      percentage: budgeted > 0 ? (spent / budgeted) * 100 : 0,
    };
  }, [budgets]);

  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysLeft = isCurrentMonth ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
  const dailyAllowance = Math.max(0, totals.remaining) / daysLeft;

  const stepMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  };

  const openCreate = () => {
    setEditing(null);
    setFormCategory("");
    setFormAmount("");
    setFormRecurring(false);
    setFormOpen(true);
  };

  const openEdit = (budget: BudgetRow) => {
    setEditing(budget);
    setFormCategory(budget.categoryId);
    setFormAmount(String(budget.budgetAmount));
    setFormRecurring(budget.isRecurring);
    setFormOpen(true);
  };

  const submit = async () => {
    try {
      if (editing) {
        await updateBudget({
          id: editing._id,
          amount: parseFloat(formAmount),
          isRecurring: formRecurring,
        });
        toast.success("Budget updated");
      } else {
        await addBudget({
          categoryId: formCategory as Id<"categories">,
          amount: parseFloat(formAmount),
          month: monthStr,
          isRecurring: formRecurring,
        });
        toast.success("Budget set");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that budget");
    }
  };

  const copyPreviousMonth = async () => {
    setCopying(true);
    try {
      for (const budget of previousBudgets) {
        await addBudget({
          categoryId: budget.categoryId,
          amount: budget.budgetAmount,
          month: monthStr,
          isRecurring: false,
        });
      }
      haptic("success");
      toast.success(`Copied ${previousBudgets.length} budgets`);
    } catch {
      haptic("error");
      toast.error("Couldn't copy those budgets");
    } finally {
      setCopying(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { _id, isRecurring } = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteBudget({ id: _id, deleteAllFuture: isRecurring });
      haptic("success");
      toast.success("Budget removed");
    } catch {
      haptic("error");
      toast.error("Couldn't remove that budget");
    }
  };

  const overallTone =
    totals.percentage >= 100 ? "exceeded" : totals.percentage >= 75 ? "warning" : "safe";

  return (
    <Screen header={<HomeHeader />}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Budgets</Text>
        <Text variant="caption" tone="secondary">
          {budgets ? `${format(totals.spent)} of ${format(totals.budgeted)} used` : "Loading…"}
        </Text>
      </View>

      <Button
        block
        label="New budget"
        icon={<Plus size={16} color="#fff" />}
        onPress={openCreate}
      />

      <PeriodStepper
        label={`${MONTH_SHORT[month]} ${year}`}
        onPrev={() => stepMonth(-1)}
        onNext={() => stepMonth(1)}
        onReset={
          !isCurrentMonth
            ? () => {
                setMonth(now.getMonth());
                setYear(now.getFullYear());
              }
            : undefined
        }
      />

      {budgets === undefined ? (
        <SkeletonCard lines={4} />
      ) : budgets.length === 0 ? (
        <Card>
          <EmptyState
            icon={Wallet}
            title={`No budgets for ${MONTH_NAMES[month]}`}
            description="Set a spending limit per category and FinHash will warn you before you go over."
            action={
              <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", justifyContent: "center" }}>
                <Button label="Set your first budget" size="sm" onPress={openCreate} />
                {previousBudgets.length > 0 ? (
                  <Button
                    label={
                      copying ? "Copying…" : `Copy ${MONTH_NAMES[previousDate.getMonth()]}`
                    }
                    variant="secondary"
                    size="sm"
                    loading={copying}
                    icon={<Copy size={15} color={colors.text} />}
                    onPress={copyPreviousMonth}
                  />
                ) : null}
              </View>
            }
          />
        </Card>
      ) : (
        <>
          <Overview
            percentage={totals.percentage}
            ringLabel="used"
            ringColor={
              overallTone === "exceeded"
                ? colors.danger
                : overallTone === "warning"
                  ? colors.warning
                  : colors.accent
            }
            facts={[
              {
                label: totals.remaining >= 0 ? "Remaining" : "Over budget",
                value: (
                  <Text
                    numberOfLines={1}
                    style={{
                      fontFamily: fonts.numeric,
                      fontSize: fontSize.lg,
                      letterSpacing: -0.5,
                      color: totals.remaining < 0 ? colors.expense : colors.text,
                    }}
                  >
                    {format(Math.abs(totals.remaining))}
                  </Text>
                ),
              },
              { label: "Budgeted", value: format(totals.budgeted) },
              ...(isCurrentMonth
                ? [
                    {
                      label: "Safe per day",
                      value: compact(dailyAllowance),
                      hint: `${daysLeft} days left`,
                    },
                  ]
                : []),
            ]}
          />

          <View style={{ gap: space.md }}>
            {[...budgets]
              .sort((a, b) => b.percentage - a.percentage)
              .map((budget, index) => {
                const remaining = budget.budgetAmount - budget.spent;
                return (
                  <Animated.View
                    key={budget._id}
                    entering={FadeInDown.delay(index * 50).duration(340)}
                  >
                    <Card style={{ gap: space.md }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
                      >
                        <CategoryIcon
                          name={budget.categoryIcon}
                          color={budget.categoryColor}
                          size={17}
                          tileSize={38}
                        />
                        <PressableScale
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/transactions",
                              params: { category: budget.categoryId, type: "expense" },
                            })
                          }
                          scaleTo={0.98}
                          style={{ flex: 1, minWidth: 0 }}
                        >
                          <Text variant="bodyStrong" numberOfLines={1}>
                            {budget.categoryName}
                          </Text>
                          <View
                            style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}
                          >
                            <Text variant="caption" tone="muted" numberOfLines={1}>
                              {remaining >= 0
                                ? `${format(remaining)} left`
                                : `${format(-remaining)} over`}
                            </Text>
                            {budget.isRecurring ? (
                              <View
                                style={{ flexDirection: "row", alignItems: "center", gap: 3 }}
                              >
                                <Repeat size={11} color={colors.accent} />
                                <Text variant="caption" tone="accent">
                                  monthly
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </PressableScale>

                        <IconButton
                          accessibilityLabel={`Edit ${budget.categoryName} budget`}
                          size={34}
                          icon={<Pencil size={15} color={colors.textSecondary} />}
                          onPress={() => openEdit(budget)}
                        />
                        <IconButton
                          accessibilityLabel={`Delete ${budget.categoryName} budget`}
                          size={34}
                          icon={<Trash2 size={15} color={colors.danger} />}
                          onPress={() => setPendingDelete(budget)}
                        />
                      </View>

                      <ProgressBar
                        value={budget.percentage}
                        tone={budget.status}
                        delay={80 * index}
                      />

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: space.md,
                        }}
                      >
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontFamily: fonts.numeric,
                            fontSize: fontSize.sm,
                            color: colors.text,
                          }}
                        >
                          {format(budget.spent)}{" "}
                          <Text
                            style={{
                              fontFamily: fonts.numeric,
                              fontSize: fontSize.sm,
                              color: colors.textMuted,
                            }}
                          >
                            of {format(budget.budgetAmount)}
                          </Text>
                        </Text>
                        <Badge
                          tone={
                            budget.status === "exceeded"
                              ? "danger"
                              : budget.status === "warning"
                                ? "warning"
                                : "success"
                          }
                          label={`${budget.percentage.toFixed(0)}%`}
                          icon={
                            budget.status === "safe" ? (
                              <CheckCircle2
                                size={11}
                                color={colors.success}
                              />
                            ) : (
                              <AlertTriangle
                                size={11}
                                color={budget.status === "exceeded" ? colors.danger : colors.warning}
                              />
                            )
                          }
                        />
                      </View>
                    </Card>
                  </Animated.View>
                );
              })}
          </View>
        </>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit budget" : "New budget"}
        description={`${MONTH_NAMES[month]} ${year}`}
        footer={
          <Button
            block
            style={{ flex: 1 }}
            label={editing ? "Save changes" : "Set budget"}
            disabled={!formAmount || (!editing && !formCategory)}
            onPress={submit}
          />
        }
      >
        {editing ? (
          <View
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
            <CategoryIcon
              name={editing.categoryIcon}
              color={editing.categoryColor}
              size={18}
              tileSize={40}
            />
            <Text variant="bodyStrong">{editing.categoryName}</Text>
          </View>
        ) : (
          <Field label="Category">
            {availableCategories.length === 0 ? (
              <Text variant="caption" tone="muted">
                Every expense category already has a budget this month.
              </Text>
            ) : (
              <CategoryPicker
                categories={availableCategories}
                value={formCategory}
                onChange={(id) => {
                  haptic("light");
                  setFormCategory(id);
                }}
              />
            )}
          </Field>
        )}

        <Field label="Monthly limit">
          <AmountInput value={formAmount} onChangeText={setFormAmount} symbol={symbol} />
        </Field>

        <Switch
          value={formRecurring}
          onValueChange={setFormRecurring}
          icon={<Repeat size={16} color={formRecurring ? colors.accent : colors.textSecondary} />}
          title="Repeat every month"
          description="Carry this limit into future months"
        />

        <View style={{ height: space.sm }} />
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Remove budget?"
        message={
          pendingDelete?.isRecurring
            ? `This will remove the ${pendingDelete.categoryName} budget for this and all future months.`
            : `The ${pendingDelete?.categoryName} budget for this month will be removed.`
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

    </Screen>
  );
}
