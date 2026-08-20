import { ScrollView, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";
import Text, { Overline } from "./Text";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

export interface Stat {
  icon: LucideIcon;
  label: string;
  value: string;
}

/**
 * Fixed-width tiles so every card matches regardless of label length, with
 * horizontal scroll once they overflow.
 */
export default function StatStrip({ stats }: { stats: Stat[] }) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: space.sm }}
      snapToInterval={132 + space.sm}
      decelerationRate="fast"
    >
      {stats.map((stat, index) => (
        <Animated.View
          key={stat.label}
          entering={FadeInRight.delay(index * 50).duration(320)}
          style={{
            width: 132,
            gap: 2,
            padding: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.bgCard,
          }}
        >
          <View style={{ marginBottom: 2 }}>
            <stat.icon size={15} color={colors.accent} />
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.numeric,
              fontSize: fontSize.md,
              color: colors.text,
            }}
          >
            {stat.value}
          </Text>
          <Overline numberOfLines={1}>{stat.label}</Overline>
        </Animated.View>
      ))}
    </ScrollView>
  );
}
