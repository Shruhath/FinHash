import { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { radius, space, useTheme } from "@/theme";

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Removes inner padding for lists that draw their own rows. */
  flush?: boolean;
  padded?: keyof typeof space;
}

export default function Card({ children, style, flush, padded = "lg" }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: flush ? 0 : space[padded],
          overflow: "hidden",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
