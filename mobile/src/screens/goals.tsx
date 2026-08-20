import { useMemo, useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  CalendarClock,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  TriangleAlert,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { formatDaysLeft } from "@shared/format";
import Screen from "@/components/ui/Screen";
import AppHeader from "@/components/layout/AppHeader";
import Text from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Chip from "@/components/ui/Chip";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import TextField from "@/components/ui/TextField";
import AmountInput from "@/components/ui/AmountInput";
import DateField from "@/components/ui/DateField";
import Overview from "@/components/ui/Overview";
import ProgressRing from "@/components/ui/ProgressRing";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { useAddTransaction } from "@/providers/AddTransactionProvider";
import { haptic } from "@/lib/haptics";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type Goal = NonNullable<
  ReturnType<typeof useQuery<typeof api.savings_goals.getGoalsWithProgress>>
>[number];

export default function GoalsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { format, compact, symbol } = useCurrency();
  const { openAdd } = useAddTransaction();

  const goals = useQuery(api.savings_goals.getGoalsWithProgress);
  const addGoal = useMutation(api.savings_goals.addGoal);
  const updateGoal = useMutation(api.savings_goals.updateGoal);
  const deleteGoal = useMutation(api.savings_goals.deleteGoal);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const active = useMemo(() => (goals ?? []).filter((goal) => !goal.isCompleted), [goals]);
  const completed = useMemo(() => (goals ?? []).filter((goal) => goal.isCompleted), [goals]);

  const totals = useMemo(() => {
    const saved = active.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const targetSum = active.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const nextUp = [...active].sort((a, b) => a.targetDate - b.targetDate)[0];
    return {
      saved,
      target: targetSum,
      percentage: targetSum > 0 ? (saved / targetSum) * 100 : 0,
      nextUp,
    };
  }, [active]);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setTarget("");
    setDescription("");
    const inSixMonths = new Date();
    inSixMonths.setMonth(inSixMonths.getMonth() + 6);
    setTargetDate(inSixMonths);
    setFormOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setName(goal.name);
    setTarget(String(goal.targetAmount));
    setTargetDate(new Date(goal.targetDate));
    setDescription(goal.description ?? "");
    setFormOpen(true);
  };

  const submit = async () => {
    const payload = {
      name: name.trim(),
      targetAmount: parseFloat(target),
      targetDate: targetDate.getTime(),
      description: description.trim() || undefined,
    };
    try {
      if (editing) {
        await updateGoal({ id: editing._id, ...payload });
        toast.success("Goal updated");
      } else {
        await addGoal(payload);
        toast.success("Goal created");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that goal");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id as Id<"savings_goals">;
    setPendingDelete(null);
    try {
      await deleteGoal({ id });
      haptic("success");
      toast.success("Goal deleted");
    } catch {
      haptic("error");
      toast.error("Couldn't delete that goal");
    }
  };

  return (
    <Screen header={<AppHeader title="Goals" />} withTabBar={false}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Savings goals</Text>
        <Text variant="caption" tone="secondary">
          {goals
            ? `${active.length} active${completed.length ? ` · ${completed.length} reached` : ""}`
            : "Loading…"}
        </Text>
      </View>

      <Button block label="New goal" icon={<Plus size={16} color="#fff" />} onPress={openCreate} />

      {goals === undefined ? (
        <SkeletonCard lines={4} />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Name what you're saving for, set a target, and link transactions to watch it fill up."
            action={<Button label="Create a goal" size="sm" onPress={openCreate} />}
          />
        </Card>
      ) : (
        <>
          {active.length > 0 ? (
            <Overview
              percentage={totals.percentage}
              ringLabel="funded"
              facts={[
                { label: "Saved so far", value: format(totals.saved) },
                {
                  label: `Across ${active.length} goal${active.length === 1 ? "" : "s"}`,
                  value: format(totals.target),
                },
                {
                  label: "Next deadline",
                  value: (
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {totals.nextUp?.name ?? "—"}
                    </Text>
                  ),
                  hint: totals.nextUp
                    ? totals.nextUp.isOverdue
                      ? "Past due"
                      : formatDaysLeft(totals.nextUp.daysLeft)
                    : undefined,
                },
              ]}
            />
          ) : null}

          <View style={{ gap: space.md }}>
            {active.map((goal, index) => (
              <Animated.View key={goal._id} entering={FadeInDown.delay(index * 50).duration(340)}>
                <Card style={{ gap: space.md }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                    <ProgressRing
                      value={goal.percentage}
                      size={64}
                      thickness={7}
                      color={goal.isOverdue ? colors.danger : colors.accent}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.displayHeavy,
                          fontSize: fontSize.xs,
                          color: colors.text,
                        }}
                      >
                        {goal.percentage.toFixed(0)}%
                      </Text>
                    </ProgressRing>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text variant="heading" numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        {goal.isOverdue ? (
                          <TriangleAlert size={12} color={colors.danger} />
                        ) : (
                          <CalendarClock size={12} color={colors.textMuted} />
                        )}
                        <Text
                          variant="caption"
                          tone={goal.isOverdue ? "expense" : "muted"}
                        >
                          {goal.isOverdue ? "Past due" : formatDaysLeft(goal.daysLeft)}
                        </Text>
                      </View>
                    </View>

                    <IconButton
                      accessibilityLabel={`Edit ${goal.name}`}
                      size={34}
                      icon={<Pencil size={15} color={colors.textSecondary} />}
                      onPress={() => openEdit(goal)}
                    />
                    <IconButton
                      accessibilityLabel={`Delete ${goal.name}`}
                      size={34}
                      icon={<Trash2 size={15} color={colors.danger} />}
                      onPress={() => setPendingDelete(goal)}
                    />
                  </View>

                  {goal.description ? (
                    <Text variant="caption" tone="secondary">
                      {goal.description}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
                    <Text
                      style={{
                        fontFamily: fonts.numeric,
                        fontSize: fontSize.xl,
                        letterSpacing: -0.8,
                        color: colors.text,
                      }}
                    >
                      {format(goal.currentAmount)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.numericSemi,
                        fontSize: fontSize.sm,
                        color: colors.textMuted,
                      }}
                    >
                      of {format(goal.targetAmount)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: space.md,
                      paddingTop: space.sm,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.numericSemi,
                        fontSize: fontSize.xs,
                        color: colors.textSecondary,
                      }}
                    >
                      {compact(Math.max(0, goal.targetAmount - goal.currentAmount))} to go
                    </Text>
                    <Button
                      label="Contribute"
                      variant="secondary"
                      size="sm"
                      icon={<Sparkles size={14} color={colors.text} />}
                      onPress={() => openAdd({ goalId: goal._id })}
                    />
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>

          {completed.length > 0 ? (
            <View style={{ gap: space.md }}>
              <PressableScale
                onPress={() => setShowCompleted((value) => !value)}
                scaleTo={0.98}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                  padding: space.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.bgCard,
                }}
              >
                <Check size={16} color={colors.success} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  Reached goals ({completed.length})
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.textMuted}
                  style={{ transform: [{ rotate: showCompleted ? "180deg" : "0deg" }] }}
                />
              </PressableScale>

              {showCompleted
                ? completed.map((goal) => (
                    <Card key={goal._id} style={{ gap: space.md, opacity: 0.9 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: radius.full,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: colors.successSoft,
                          }}
                        >
                          <Check size={18} color={colors.success} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text variant="heading" numberOfLines={1}>
                            {goal.name}
                          </Text>
                          <Text variant="caption" tone="income">
                            Reached
                          </Text>
                        </View>
                        <IconButton
                          accessibilityLabel={`Delete ${goal.name}`}
                          size={34}
                          icon={<Trash2 size={15} color={colors.danger} />}
                          onPress={() => setPendingDelete(goal)}
                        />
                      </View>
                      <Text
                        style={{
                          fontFamily: fonts.numeric,
                          fontSize: fontSize.lg,
                          color: colors.income,
                        }}
                      >
                        {format(goal.currentAmount)}
                      </Text>
                    </Card>
                  ))
                : null}
            </View>
          ) : null}
        </>
      )}

      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit goal" : "New savings goal"}
        footer={
          <Button
            block
            style={{ flex: 1 }}
            label={editing ? "Save changes" : "Create goal"}
            disabled={!name.trim() || !target}
            onPress={submit}
          />
        }
      >
        <Field label="What are you saving for?">
          <TextField
            inSheet
            value={name}
            onChangeText={setName}
            placeholder="Emergency fund, new laptop, Japan trip…"
            maxLength={60}
          />
        </Field>

        <Field label="Target amount">
          <AmountInput value={target} onChangeText={setTarget} symbol={symbol} />
        </Field>

        <Field label="Target date">
          <DateField
            value={targetDate}
            onChange={setTargetDate}
            minimumDate={new Date()}
          />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
            {[3, 6, 12, 24].map((months) => (
              <Chip
                key={months}
                label={`${months} months`}
                onPress={() => {
                  const next = new Date();
                  next.setMonth(next.getMonth() + months);
                  setTargetDate(next);
                }}
              />
            ))}
          </View>
        </Field>

        <Field
          label="Note"
          hint="Progress comes from transactions linked to this goal — use Contribute on the goal card, or pick the goal when adding one."
        >
          <TextField
            inSheet
            value={description}
            onChangeText={setDescription}
            placeholder="Optional detail"
            maxLength={120}
          />
        </Field>

        <View style={{ height: space.sm }} />
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete goal?"
        message={`"${pendingDelete?.name}" will be removed. Linked transactions stay in your history.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}
