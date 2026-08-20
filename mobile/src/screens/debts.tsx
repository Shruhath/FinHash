import { useMemo, useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  HandCoins,
  Plus,
  Trash2,
  TriangleAlert,
  Undo2,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { formatDayLabel, formatShortDate, initialsOf } from "@shared/format";
import Screen from "@/components/ui/Screen";
import AppHeader from "@/components/layout/AppHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Field from "@/components/ui/Field";
import Sheet from "@/components/ui/Sheet";
import Select from "@/components/ui/Select";
import TextField from "@/components/ui/TextField";
import AmountInput from "@/components/ui/AmountInput";
import SegmentedControl from "@/components/ui/SegmentedControl";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import PressableScale from "@/components/ui/PressableScale";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { haptic } from "@/lib/haptics";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type Debt = Doc<"debts">;

export default function DebtsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { format, symbol } = useCurrency();

  const debts = useQuery(api.debts.getDebts);
  const categories = useQuery(api.categories.getCategories) ?? [];
  const addDebt = useMutation(api.debts.addDebt);
  const updateDebt = useMutation(api.debts.updateDebt);
  const deleteDebt = useMutation(api.debts.deleteDebt);
  const markComplete = useMutation(api.debts.markComplete);
  const undoComplete = useMutation(api.debts.undoComplete);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [type, setType] = useState<"lent" | "borrowed">("lent");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [settling, setSettling] = useState<Debt | null>(null);
  const [settleCategory, setSettleCategory] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Debt | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const { toReceive, toPay, completed, totals } = useMemo(() => {
    const list = debts ?? [];
    const open = list.filter((debt) => !debt.isCompleted);
    const receive = open.filter((debt) => debt.type === "lent");
    const pay = open.filter((debt) => debt.type === "borrowed");
    return {
      toReceive: receive,
      toPay: pay,
      completed: list.filter((debt) => debt.isCompleted),
      totals: {
        receive: receive.reduce((sum, debt) => sum + debt.amount, 0),
        pay: pay.reduce((sum, debt) => sum + debt.amount, 0),
      },
    };
  }, [debts]);

  const net = totals.receive - totals.pay;

  const openCreate = () => {
    setEditing(null);
    setType("lent");
    setPerson("");
    setAmount("");
    setDescription("");
    setDueDate(null);
    setFormOpen(true);
  };

  const openEdit = (debt: Debt) => {
    setEditing(debt);
    setType(debt.type);
    setPerson(debt.personName);
    setAmount(String(debt.amount));
    setDescription(debt.description ?? "");
    setDueDate(debt.dueDate ? new Date(debt.dueDate) : null);
    setFormOpen(true);
  };

  const submit = async () => {
    const payload = {
      personName: person.trim(),
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      dueDate: dueDate ? dueDate.getTime() : undefined,
    };
    try {
      if (editing) {
        await updateDebt({ id: editing._id, ...payload });
        toast.success("Debt updated");
      } else {
        await addDebt({ type, ...payload });
        toast.success("Debt tracked");
      }
      haptic("success");
      setFormOpen(false);
    } catch {
      haptic("error");
      toast.error("Couldn't save that debt");
    }
  };

  const settle = async (recordAsTransaction: boolean) => {
    if (!settling) return;
    const debt = settling;
    setSettling(null);
    try {
      await markComplete({
        id: debt._id,
        recordAsTransaction,
        categoryId:
          recordAsTransaction && settleCategory
            ? (settleCategory as Id<"categories">)
            : undefined,
      });
      haptic("success");
      toast.success(`Settled with ${debt.personName}`);
    } catch {
      haptic("error");
      toast.error("Couldn't settle that debt");
    } finally {
      setSettleCategory("");
    }
  };

  const reopen = async (id: Id<"debts">) => {
    try {
      await undoComplete({ id });
      haptic("light");
      toast.success("Debt reopened");
    } catch {
      haptic("error");
      toast.error("Couldn't reopen that debt");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete._id;
    setPendingDelete(null);
    try {
      await deleteDebt({ id });
      haptic("success");
      toast.success("Debt removed");
    } catch {
      haptic("error");
      toast.error("Couldn't remove that debt");
    }
  };

  const onDateChange = (event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !next) return;
    setDueDate(next);
  };

  const settleCategories = categories.filter(
    (category) => category.type === (settling?.type === "lent" ? "income" : "expense")
  );

  return (
    <Screen header={<AppHeader title="Debts" />} withTabBar={false}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Debts & loans</Text>
        <Text variant="caption" tone="secondary">
          {debts
            ? `${toReceive.length + toPay.length} open · ${completed.length} settled`
            : "Loading…"}
        </Text>
      </View>

      <Button block label="Track debt" icon={<Plus size={16} color="#fff" />} onPress={openCreate} />

      {debts === undefined ? (
        <SkeletonCard lines={4} />
      ) : debts.length === 0 ? (
        <Card>
          <EmptyState
            icon={HandCoins}
            title="Nothing tracked yet"
            description="Keep tabs on money you've lent out or borrowed, and settle it in one tap."
            action={<Button label="Track a debt" size="sm" onPress={openCreate} />}
          />
        </Card>
      ) : (
        <>
          {toReceive.length + toPay.length > 0 ? (
            <Animated.View
              entering={FadeInDown.duration(380)}
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
                <View style={{ gap: 2 }}>
                  <Overline>{net >= 0 ? "Net owed to you" : "Net you owe"}</Overline>
                  <AnimatedNumber
                    value={Math.abs(net)}
                    format={format}
                    style={{
                      fontFamily: fonts.displayHeavy,
                      fontSize: 32,
                      letterSpacing: -1.5,
                      color: net >= 0 ? colors.income : colors.expense,
                    }}
                  />
                </View>

                <View style={{ flexDirection: "row", gap: space.md }}>
                  <SummaryTile
                    label="To receive"
                    value={format(totals.receive)}
                    tone="in"
                  />
                  <SummaryTile label="To pay" value={format(totals.pay)} tone="out" />
                </View>
              </LinearGradient>
            </Animated.View>
          ) : null}

          {toReceive.length > 0 ? (
            <DebtSection
              title="To receive"
              icon={<ArrowDownLeft size={14} color={colors.income} />}
              debts={toReceive}
              format={format}
              onEdit={openEdit}
              onSettle={setSettling}
            />
          ) : null}

          {toPay.length > 0 ? (
            <DebtSection
              title="To pay"
              icon={<ArrowUpRight size={14} color={colors.expense} />}
              debts={toPay}
              format={format}
              onEdit={openEdit}
              onSettle={setSettling}
            />
          ) : null}

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
                  Settled ({completed.length})
                </Text>
                <ChevronDown
                  size={16}
                  color={colors.textMuted}
                  style={{ transform: [{ rotate: showCompleted ? "180deg" : "0deg" }] }}
                />
              </PressableScale>

              {showCompleted ? (
                <Card flush>
                  {completed.map((debt, index) => (
                    <View
                      key={debt._id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: space.md,
                        padding: space.md,
                        opacity: 0.65,
                        borderBottomWidth: index === completed.length - 1 ? 0 : 1,
                        borderBottomColor: colors.border,
                      }}
                    >
                      <PersonAvatar name={debt.personName} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text variant="bodyStrong" numberOfLines={1}>
                          {debt.personName}
                        </Text>
                        <Text variant="caption" tone="muted">
                          {debt.type === "lent" ? "Received" : "Paid"}
                          {debt.completedDate ? ` · ${formatDayLabel(debt.completedDate)}` : ""}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: fonts.numeric, fontSize: fontSize.sm }}>
                        {format(debt.amount)}
                      </Text>
                      <IconButton
                        accessibilityLabel="Reopen"
                        size={32}
                        icon={<Undo2 size={15} color={colors.textSecondary} />}
                        onPress={() => reopen(debt._id)}
                      />
                      <IconButton
                        accessibilityLabel="Delete"
                        size={32}
                        icon={<Trash2 size={15} color={colors.danger} />}
                        onPress={() => setPendingDelete(debt)}
                      />
                    </View>
                  ))}
                </Card>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      {/* ---------- Add / edit ---------- */}
      <Sheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Edit debt" : "Track a debt"}
        footer={
          <>
            {editing ? (
              <Button
                label="Delete"
                variant="danger"
                icon={<Trash2 size={16} color={colors.danger} />}
                onPress={() => {
                  const target = editing;
                  setFormOpen(false);
                  setPendingDelete(target);
                }}
              />
            ) : null}
            <Button
              block
              style={{ flex: 1 }}
              label={editing ? "Save changes" : "Track it"}
              disabled={!person.trim() || !amount}
              onPress={submit}
            />
          </>
        }
      >
        {!editing ? (
          <SegmentedControl
            segments={[
              { value: "lent", label: "I lent out" },
              { value: "borrowed", label: "I borrowed" },
            ]}
            value={type}
            onChange={setType}
          />
        ) : null}

        <Field label="Person">
          <TextField
            inSheet
            value={person}
            onChangeText={setPerson}
            placeholder="Who is it with?"
            maxLength={60}
          />
        </Field>

        <Field label="Amount">
          <AmountInput value={amount} onChangeText={setAmount} symbol={symbol} />
        </Field>

        <Field label="What for?">
          <TextField
            inSheet
            value={description}
            onChangeText={setDescription}
            placeholder="Optional note"
            maxLength={120}
          />
        </Field>

        <Field label="Due date">
          <View style={{ flexDirection: "row", gap: space.sm }}>
            <Button
              block
              style={{ flex: 1 }}
              variant="secondary"
              label={dueDate ? dueDate.toLocaleDateString() : "No due date"}
              icon={<CalendarDays size={15} color={colors.textSecondary} />}
              onPress={() => setShowPicker(true)}
            />
            {dueDate ? (
              <Button label="Clear" variant="ghost" onPress={() => setDueDate(null)} />
            ) : null}
          </View>
          {showPicker ? (
            <View>
              <DateTimePicker
                value={dueDate ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onDateChange}
                themeVariant={colors.bg === "#000000" ? "dark" : "light"}
                accentColor={colors.accent}
              />
              {Platform.OS === "ios" ? (
                <Button label="Done" variant="ghost" onPress={() => setShowPicker(false)} />
              ) : null}
            </View>
          ) : null}
        </Field>

        <View style={{ height: space.sm }} />
      </Sheet>

      {/* ---------- Settle ---------- */}
      <Sheet
        open={!!settling}
        onClose={() => setSettling(null)}
        title="Settle this debt"
        description={
          settling ? `${format(settling.amount)} with ${settling.personName}` : undefined
        }
        snapPoint="52%"
      >
        <Text variant="body" tone="secondary">
          Want this recorded as {settling?.type === "lent" ? "an income" : "an expense"}{" "}
          transaction too?
        </Text>

        <Field label="Category for the transaction">
          <Select
            value={settleCategory}
            onChange={setSettleCategory}
            placeholder="Auto-pick"
            options={[
              { value: "", label: "Auto-pick" },
              ...settleCategories.map((category) => ({
                value: category._id as string,
                label: category.name,
              })),
            ]}
          />
        </Field>

        <View style={{ gap: space.sm }}>
          <Button block label="Settle & record" onPress={() => settle(true)} />
          <Button
            block
            variant="secondary"
            label="Just mark settled"
            onPress={() => settle(false)}
          />
        </View>
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete this record?"
        message={`The debt with ${pendingDelete?.personName} will be removed permanently.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Screen>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
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
      <Text
        numberOfLines={1}
        style={{
          fontFamily: fonts.numeric,
          fontSize: fontSize.lg,
          color: tone === "in" ? colors.income : colors.expense,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function PersonAvatar({ name, tone }: { name: string; tone?: "in" | "out" }) {
  const { colors } = useTheme();
  const background =
    tone === "in" ? colors.successSoft : tone === "out" ? colors.dangerSoft : colors.bgHover;
  const foreground =
    tone === "in" ? colors.success : tone === "out" ? colors.danger : colors.textSecondary;

  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: background,
      }}
    >
      <Text style={{ fontFamily: fonts.displayBold, fontSize: fontSize.xs, color: foreground }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}

function DebtSection({
  title,
  icon,
  debts,
  format,
  onEdit,
  onSettle,
}: {
  title: string;
  icon: React.ReactNode;
  debts: Debt[];
  format: (value: number) => string;
  onEdit: (debt: Debt) => void;
  onSettle: (debt: Debt) => void;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
        {icon}
        <Overline>{title}</Overline>
      </View>

      <Card flush>
        {debts.map((debt, index) => {
          const overdue = debt.dueDate ? debt.dueDate < Date.now() : false;
          return (
            <PressableScale
              key={debt._id}
              onPress={() => onEdit(debt)}
              scaleTo={0.985}
              style={{
                borderBottomWidth: index === debts.length - 1 ? 0 : 1,
                borderBottomColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.md,
                  padding: space.md,
                }}
              >
                <PersonAvatar name={debt.personName} tone={debt.type === "lent" ? "in" : "out"} />

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {debt.personName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text variant="caption" tone="muted" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {debt.description || (debt.type === "lent" ? "Lent out" : "Borrowed")}
                    </Text>
                    {debt.dueDate ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 3,
                          paddingHorizontal: 7,
                          paddingVertical: 1,
                          borderRadius: radius.full,
                          backgroundColor: overdue ? colors.dangerSoft : colors.bgHover,
                        }}
                      >
                        {overdue ? (
                          <TriangleAlert size={10} color={colors.danger} />
                        ) : (
                          <CalendarClock size={10} color={colors.textMuted} />
                        )}
                        <Text
                          variant="caption"
                          tone={overdue ? "expense" : "muted"}
                          style={{ fontFamily: fonts.semibold }}
                        >
                          {overdue ? "Overdue" : formatShortDate(debt.dueDate)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                <Text
                  style={{
                    fontFamily: fonts.numeric,
                    fontSize: fontSize.base,
                    color: debt.type === "lent" ? colors.income : colors.expense,
                  }}
                >
                  {format(debt.amount)}
                </Text>

                <IconButton
                  accessibilityLabel={`Settle debt with ${debt.personName}`}
                  tone="success"
                  size={34}
                  icon={<Check size={16} color={colors.success} />}
                  onPress={() => onSettle(debt)}
                />
              </View>
            </PressableScale>
          );
        })}
      </Card>
    </View>
  );
}
