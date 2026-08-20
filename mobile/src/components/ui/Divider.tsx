import { View } from "react-native";
import { useTheme } from "@/theme";

export default function Divider({ inset = 0 }: { inset?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{ height: 1, backgroundColor: colors.border, marginLeft: inset }}
    />
  );
}
