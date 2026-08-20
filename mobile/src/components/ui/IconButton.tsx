import { type StyleProp, type ViewStyle } from "react-native";
import PressableScale from "./PressableScale";
import { radius, useTheme } from "@/theme";

interface Props {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "default" | "danger" | "success";
  size?: number;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  tone = "default",
  size = 38,
  bordered,
  style,
}: Props) {
  const { colors } = useTheme();
  const background = {
    default: "transparent",
    danger: colors.dangerSoft,
    success: colors.successSoft,
  }[tone];

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.sm,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: background,
          borderWidth: bordered ? 1 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {icon}
    </PressableScale>
  );
}
