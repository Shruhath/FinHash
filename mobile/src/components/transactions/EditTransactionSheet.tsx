import { useEffect, useMemo, useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery } from "convex/react";
import { CalendarDays, Trash2 } from "lucide-react-native";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import Button from "../ui/Button";
import Field from "../ui/Field";
import TextField from "../ui/TextField";
import AmountInput from "../ui/AmountInput";
import SegmentedControl from "../ui/SegmentedControl";
import CategoryPicker from "./CategoryPicker";
import { useToast } from "../ui/Toast";
import { useCurrency } from "@/hooks/useCurrency";
import { haptic } from "@/lib/haptics";
import { space, useTheme } from "@/theme";

interface Props {
  transaction: Doc<"transactions"> | null;
  onClose: () => void;
  /** Surfaced as a destructive action in the footer. */
  onDelete?: (transaction: Doc<"transactions">) => void;
}

export default function EditTransactionSheet({ transaction, onClose, onDelete }: Props) {
  const { colors } = useTheme();
  const toast = useToast();
  const { symbol } = useCurrency();

  const categories = useQuery(api.categories.getCategories) ?? [];
  const editTransaction = useMutation(api.transactions.editTransaction);

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!transaction) return;
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setCategoryId(transaction.categoryId);
    setDescription(transaction.description ?? "");
    setDate(new Date(transaction.date));
    setSaving(false);
    setShowPicker(false);
  }, [transaction]);

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type]
  );

  const submit = async () => {
    if (!transaction || saving) return;
    setSaving(true);
    try {
      await editTransaction({
        id: transaction._id,
        amount: parseFloat(amount),
        type,
        categoryId: categoryId as Id<"categories">,
        date: date.getTime(),
        description: description.trim() || undefined,
      });
      haptic("success");
      toast.success("Transaction updated");
      onClose();
    } catch {
      haptic("error");
      toast.error("Couldn't update that transaction");
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !next) return;
    setDate(next);
  };

  return (
    <Sheet
      open={!!transaction}
      onClose={onClose}
      title="Edit transaction"
      footer={
        <>
          {onDelete && transaction ? (
            <Button
              label="Delete"
              variant="danger"
              icon={<Trash2 size={16} color={colors.danger} />}
              onPress={() => onDelete(transaction)}
            />
          ) : (
            <Button label="Cancel" variant="ghost" onPress={onClose} />
          )}
          <Button
            block
            style={{ flex: 1 }}
            label={saving ? "Saving…" : "Save changes"}
            loading={saving}
            disabled={!amount || !categoryId}
            onPress={submit}
          />
        </>
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
          const stillValid = categories.find(
            (category) => category._id === categoryId && category.type === next
          );
          if (!stillValid) setCategoryId("");
        }}
      />

      <AmountInput value={amount} onChangeText={setAmount} symbol={symbol} tone={type} />

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
        />
      </Field>

      <Field label="Date & time">
        <Button
          label={date.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
          variant="secondary"
          block
          icon={<CalendarDays size={16} color={colors.textSecondary} />}
          onPress={() => setShowPicker(true)}
        />
        {showPicker ? (
          <View>
            <DateTimePicker
              value={date}
              mode="datetime"
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
  );
}
