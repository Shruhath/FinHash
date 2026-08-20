import { View } from "react-native";
import { resolveCategoryIcon } from "@/lib/categoryIcons";
import { radius } from "@/theme";

interface Props {
  name?: string;
  color: string;
  size?: number;
  tile?: boolean;
  tileSize?: number;
}

/** Tinted tile + glyph, matching the web app's category chips. */
export default function CategoryIcon({
  name,
  color,
  size = 18,
  tile = true,
  tileSize = 40,
}: Props) {
  const Glyph = resolveCategoryIcon(name);

  if (!tile) return <Glyph size={size} color={color} strokeWidth={2} />;

  return (
    <View
      style={{
        width: tileSize,
        height: tileSize,
        borderRadius: radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}1f`,
        borderWidth: 1,
        borderColor: `${color}2e`,
      }}
    >
      <Glyph size={size} color={color} strokeWidth={2} />
    </View>
  );
}
