import { View } from "react-native";
import { CalendarDays } from "lucide-react-native";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";
import type { DateFieldProps } from "./DateField";

function toInputValue(value: Date | null, mode: "date" | "datetime") {
  if (!value) return "";
  const local = new Date(value);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  const iso = local.toISOString();
  return mode === "datetime" ? iso.slice(0, 16) : iso.slice(0, 10);
}

/**
 * Web build: the native module has no DOM implementation, so this falls back
 * to the browser's own date input. Only used by the preview build.
 */
export default function DateField({
  value,
  onChange,
  mode = "date",
  placeholder = "Pick a date",
  trailing,
}: DateFieldProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          height: 46,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.bgElevated,
        }}
      >
        <CalendarDays size={16} color={colors.textSecondary} />
        <input
          type={mode === "datetime" ? "datetime-local" : "date"}
          value={toInputValue(value, mode)}
          placeholder={placeholder}
          onChange={(event: { target: { value: string } }) => {
            const next = new Date(event.target.value);
            if (!Number.isNaN(next.getTime())) onChange(next);
          }}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: colors.text,
            fontFamily: fonts.regular,
            fontSize: fontSize.base,
          }}
        />
      </View>
      {trailing}
    </View>
  );
}
