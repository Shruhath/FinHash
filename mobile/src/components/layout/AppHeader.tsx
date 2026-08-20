import { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import Text from "../ui/Text";
import IconButton from "../ui/IconButton";
import { layout, space, useTheme } from "@/theme";

interface Props {
  title: string;
  /** Shown on the trailing edge — usually a single action. */
  action?: ReactNode;
  showBack?: boolean;
}

/** Header for pushed screens: back affordance plus the screen title. */
export default function AppHeader({ title, action, showBack = true }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: space.sm,
          height: layout.headerHeight,
          paddingHorizontal: space.md,
        }}
      >
        {showBack ? (
          <IconButton
            accessibilityLabel="Go back"
            icon={<ChevronLeft size={22} color={colors.text} />}
            onPress={() => router.back()}
          />
        ) : (
          <View style={{ width: space.xs }} />
        )}
        <Text variant="heading" style={{ flex: 1, fontSize: 18 }} numberOfLines={1}>
          {title}
        </Text>
        {action}
      </View>
    </View>
  );
}
