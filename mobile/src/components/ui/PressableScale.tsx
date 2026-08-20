import { ReactNode, useCallback } from "react";
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { springs } from "@/theme";
import { haptic } from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, "style"> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while held. */
  scaleTo?: number;
  /** Fires a tap impact on press-in; pass null to stay silent. */
  feedback?: "light" | "medium" | null;
}

/**
 * The app's standard press affordance: a spring scale plus haptic tick.
 * Everything tappable that isn't a plain list row uses this.
 */
export default function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  feedback = "light",
  onPressIn,
  disabled,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback<NonNullable<PressableProps["onPressIn"]>>(
    (event) => {
      scale.value = withSpring(scaleTo, springs.snappy);
      if (feedback) haptic(feedback);
      onPressIn?.(event);
    },
    [scale, scaleTo, feedback, onPressIn]
  );

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={() => {
        scale.value = withSpring(1, springs.snappy);
      }}
      style={[style, animatedStyle, disabled ? { opacity: 0.5 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
