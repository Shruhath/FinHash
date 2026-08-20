import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Text from "./Text";
import { space } from "@/theme";

interface Props {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={{ gap: space.md }}>
      <View style={{ gap: 2 }}>
        <Text variant="title">{title}</Text>
        {subtitle ? (
          <Text variant="caption" tone="secondary">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions ? (
        <View style={{ flexDirection: "row", gap: space.sm }}>{actions}</View>
      ) : null}
    </Animated.View>
  );
}
