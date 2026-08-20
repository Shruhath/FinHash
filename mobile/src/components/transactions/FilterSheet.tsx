import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import type { Doc } from "@convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Chip from "../ui/Chip";
import Select from "../ui/Select";
import SegmentedControl from "../ui/SegmentedControl";
import { space, useTheme } from "@/theme";

export type TypeFilter = "all" | "income" | "expense";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Doc<"categories">[];
  typeFilter: TypeFilter;
  onTypeFilter: (value: TypeFilter) => void;
  categoryFilter: string;
  onCategoryFilter: (value: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDate: (value: Date | null) => void;
  onEndDate: (value: Date | null) => void;
  onReset: () => void;
}

const DAY = 86_400_000;

export default function FilterSheet({
  open,
  onClose,
  categories,
  typeFilter,
  onTypeFilter,
  categoryFilter,
  onCategoryFilter,
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  onReset,
}: Props) {
  const { colors } = useTheme();
  const [picking, setPicking] = useState<"start" | "end" | null>(null);

  const onDateChange = (event: DateTimePickerEvent, next?: Date) => {
    const target = picking;
    if (Platform.OS === "android") setPicking(null);
    if (event.type === "dismissed" || !next || !target) return;
    if (target === "start") onStartDate(next);
    else onEndDate(next);
  };

  const applyRange = (days: number) => {
    const end = new Date();
    const start =
      days === 0
        ? new Date(end.getFullYear(), end.getMonth(), 1)
        : new Date(Date.now() - days * DAY);
    onStartDate(start);
    onEndDate(end);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      snapPoint="76%"
      footer={
        <>
          <Button
            label="Reset"
            variant="ghost"
            onPress={() => {
              onReset();
              onClose();
            }}
          />
          <Button block style={{ flex: 1 }} label="Show results" onPress={onClose} />
        </>
      }
    >
      <Field label="Type">
        <SegmentedControl
          segments={[
            { value: "all", label: "All" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expense" },
          ]}
          value={typeFilter}
          onChange={onTypeFilter}
        />
      </Field>

      <Field label="Category">
        <Select
          value={categoryFilter}
          onChange={onCategoryFilter}
          placeholder="All categories"
          options={[
            { value: "", label: "All categories" },
            ...categories
              .filter((category) => typeFilter === "all" || category.type === typeFilter)
              .map((category) => ({
                value: category._id as string,
                label: category.name,
              })),
          ]}
        />
      </Field>

      <Field label="Date range">
        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button
            style={{ flex: 1 }}
            block
            variant="secondary"
            label={startDate ? startDate.toLocaleDateString() : "From"}
            icon={<CalendarDays size={15} color={colors.textSecondary} />}
            onPress={() => setPicking("start")}
          />
          <Button
            style={{ flex: 1 }}
            block
            variant="secondary"
            label={endDate ? endDate.toLocaleDateString() : "To"}
            icon={<CalendarDays size={15} color={colors.textSecondary} />}
            onPress={() => setPicking("end")}
          />
        </View>

        {picking ? (
          <View>
            <DateTimePicker
              value={(picking === "start" ? startDate : endDate) ?? new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "inline" : "default"}
              onChange={onDateChange}
              themeVariant={colors.bg === "#000000" ? "dark" : "light"}
              accentColor={colors.accent}
            />
            {Platform.OS === "ios" ? (
              <Button label="Done" variant="ghost" onPress={() => setPicking(null)} />
            ) : null}
          </View>
        ) : null}
      </Field>

      <Field label="Quick ranges">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
          {[
            { label: "This month", days: 0 },
            { label: "Last 7 days", days: 7 },
            { label: "Last 30 days", days: 30 },
            { label: "Last 90 days", days: 90 },
          ].map((range) => (
            <Chip key={range.label} label={range.label} onPress={() => applyRange(range.days)} />
          ))}
        </View>
      </Field>
    </Sheet>
  );
}
