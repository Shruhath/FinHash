import { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Overline } from "./Text";
import Text from "./Text";
import { space } from "@/theme";

interface Props {
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Field({ label, hint, error, children, style }: Props) {
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? <Overline>{label}</Overline> : null}
      {children}
      {error ? (
        <Text variant="caption" tone="expense">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted" style={{ lineHeight: 17 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Row of chips/inputs that scrolls sideways inside a sheet. */
export function FieldRow({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
      {children}
    </View>
  );
}
