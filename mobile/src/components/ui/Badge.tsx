import { View, type StyleProp, type ViewStyle } from "react-native";
import Text from "./Text";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

interface Props {
  label: string;
  tone?: Tone;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({ label, tone = "neutral", icon, style }: Props) {
  const { colors } = useTheme();

  const palette: Record<Tone, { bg: string; fg: string }> = {
    neutral: { bg: colors.bgHover, fg: colors.textMuted },
    accent: { bg: colors.accentSoft, fg: colors.accent },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          alignSelf: "flex-start",
          paddingHorizontal: space.sm,
          paddingVertical: 3,
          borderRadius: radius.full,
          backgroundColor: palette[tone].bg,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: fontSize["2xs"],
          letterSpacing: 0.4,
          color: palette[tone].fg,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
