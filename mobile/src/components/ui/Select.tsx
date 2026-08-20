import { ReactNode, useState } from "react";
import { Modal, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, ChevronDown } from "lucide-react-native";
import Text from "./Text";
import { fonts, fontSize, radius, shadow, space, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/**
 * Uses a plain Modal rather than a nested bottom sheet — stacking two
 * gesture-driven sheets fights over the pan responder.
 */
export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select",
  icon,
  style,
  disabled,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const selected = options.find((option) => option.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={selected?.label ?? placeholder}
        disabled={disabled}
        onPress={() => {
          haptic("light");
          setOpen(true);
        }}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            alignItems: "center",
            gap: space.sm,
            height: 48,
            paddingHorizontal: space.md,
            borderRadius: radius.md,
            borderWidth: 1,
            backgroundColor: colors.bgInput,
            borderColor: colors.border,
            opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          },
          style as ViewStyle,
        ]}
      >
        {icon}
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: fonts.regular,
            fontSize: fontSize.md,
            color: selected ? colors.text : colors.textFaint,
          }}
        >
          {selected?.label ?? placeholder}
        </Text>
        <ChevronDown size={16} color={colors.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(120)}
          style={{ flex: 1, backgroundColor: colors.scrim, justifyContent: "flex-end" }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)} />

          <Animated.View
            entering={FadeInDown.springify().damping(22)}
            style={[
              {
                maxHeight: "62%",
                backgroundColor: colors.bgSecondary,
                borderTopLeftRadius: radius["2xl"],
                borderTopRightRadius: radius["2xl"],
                borderTopWidth: 1,
                borderColor: colors.borderLight,
                paddingBottom: insets.bottom + space.md,
              },
              shadow(colors, "lg"),
            ]}
          >
            <View
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: radius.full,
                backgroundColor: colors.borderStrong,
                marginTop: space.md,
                marginBottom: space.sm,
              }}
            />

            <ScrollView contentContainerStyle={{ paddingHorizontal: space.md }}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value || "__none"}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      haptic("light");
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: space.md,
                      paddingVertical: space.md,
                      paddingHorizontal: space.md,
                      borderRadius: radius.md,
                      backgroundColor: active
                        ? colors.accentSoft
                        : pressed
                          ? colors.bgHover
                          : "transparent",
                    })}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: active ? fonts.semibold : fonts.regular,
                        fontSize: fontSize.md,
                        color: active ? colors.accent : colors.text,
                      }}
                    >
                      {option.label}
                    </Text>
                    {active ? <Check size={17} color={colors.accent} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}
