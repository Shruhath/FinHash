import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Plus, Split, Target, Trash2 } from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import Text, { Overline } from "../ui/Text";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";
import Chip from "../ui/Chip";
import Field from "../ui/Field";
import TextField from "../ui/TextField";
import AmountInput from "../ui/AmountInput";
import DateField from "../ui/DateField";
import SegmentedControl from "../ui/SegmentedControl";
import CategoryPicker from "./CategoryPicker";
import Select from "../ui/Select";
import Switch from "../ui/Switch";
import { useCurrency } from "@/hooks/useCurrency";
import { useToast } from "../ui/Toast";
import { haptic } from "@/lib/haptics";
import { monthKey } from "@shared/format";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";
import type { AddPreset } from "@/providers/AddTransactionProvider";

interface SplitRow {
  amount: string;
  categoryId: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  preset?: AddPreset;
}

const emptySplits = (): SplitRow[] => [
  { amount: "", categoryId: "" },
  { amount: "", categoryId: "" },
];

const DAY = 86_400_000;

export default function AddTransactionSheet({ open, onClose, preset }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const { symbol, format } = useCurrency();

  const categories = useQuery(api.categories.getCategories) ?? [];
  const goals = useQuery(api.savings_goals.getGoalsWithProgress) ?? [];
  const addTransaction = useMutation(api.transactions.addTransaction);
  const splitTransaction = useMutation(api.transactions.splitTransaction);

  const now = new Date();
  const budgets =
    useQuery(api.budgets.getBudgetsWithSpending, {
      month: monthKey(now.getFullYear(), now.getMonth()),
    }) ?? [];

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [goalId, setGoalId] = useState("");
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitRow[]>(emptySplits);
  const [saving, setSaving] = useState(false);

  // A fresh sheet every time it opens — nothing carries over.
  useEffect(() => {
    if (!open) return;
    setType(preset?.type ?? "expense");
    setAmount("");
    setCategoryId(preset?.categoryId ?? "");
    setDescription("");
    setDate(new Date());
    setGoalId(preset?.goalId ?? "");
    setIsSplit(false);
    setSplits(emptySplits());
    setSaving(false);
  }, [open, preset]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  const parsedAmount = parseFloat(amount) || 0;
  const splitTotal = splits.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
  const remainder = parsedAmount - splitTotal;
  const balanced = Math.abs(remainder) < 0.01;

  const dayOffset = (() => {
    const chosen = new Date(date);
    chosen.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((chosen.getTime() - today.getTime()) / DAY);
  })();

  const setQuickDate = (offset: number) => {
    haptic("light");
    const next = new Date();
    next.setDate(next.getDate() + offset);
    setDate(next);
  };

  const warnOnBudget = (id: string, spentDelta: number) => {
    const budget = budgets.find((entry) => entry.categoryId === id);
    if (!budget) return;
    const newSpent = budget.spent + spentDelta;
    const pct = (newSpent / budget.budgetAmount) * 100;
    if (pct >= 100) {
      haptic("error");
      toast.warning(
        `${budget.categoryName} budget exceeded`,
        `${format(newSpent)} of ${format(budget.budgetAmount)} — ${pct.toFixed(0)}% used`
      );
    } else if (pct >= 80) {
      toast.warning(
        `${budget.categoryName} at ${pct.toFixed(0)}%`,
        `${format(budget.budgetAmount - newSpent)} left this month`
      );
    }
  };

  const canSubmit = parsedAmount > 0 && (isSplit ? balanced : !!categoryId);

  const submit = async () => {
    if (saving || !canSubmit) return;
    setSaving(true);

    try {
      if (isSplit) {
        const valid = splits
          .filter((row) => parseFloat(row.amount) > 0 && row.categoryId)
          .map((row) => ({
            amount: parseFloat(row.amount),
            categoryId: row.categoryId as Id<"categories">,
          }));

        if (valid.length < 2) {
          toast.error("Add at least two split rows with a category");
          setSaving(false);
          return;
        }

        await splitTransaction({ splits: valid, date: date.getTime(), type });
        haptic("success");
        toast.success(`Split into ${valid.length} entries`);
        if (type === "expense") {
          valid.forEach((row) => warnOnBudget(row.categoryId, row.amount));
        }
      } else {
        await addTransaction({
          amount: parsedAmount,
          type,
          categoryId: categoryId as Id<"categories">,
          date: date.getTime(),
          description: description.trim() || undefined,
          goalId: goalId ? (goalId as Id<"savings_goals">) : undefined,
        });
        haptic("success");
        toast.success(
          `${type === "income" ? "Income" : "Expense"} of ${format(parsedAmount)} added`
        );
        if (type === "expense") warnOnBudget(categoryId, parsedAmount);
      }

      onClose();
    } catch {
      haptic("error");
      toast.error("Couldn't save that — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add transaction"
      footer={
        <Button
          block
          size="lg"
          style={{ flex: 1 }}
          label={
            saving
              ? "Saving…"
              : parsedAmount > 0
                ? `Add ${format(parsedAmount)}`
                : "Add transaction"
          }
          loading={saving}
          disabled={!canSubmit}
          onPress={submit}
        />
      }
    >
      <SegmentedControl
        segments={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
        value={type}
        onChange={(next) => {
          setType(next);
          setCategoryId("");
          setGoalId("");
          setSplits(emptySplits());
        }}
      />

      <AmountInput
        value={amount}
        onChangeText={setAmount}
        symbol={symbol}
        tone={type}
      />

      <Field label="When">
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
          {[
            { label: "Today", offset: 0 },
            { label: "Yesterday", offset: -1 },
            { label: "2 days ago", offset: -2 },
          ].map(({ label, offset }) => (
            <Chip
              key={offset}
              label={label}
              active={dayOffset === offset}
              onPress={() => setQuickDate(offset)}
            />
          ))}
        </View>

        <DateField
          value={date}
          onChange={setDate}
          mode="datetime"
          maximumDate={new Date(Date.now() + 365 * DAY)}
        />
      </Field>

      <Switch
        value={isSplit}
        onValueChange={(next) => {
          haptic("light");
          setIsSplit(next);
        }}
        icon={<Split size={16} color={isSplit ? colors.accent : colors.textSecondary} />}
        title="Split across categories"
        description="Divide one payment into several entries"
      />

      {!isSplit ? (
        <Animated.View
          key="single"
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={{ gap: space.lg }}
        >
          <Field label="Category">
            <CategoryPicker
              categories={filteredCategories}
              value={categoryId}
              onChange={(id) => {
                haptic("light");
                setCategoryId(id);
              }}
            />
          </Field>

          <Field label="Note">
            <TextField
              inSheet
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              maxLength={120}
              returnKeyType="done"
            />
          </Field>

          {goals.filter((goal) => !goal.isCompleted).length > 0 ? (
            <Field label="Count toward a goal">
              <Select
                value={goalId}
                onChange={setGoalId}
                placeholder="None"
                icon={<Target size={15} color={colors.textMuted} />}
                options={[
                  { value: "", label: "None" },
                  ...goals
                    .filter((goal) => !goal.isCompleted)
                    .map((goal) => ({
                      value: goal._id as string,
                      label: `${goal.name} · ${goal.percentage.toFixed(0)}%`,
                    })),
                ]}
              />
            </Field>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View
          key="split"
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(120)}
          style={{ gap: space.md }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Overline>Split details</Overline>
            <View
              style={{
                paddingHorizontal: space.md,
                paddingVertical: 3,
                borderRadius: radius.full,
                backgroundColor: balanced ? colors.successSoft : colors.dangerSoft,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.numeric,
                  fontSize: fontSize.xs,
                  color: balanced ? colors.success : colors.danger,
                }}
              >
                {balanced
                  ? "Balanced"
                  : `${format(Math.abs(remainder))} ${remainder > 0 ? "left" : "over"}`}
              </Text>
            </View>
          </View>

          {splits.map((row, index) => (
            <View key={index} style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <Select
                style={{ flex: 1 }}
                value={row.categoryId}
                onChange={(next) =>
                  setSplits((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, categoryId: next } : item))
                  )
                }
                placeholder="Category"
                options={filteredCategories.map((category) => ({
                  value: category._id as string,
                  label: category.name,
                }))}
              />
              <TextField
                inSheet
                value={row.amount}
                onChangeText={(next) =>
                  setSplits((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, amount: next.replace(/[^0-9.]/g, "") } : item
                    )
                  )
                }
                keyboardType="decimal-pad"
                placeholder="0.00"
                style={{ width: 96, textAlign: "right", fontFamily: fonts.numeric }}
              />
              {splits.length > 2 ? (
                <IconButton
                  accessibilityLabel="Remove split row"
                  icon={<Trash2 size={16} color={colors.danger} />}
                  onPress={() => setSplits((prev) => prev.filter((_, i) => i !== index))}
                />
              ) : null}
            </View>
          ))}

          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button
              label="Add row"
              variant="secondary"
              size="sm"
              icon={<Plus size={15} color={colors.text} />}
              onPress={() => setSplits((prev) => [...prev, { amount: "", categoryId: "" }])}
            />
            {remainder > 0.01 ? (
              <Button
                label="Fill remainder"
                variant="ghost"
                size="sm"
                onPress={() =>
                  setSplits((prev) =>
                    prev.map((item, i) =>
                      i === prev.length - 1
                        ? {
                            ...item,
                            amount: ((parseFloat(item.amount) || 0) + remainder).toFixed(2),
                          }
                        : item
                    )
                  )
                }
              />
            ) : null}
          </View>
        </Animated.View>
      )}
    </Sheet>
  );
}
