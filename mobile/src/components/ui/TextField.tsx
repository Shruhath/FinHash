import { forwardRef, useState } from "react";
import { TextInput, type StyleProp, type TextInputProps, type TextStyle } from "react-native";
import { BottomSheetTextInput } from "@gorhom/bottom-sheet";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

interface Props extends TextInputProps {
  /** Use the bottom-sheet aware input when rendered inside a Sheet. */
  inSheet?: boolean;
  style?: StyleProp<TextStyle>;
}

/**
 * Single text input style shared by every form. 16px minimum so iOS never
 * zooms the viewport, and a visible focus ring in the brand colour.
 */
const TextField = forwardRef<TextInput, Props>(function TextField(
  { inSheet, style, onFocus, onBlur, ...rest },
  ref
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const Input = inSheet ? BottomSheetTextInput : TextInput;

  return (
    <Input
      ref={ref as never}
      placeholderTextColor={colors.textFaint}
      selectionColor={colors.accent}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
      {...rest}
      style={[
        {
          height: 48,
          paddingHorizontal: space.md,
          borderRadius: radius.md,
          borderWidth: 1,
          fontFamily: fonts.regular,
          fontSize: fontSize.md,
          color: colors.text,
          backgroundColor: focused ? colors.bgElevated : colors.bgInput,
          borderColor: focused ? colors.accent : colors.border,
        },
        style,
      ]}
    />
  );
});

export default TextField;
