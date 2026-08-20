import { View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop, G } from "react-native-svg";
import Text from "./Text";
import { fonts, useTheme } from "@/theme";

/** The FinHash "#": two slanted strokes layered over two flat ones. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="fhV" x1="0" y1="0" x2="0.3" y2="1">
          <Stop offset="0" stopColor="#FFA05C" />
          <Stop offset="1" stopColor="#E86A0A" />
        </LinearGradient>
        <LinearGradient id="fhH" x1="0" y1="0" x2="1" y2="0.4">
          <Stop offset="0" stopColor="#B34900" />
          <Stop offset="1" stopColor="#CC5500" />
        </LinearGradient>
      </Defs>
      <G fill="url(#fhH)">
        <Rect x="96" y="182" width="320" height="48" rx="24" />
        <Rect x="96" y="296" width="320" height="48" rx="24" />
      </G>
      <G
        fill="url(#fhV)"
        transform="translate(256,256) skewX(-12) translate(-256,-256)"
      >
        <Rect x="174" y="96" width="48" height="320" rx="24" />
        <Rect x="290" y="96" width="48" height="320" rx="24" />
      </G>
    </Svg>
  );
}

export default function Logo({
  size = 28,
  withWordmark = true,
}: {
  size?: number;
  withWordmark?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
      <LogoMark size={size} />
      {withWordmark ? (
        <Text
          style={{
            fontFamily: fonts.displayBold,
            fontSize: size * 0.66,
            letterSpacing: -size * 0.045,
            color: colors.text,
          }}
        >
          Fin<Text style={{ fontFamily: fonts.displayBold, color: colors.accent, fontSize: size * 0.66 }}>Hash</Text>
        </Text>
      ) : null}
    </View>
  );
}
