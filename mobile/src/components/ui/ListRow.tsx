import { ReactNode } from "react";
import { View } from "react-native";
import PressableScale from "./PressableScale";
import Text from "./Text";
import { space, useTheme } from "@/theme";

interface Props {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Hides the hairline on the final row of a group. */
  last?: boolean;
}

/** The shared transaction/debt row shape: icon, two lines, trailing value. */
export default function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  last,
}: Props) {
  const { colors } = useTheme();

  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.md,
        paddingVertical: space.md,
        paddingHorizontal: space.lg,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}
    >
      {leading}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );

  if (!onPress) return body;

  return (
    <PressableScale onPress={onPress} scaleTo={0.985} feedback="light">
      {body}
    </PressableScale>
  );
}
