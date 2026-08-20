import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LogoMark } from "../ui/Logo";
import Text from "../ui/Text";
import { radius, space, useTheme } from "@/theme";

/** Brand hold shown while auth and the user record resolve. */
export default function SplashScreen({ label }: { label?: string }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.9);
  const slide = useSharedValue(-1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    slide.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      false
    );
  }, [pulse, slide]);

  const markStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.55 + (pulse.value - 0.9) * 4.5,
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value * 120 }],
  }));

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: space.xl,
        backgroundColor: colors.bg,
      }}
    >
      <Animated.View style={markStyle}>
        <LogoMark size={72} />
      </Animated.View>

      <View
        style={{
          width: 120,
          height: 3,
          borderRadius: radius.full,
          backgroundColor: colors.bgHover,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={[
            { width: 60, height: "100%", borderRadius: radius.full, backgroundColor: colors.accent },
            barStyle,
          ]}
        />
      </View>

      {label ? (
        <Text variant="caption" tone="muted">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
