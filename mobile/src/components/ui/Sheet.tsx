import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import Text from "./Text";
import IconButton from "./IconButton";
import { radius, space, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

/** Roughly one large button plus its padding — reserves scroll room. */
const FOOTER_HEIGHT = 78;

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
 * One dialog primitive for the whole app. Uses the modal variant so the sheet
 * is portalled above the floating tab bar rather than trapped inside a screen.
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
  const ref = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => [snapPoint], [snapPoint]);

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
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

  // Footers have to go through the library's slot — rendering one as a sibling
  // of the scroll view leaves it absolutely positioned over the header.
  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) =>
      footer ? (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
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
          </View>
        </BottomSheetFooter>
      ) : null,
    [footer, colors.border, colors.bgSecondary, insets.bottom]
  );

  if (!open) return null;

  return (
    <BottomSheetModal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={dismissible}
      enableDynamicSizing={false}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      footerComponent={footer ? renderFooter : undefined}
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
        <View
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
        </View>
      ) : null}

      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: footer
            ? FOOTER_HEIGHT + insets.bottom + space.lg
            : insets.bottom + space.xl,
          gap: space.lg,
        }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
