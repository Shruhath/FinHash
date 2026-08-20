import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import Text, { Overline } from "./Text";
import ProgressRing from "./ProgressRing";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

export interface OverviewFact {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface Props {
  /** 0–100 for the ring. */
  percentage: number;
  ringLabel: string;
  ringColor?: string;
  facts: OverviewFact[];
}

/**
 * Summary banner shared by Budget and Goals — a ring plus a row of facts, so
 * both screens carry the same rhythm.
 */
export default function Overview({ percentage, ringLabel, ringColor, facts }: Props) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(380)}
      style={{
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.borderLight,
        overflow: "hidden",
      }}
    >
      <LinearGradient
        colors={[colors.bgElevated, colors.bgCard]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.xl,
          padding: space.lg,
        }}
      >
        <ProgressRing value={percentage} size={100} thickness={10} color={ringColor}>
          <Text
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: fontSize.lg,
              color: colors.text,
            }}
          >
            {percentage.toFixed(0)}%
          </Text>
          <Overline>{ringLabel}</Overline>
        </ProgressRing>

        <View style={{ flex: 1, gap: space.md }}>
          {facts.map((fact) => (
            <View key={fact.label} style={{ gap: 1 }}>
              <Overline numberOfLines={1}>{fact.label}</Overline>
              {typeof fact.value === "string" ? (
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: fonts.numeric,
                    fontSize: fontSize.lg,
                    letterSpacing: -0.5,
                    color: colors.text,
                  }}
                >
                  {fact.value}
                </Text>
              ) : (
                fact.value
              )}
              {fact.hint ? (
                <Text variant="caption" tone="faint" numberOfLines={1}>
                  {fact.hint}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
