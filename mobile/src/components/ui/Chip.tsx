import { type StyleProp, type ViewStyle } from "react-native";
import Text from "./Text";
import PressableScale from "./PressableScale";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

interface Props {
  label: string;
  onPress: () => void;
  active?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Chip({ label, onPress, active, icon, style }: Props) {
  const { colors } = useTheme();

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          height: 34,
          paddingHorizontal: space.md,
          borderRadius: radius.full,
          borderWidth: 1,
          backgroundColor: active ? colors.accentSoft : colors.bgElevated,
          borderColor: active ? colors.accentRing : colors.border,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: fontSize.xs,
          color: active ? colors.accent : colors.textSecondary,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
