import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { radius, useTheme } from "@/theme";

export type ProgressTone = "accent" | "safe" | "warning" | "danger" | "exceeded";

interface Props {
  /** 0–100; anything above stays pinned at full width. */
  value: number;
  tone?: ProgressTone;
  height?: number;
  /** Delays the fill so it animates after the card has settled. */
  delay?: number;
}

const GRADIENTS: Record<ProgressTone, [string, string]> = {
  accent: ["#f5782a", "#cc5500"],
  safe: ["#3ad47c", "#2fbf6b"],
  warning: ["#ffbe4d", "#f0a020"],
  danger: ["#ff6f63", "#f0483c"],
  exceeded: ["#ff6f63", "#f0483c"],
};

export default function ProgressBar({
  value,
  tone = "accent",
  height = 8,
  delay = 0,
}: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const target = Math.max(0, Math.min(100, value));

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(target, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [target, delay, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(target) }}
      style={{
        height,
        borderRadius: radius.full,
        backgroundColor: colors.bgHover,
        overflow: "hidden",
      }}
    >
      <Animated.View style={[{ height: "100%" }, animatedStyle]}>
        <LinearGradient
          colors={GRADIENTS[tone]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1, borderRadius: radius.full }}
        />
      </Animated.View>
    </View>
  );
}
