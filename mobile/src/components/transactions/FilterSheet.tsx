import { View } from "react-native";
import type { Doc } from "@convex/_generated/dataModel";
import Sheet from "../ui/Sheet";
import Button from "../ui/Button";
import Field from "../ui/Field";
import Chip from "../ui/Chip";
import Select from "../ui/Select";
import DateField from "../ui/DateField";
import SegmentedControl from "../ui/SegmentedControl";
import { space } from "@/theme";

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

      <Field label="From">
        <DateField
          value={startDate}
          onChange={onStartDate}
          placeholder="Any start date"
          trailing={
            startDate ? (
              <Button label="Clear" variant="ghost" onPress={() => onStartDate(null)} />
            ) : undefined
          }
        />
      </Field>

      <Field label="To">
        <DateField
          value={endDate}
          onChange={onEndDate}
          placeholder="Any end date"
          minimumDate={startDate ?? undefined}
          trailing={
            endDate ? (
              <Button label="Clear" variant="ghost" onPress={() => onEndDate(null)} />
            ) : undefined
          }
        />
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
