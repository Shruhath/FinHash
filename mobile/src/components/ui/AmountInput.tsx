import { useState } from "react";
import { View } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Text from "./Text";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  symbol: string;
  /** Tints the figure green for income entries. */
  tone?: "expense" | "income";
  autoFocus?: boolean;
}

/** The oversized numeric field at the top of the add/edit sheets. */
export default function AmountInput({
  value,
  onChangeText,
  symbol,
  tone = "expense",
  autoFocus,
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const accent = tone === "income" ? colors.income : colors.accent;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.sm,
        paddingVertical: space.lg,
        paddingHorizontal: space.md,
        borderRadius: radius.lg,
        borderWidth: 1,
        backgroundColor: colors.bgCard,
        borderColor: focused ? accent : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.numericSemi,
          fontSize: fontSize.xl,
          color: colors.textMuted,
        }}
      >
        {symbol}
      </Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={(next) => onChangeText(next.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={colors.textFaint}
        selectionColor={accent}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel="Amount"
        style={{
          flexGrow: 0,
          flexShrink: 1,
          minWidth: 120,
          textAlign: "center",
          fontFamily: fonts.numeric,
          fontSize: fontSize["3xl"],
          letterSpacing: -1.5,
          color: tone === "income" ? colors.income : colors.text,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}
