import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Text from "./Text";
import PressableScale from "./PressableScale";
import { accentShadow, brand, fonts, fontSize, radius, space, useTheme } from "@/theme";

type Variant = "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  style?: StyleProp<ViewStyle>;
}

const HEIGHTS: Record<Size, number> = { sm: 36, md: 46, lg: 52 };
const RADII: Record<Size, number> = { sm: radius.sm, md: radius.md, lg: radius.lg };
const TEXT_SIZES: Record<Size, number> = {
  sm: fontSize.sm,
  md: fontSize.base,
  lg: fontSize.md,
};

export default function Button({
  label,
  onPress,
  variant = "accent",
  size = "md",
  icon,
  disabled,
  loading,
  block,
  style,
}: Props) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  const surface: Record<Variant, ViewStyle> = {
    accent: {},
    secondary: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    ghost: { backgroundColor: "transparent" },
    danger: { backgroundColor: colors.dangerSoft },
  };

  const labelColor =
    variant === "accent"
      ? colors.onAccent
      : variant === "danger"
        ? colors.danger
        : variant === "ghost"
          ? colors.textSecondary
          : colors.text;

  const body = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.sm,
        height: HEIGHTS[size],
        paddingHorizontal: size === "sm" ? space.md : space.lg,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        icon
      )}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: TEXT_SIZES[size],
          color: inactive && variant === "accent" ? colors.textFaint : labelColor,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  // A dimmed gradient reads as broken, so disabled primaries go flat instead.
  const isFlatDisabled = inactive && variant === "accent";

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      feedback={variant === "accent" ? "medium" : "light"}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!inactive }}
      style={[
        {
          borderRadius: RADII[size],
          overflow: "hidden",
          alignSelf: block ? "stretch" : "flex-start",
        },
        variant === "accent" && !isFlatDisabled ? accentShadow() : null,
        variant === "accent"
          ? isFlatDisabled
            ? { backgroundColor: colors.bgElevated }
            : null
          : surface[variant],
        style,
      ].filter(Boolean) as ViewStyle[]}
    >
      {variant === "accent" && !isFlatDisabled ? (
        <LinearGradient
          colors={[brand.orange400, brand.orange500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {body}
        </LinearGradient>
      ) : (
        body
      )}
    </PressableScale>
  );
}
