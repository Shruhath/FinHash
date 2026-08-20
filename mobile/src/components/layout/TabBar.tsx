import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import {
  ArrowLeftRight,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";
import Text from "../ui/Text";
import PressableScale from "../ui/PressableScale";
import { accentShadow, brand, fonts, fontSize, layout, radius, springs, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";
import { useAddTransaction } from "@/providers/AddTransactionProvider";

const ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  index: { icon: LayoutGrid, label: "Home" },
  transactions: { icon: ArrowLeftRight, label: "History" },
  budget: { icon: Wallet, label: "Budget" },
  more: { icon: MoreHorizontal, label: "More" },
};

/**
 * Four routes plus a centre action button. Rendered as a translucent bar so
 * content scrolls visibly underneath it.
 */
export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { openAdd } = useAddTransaction();

  const routes = state.routes.filter((route) => ICONS[route.name]);
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = state.routes.findIndex((r) => r.key === route.key);
    const focused = state.index === index;
    const config = ICONS[route.name]!;

    return (
      <Tab
        key={route.key}
        icon={config.icon}
        label={config.label}
        focused={focused}
        onPress={() => {
          haptic("light");
          if (!focused) navigation.navigate(route.name);
        }}
      />
    );
  };

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        overflow: "hidden",
      }}
    >
      <BlurView
        intensity={isDark ? 34 : 60}
        tint={isDark ? "dark" : "light"}
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: layout.tabBarHeight + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.glass,
        }}
      >
        {left.map(renderTab)}

        <View style={{ width: 74, alignItems: "center", justifyContent: "center" }}>
          <PressableScale
            onPress={() => openAdd()}
            feedback="medium"
            scaleTo={0.88}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
            style={[
              {
                width: layout.fabSize,
                height: layout.fabSize,
                borderRadius: radius.lg,
                marginTop: -20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.16)",
              },
              accentShadow(),
            ]}
          >
            <LinearGradient
              colors={[brand.orange400, brand.orange500]}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
            >
              <Plus size={24} color="#fff" strokeWidth={2.6} />
            </LinearGradient>
          </PressableScale>
        </View>

        {right.map(renderTab)}
      </BlurView>
    </View>
  );
}

function Tab({
  icon: Icon,
  label,
  focused,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const glow = useSharedValue(focused ? 1 : 0);
  glow.value = withSpring(focused ? 1 : 0, springs.snappy);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.2 }],
  }));

  return (
    <PressableScale
      onPress={onPress}
      feedback={null}
      scaleTo={0.92}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }}
    >
      <View style={{ width: 46, height: 28, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              inset: 0,
              borderRadius: radius.full,
              backgroundColor: colors.accentSoft,
            },
            glowStyle,
          ]}
        />
        <Icon
          size={21}
          color={focused ? colors.accent : colors.textMuted}
          strokeWidth={focused ? 2.4 : 2}
        />
      </View>
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: fontSize["2xs"],
          color: focused ? colors.accent : colors.textMuted,
        }}
      >
        {label}
      </Text>
    </PressableScale>
  );
}
