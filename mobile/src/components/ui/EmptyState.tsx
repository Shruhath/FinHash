import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";
import Text from "./Text";
import { radius, space, useTheme } from "@/theme";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  const { colors } = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(360)}
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: space.md,
        paddingVertical: space["3xl"],
        paddingHorizontal: space.lg,
      }}
    >
      <Animated.View
        entering={ZoomIn.springify().damping(16)}
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.xl,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.accentSoft,
          marginBottom: space.xs,
        }}
      >
        <Icon size={28} color={colors.accent} strokeWidth={1.75} />
      </Animated.View>

      <Text variant="heading" style={{ textAlign: "center" }}>
        {title}
      </Text>

      {description ? (
        <Text
          variant="caption"
          tone="muted"
          style={{ textAlign: "center", maxWidth: 300 }}
        >
          {description}
        </Text>
      ) : null}

      {action ? <View style={{ marginTop: space.sm }}>{action}</View> : null}
    </Animated.View>
  );
}
