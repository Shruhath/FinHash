import { View } from "react-native";
import type { Doc } from "@convex/_generated/dataModel";
import Text from "../ui/Text";
import PressableScale from "../ui/PressableScale";
import CategoryIcon from "../ui/CategoryIcon";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

interface Props {
  categories: Doc<"categories">[];
  value: string;
  onChange: (id: string) => void;
}

/** Three-across grid of tinted category tiles. */
export default function CategoryPicker({ categories, value, onChange }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
      {categories.map((category) => {
        const active = category._id === value;
        return (
          <PressableScale
            key={category._id}
            onPress={() => onChange(category._id)}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={category.name}
            style={{
              width: "31.5%",
              alignItems: "center",
              gap: 6,
              paddingVertical: space.md,
              paddingHorizontal: 4,
              borderRadius: radius.md,
              borderWidth: 1,
              backgroundColor: active ? colors.bgElevated : colors.bgCard,
              borderColor: active ? category.color : colors.border,
            }}
          >
            <CategoryIcon
              name={category.icon}
              color={category.color}
              size={18}
              tileSize={38}
            />
            <Text
              numberOfLines={2}
              style={{
                textAlign: "center",
                fontFamily: fonts.semibold,
                fontSize: fontSize["2xs"],
                lineHeight: 14,
                color: active ? colors.text : colors.textSecondary,
              }}
            >
              {category.name}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
