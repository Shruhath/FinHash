import { ReactNode, useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Text from "./Text";
import { radius, space, springs, useTheme } from "@/theme";

interface Props {
  value: boolean;
  onValueChange: (value: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
}

/** Labelled toggle row used for split mode and recurring budgets. */
export default function Switch({
  value,
  onValueChange,
  title,
  description,
  icon,
}: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(value ? 1 : 0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(value ? 18 : 0, springs.snappy) }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.bgHover, colors.accent]
    ),
  }));

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, progress]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={title}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        padding: space.md,
        borderRadius: radius.md,
        borderWidth: 1,
        backgroundColor: value ? colors.accentSofter : colors.bgCard,
        borderColor: value ? colors.accentRing : colors.border,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong">{title}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>

      <Animated.View
        style={[
          { width: 42, height: 24, borderRadius: radius.full, padding: 3 },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: 18,
              height: 18,
              borderRadius: radius.full,
              backgroundColor: "#fff",
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
