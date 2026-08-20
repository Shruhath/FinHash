import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import Text from "./Text";
import IconButton from "./IconButton";
import { radius, space, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Pinned below the scroll area — the primary action lives here. */
  footer?: ReactNode;
  /** Fraction of the screen the sheet opens to. */
  snapPoint?: string;
  dismissible?: boolean;
}

/**
 * One dialog primitive for the whole app. Content scrolls inside the sheet
 * while the handle and header remain draggable, matching the web behaviour.
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  snapPoint = "88%",
  dismissible = true,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);

  useEffect(() => {
    if (open) ref.current?.expand();
    else ref.current?.close();
  }, [open]);

  const handleClose = useCallback(() => {
    haptic("light");
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        pressBehavior={dismissible ? "close" : "none"}
        style={[props.style, { backgroundColor: colors.scrim }]}
      />
    ),
    [colors.scrim, dismissible]
  );

  if (!open) return null;

  return (
    <BottomSheet
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={dismissible}
      enableDynamicSizing={false}
      onClose={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      handleIndicatorStyle={{
        backgroundColor: colors.borderStrong,
        width: 40,
        height: 4,
      }}
      backgroundStyle={{
        backgroundColor: colors.bgSecondary,
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
      }}
      style={{
        borderTopLeftRadius: radius["2xl"],
        borderTopRightRadius: radius["2xl"],
        overflow: "hidden",
      }}
    >
      {title || dismissible ? (
        <BottomSheetView
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: space.md,
            paddingHorizontal: space.lg,
            paddingTop: space.sm,
            paddingBottom: space.md,
          }}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            {title ? (
              <Text variant="title" style={{ fontSize: 20 }} numberOfLines={2}>
                {title}
              </Text>
            ) : null}
            {description ? (
              <Text variant="caption" tone="secondary" style={{ marginTop: 2 }}>
                {description}
              </Text>
            ) : null}
          </View>
          {dismissible ? (
            <IconButton
              accessibilityLabel="Close"
              icon={<X size={18} color={colors.textSecondary} />}
              onPress={handleClose}
            />
          ) : null}
        </BottomSheetView>
      ) : null}

      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: footer ? space.lg : insets.bottom + space.xl,
          gap: space.lg,
        }}
      >
        {children}
      </BottomSheetScrollView>

      {footer ? (
        <BottomSheetView
          style={{
            flexDirection: "row",
            gap: space.sm,
            paddingHorizontal: space.lg,
            paddingTop: space.md,
            paddingBottom: insets.bottom + (Platform.OS === "ios" ? space.sm : space.md),
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.bgSecondary,
          }}
        >
          {footer}
        </BottomSheetView>
      ) : null}
    </BottomSheet>
  );
}
