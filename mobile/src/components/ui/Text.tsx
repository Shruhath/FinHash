import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { fonts, fontSize, useTheme } from "@/theme";

type Variant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "bodyStrong"
  | "label"
  | "caption"
  | "overline"
  | "money"
  | "moneyLarge";

type Tone =
  | "default"
  | "secondary"
  | "muted"
  | "faint"
  | "accent"
  | "income"
  | "expense"
  | "warning"
  | "onAccent";

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
}

const VARIANTS: Record<
  Variant,
  { fontFamily: string; fontSize: number; letterSpacing?: number; lineHeight?: number }
> = {
  display: { fontFamily: fonts.displayHeavy, fontSize: fontSize["3xl"], letterSpacing: -1.4 },
  title: { fontFamily: fonts.displayBold, fontSize: fontSize["2xl"], letterSpacing: -0.9 },
  heading: { fontFamily: fonts.display, fontSize: fontSize.md, letterSpacing: -0.3 },
  body: { fontFamily: fonts.regular, fontSize: fontSize.base, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: fontSize.base, lineHeight: 21 },
  label: { fontFamily: fonts.medium, fontSize: fontSize.sm },
  caption: { fontFamily: fonts.regular, fontSize: fontSize.xs, lineHeight: 17 },
  overline: {
    fontFamily: fonts.bold,
    fontSize: fontSize["2xs"],
    letterSpacing: 0.8,
  },
  money: { fontFamily: fonts.numeric, fontSize: fontSize.base, letterSpacing: -0.4 },
  moneyLarge: { fontFamily: fonts.numeric, fontSize: fontSize["2xl"], letterSpacing: -1.2 },
};

export default function Text({
  variant = "body",
  tone = "default",
  style,
  ...rest
}: TextProps) {
  const { colors } = useTheme();

  const toneColor = {
    default: colors.text,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    faint: colors.textFaint,
    accent: colors.accent,
    income: colors.income,
    expense: colors.expense,
    warning: colors.warning,
    onAccent: colors.onAccent,
  }[tone];

  return (
    <RNText
      allowFontScaling
      maxFontSizeMultiplier={1.4}
      {...rest}
      style={[VARIANTS[variant], { color: toneColor }, style]}
    />
  );
}

/** Uppercase section label used above lists and inside summary cards. */
export function Overline({ style, ...rest }: TextProps) {
  return (
    <Text
      variant="overline"
      tone="muted"
      {...rest}
      style={[{ textTransform: "uppercase" }, style]}
    />
  );
}
