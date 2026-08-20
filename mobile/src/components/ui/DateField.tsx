import { useState } from "react";
import { Platform, View } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import Button from "./Button";
import { space, useTheme } from "@/theme";

export interface DateFieldProps {
  value: Date | null;
  onChange: (value: Date) => void;
  mode?: "date" | "datetime";
  /** Shown when `value` is null. */
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Rendered next to the trigger — usually a "clear" action. */
  trailing?: React.ReactNode;
}

function label(value: Date | null, mode: "date" | "datetime", placeholder: string) {
  if (!value) return placeholder;
  return mode === "datetime"
    ? value.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : value.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

/**
 * Wraps the platform picker so screens don't each repeat the
 * open/dismiss/"Done" dance that iOS and Android need differently.
 */
export default function DateField({
  value,
  onChange,
  mode = "date",
  placeholder = "Pick a date",
  minimumDate,
  maximumDate,
  trailing,
}: DateFieldProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (event: DateTimePickerEvent, next?: Date) => {
    // Android's dialog closes itself; iOS keeps an inline picker mounted.
    if (Platform.OS === "android") setOpen(false);
    if (event.type === "dismissed" || !next) return;
    onChange(next);
  };

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: space.sm }}>
        <Button
          block
          style={{ flex: 1 }}
          variant="secondary"
          label={label(value, mode, placeholder)}
          icon={<CalendarDays size={16} color={colors.textSecondary} />}
          onPress={() => setOpen(true)}
        />
        {trailing}
      </View>

      {open ? (
        <View>
          <DateTimePicker
            value={value ?? new Date()}
            mode={mode}
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant={colors.bg === "#000000" ? "dark" : "light"}
            accentColor={colors.accent}
          />
          {Platform.OS === "ios" ? (
            <Button label="Done" variant="ghost" onPress={() => setOpen(false)} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
