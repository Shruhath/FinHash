import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import Text from "./Text";
import IconButton from "./IconButton";
import Chip from "./Chip";
import { fonts, fontSize, space, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  /** Blocks stepping past the current period. */
  nextDisabled?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export default function PeriodStepper({
  label,
  onPrev,
  onNext,
  nextDisabled,
  onReset,
  resetLabel = "Today",
  style,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "center", gap: space.sm },
        style,
      ]}
    >
      <IconButton
        bordered
        accessibilityLabel="Previous period"
        icon={<ChevronLeft size={18} color={colors.textSecondary} />}
        onPress={() => {
          haptic("light");
          onPrev();
        }}
      />

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", height: 38 }}>
        <Animated.View key={label} entering={FadeIn.duration(180)} exiting={FadeOut.duration(120)}>
          <Text
            style={{
              fontFamily: fonts.display,
              fontSize: fontSize.md,
              letterSpacing: -0.3,
              color: colors.text,
            }}
          >
            {label}
          </Text>
        </Animated.View>
      </View>

      <IconButton
        bordered
        accessibilityLabel="Next period"
        icon={
          <ChevronRight
            size={18}
            color={nextDisabled ? colors.textFaint : colors.textSecondary}
          />
        }
        onPress={() => {
          if (nextDisabled) return;
          haptic("light");
          onNext();
        }}
        style={nextDisabled ? { opacity: 0.4 } : undefined}
      />

      {onReset ? (
        <Chip
          label={resetLabel}
          active
          onPress={() => {
            haptic("light");
            onReset();
          }}
        />
      ) : null}
    </View>
  );
}
