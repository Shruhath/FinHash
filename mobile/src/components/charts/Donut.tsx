import { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useTheme } from "@/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutSlice {
  key: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  /** Rendered in the hole — usually a total. */
  children?: React.ReactNode;
  /** Slice to lift; others dim. */
  activeKey?: string | null;
}

/**
 * Segments are drawn as dashed circle strokes rather than d3 arc paths, which
 * keeps the sweep animatable on the UI thread.
 */
export default function Donut({
  data,
  size = 188,
  thickness = 26,
  children,
  activeKey,
}: Props) {
  const { colors } = useTheme();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const gap = data.length > 1 ? 2.5 : 0;

  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = 0;
    sweep.value = withDelay(
      80,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [sweep, total, data.length]);

  let offsetAccumulator = 0;
  const segments = data.map((slice) => {
    const fraction = total > 0 ? slice.value / total : 0;
    const length = Math.max(0, fraction * circumference - gap);
    const rotation = (offsetAccumulator / circumference) * 360 - 90;
    offsetAccumulator += fraction * circumference;
    return { ...slice, length, rotation };
  });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.bgHover}
          strokeWidth={thickness}
          opacity={total > 0 ? 0 : 1}
        />
        {segments.map((segment) => (
          <Segment
            key={segment.key}
            segment={segment}
            size={size}
            radius={radius}
            thickness={thickness}
            circumference={circumference}
            sweep={sweep}
            dimmed={!!activeKey && activeKey !== segment.key}
          />
        ))}
      </Svg>
      <View style={{ alignItems: "center", justifyContent: "center" }}>{children}</View>
    </View>
  );
}

function Segment({
  segment,
  size,
  radius,
  thickness,
  circumference,
  sweep,
  dimmed,
}: {
  segment: { length: number; rotation: number; color: string };
  size: number;
  radius: number;
  thickness: number;
  circumference: number;
  sweep: SharedValue<number>;
  dimmed: boolean;
}) {
  const animatedProps = useAnimatedProps(() => ({
    strokeDasharray: [segment.length * sweep.value, circumference],
  }));

  // A plain SVG rotate keeps this valid on both native and the web build;
  // `<G rotation origin>` renders an invalid DOM attribute under react-native-web.
  return (
    <AnimatedCircle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill="none"
      stroke={segment.color}
      strokeWidth={thickness}
      strokeLinecap="butt"
      opacity={dimmed ? 0.25 : 1}
      transform={`rotate(${segment.rotation} ${size / 2} ${size / 2})`}
      animatedProps={animatedProps}
    />
  );
}
