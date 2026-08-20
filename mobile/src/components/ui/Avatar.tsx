import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import Text from "./Text";
import { fonts, radius, useTheme } from "@/theme";
import { initialsOf } from "@shared/format";

interface Props {
  uri?: string | null;
  name?: string;
  size?: number;
  onPress?: () => void;
}

/**
 * Falls back to initials on the accent tint — Google photo URLs occasionally
 * 403 and a broken image reads worse than a monogram.
 */
export default function Avatar({ uri, name, size = 32, onPress }: Props) {
  const { colors } = useTheme();

  const body = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: radius.full }}
      contentFit="cover"
      transition={160}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.full,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.accentSoft,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.displayBold,
          fontSize: size * 0.38,
          color: colors.accent,
        }}
      >
        {initialsOf(name)}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View style={{ borderRadius: radius.full, overflow: "hidden" }}>{body}</View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name ? `Account: ${name}` : "Account"}
      hitSlop={8}
      style={({ pressed }) => ({
        borderRadius: radius.full,
        overflow: "hidden",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      {body}
    </Pressable>
  );
}
