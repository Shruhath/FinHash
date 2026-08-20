import { useState } from "react";
import { LayoutChangeEvent, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Text from "./Text";
import { brand, fonts, fontSize, radius, springs, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

/** iOS-style tab switcher with a spring-animated selection pill. */
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  size = "md",
  style,
}: Props<T>) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const offset = useSharedValue(0);

  const padding = 4;
  const height = size === "sm" ? 30 : 36;
  const itemWidth = trackWidth > 0 ? (trackWidth - padding * 2) / segments.length : 0;
  const activeIndex = Math.max(0, segments.findIndex((s) => s.value === value));

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setTrackWidth(width);
    const nextItemWidth = (width - padding * 2) / segments.length;
    // Position without animating on first measure, so it doesn't fly in.
    offset.value = activeIndex * nextItemWidth;
  };

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: "row",
          padding,
          height: height + padding * 2,
          borderRadius: radius.md,
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        style,
      ]}
    >
      {itemWidth > 0 ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: padding,
              left: padding,
              width: itemWidth,
              height,
              borderRadius: radius.xs,
              overflow: "hidden",
            },
            pillStyle,
          ]}
        >
          <LinearGradient
            colors={[brand.orange400, brand.orange500]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}

      {segments.map((segment, index) => {
        const active = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={segment.label}
            onPress={() => {
              if (active) return;
              haptic("light");
              offset.value = withSpring(index * itemWidth, springs.snappy);
              onChange(segment.value);
            }}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", height }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.semibold,
                fontSize: size === "sm" ? fontSize.xs : fontSize.sm,
                color: active ? colors.onAccent : colors.textSecondary,
              }}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
