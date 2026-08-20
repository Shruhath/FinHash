import { ReactNode } from "react";
import {
  RefreshControl,
  ScrollView,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { layout, space, useTheme } from "@/theme";

interface Props extends Pick<ScrollViewProps, "onScroll" | "scrollEventThrottle"> {
  children: ReactNode;
  /** Rendered above the scroll area and pinned in place. */
  header?: ReactNode;
  /** Extra bottom padding on tab screens so the bar never covers content. */
  withTabBar?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}

/**
 * Page shell: safe-area aware, capped to a readable width on tablets, and
 * padded clear of the floating tab bar.
 */
export default function Screen({
  children,
  header,
  withTabBar = true,
  refreshing,
  onRefresh,
  contentStyle,
  scroll = true,
  ...scrollProps
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const bottomPad =
    (withTabBar ? layout.tabBarHeight + insets.bottom + space.xl : insets.bottom + space.xl);

  const inner = (
    <View
      style={[
        {
          width: "100%",
          maxWidth: layout.maxContentWidth,
          alignSelf: "center",
          paddingHorizontal: space.lg,
          gap: space.lg,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {header}
      {scroll ? (
        <ScrollView
          {...scrollProps}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: space.md, paddingBottom: bottomPad }}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
                progressBackgroundColor={colors.bgCard}
              />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingTop: space.md, paddingBottom: bottomPad }}>
          {inner}
        </View>
      )}
    </View>
  );
}
