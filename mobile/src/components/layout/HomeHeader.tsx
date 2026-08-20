import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { WifiOff } from "lucide-react-native";
import Text from "../ui/Text";
import Avatar from "../ui/Avatar";
import { LogoMark } from "../ui/Logo";
import { fonts, layout, space, useTheme } from "@/theme";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/** Brand header shown on the tab screens. */
export default function HomeHeader() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useCurrentUser();
  const online = useOnlineStatus();

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.bg }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: layout.headerHeight,
          paddingHorizontal: space.lg,
          gap: space.sm,
        }}
      >
        <LogoMark size={26} />
        <Text
          style={{
            flex: 1,
            fontFamily: fonts.displayBold,
            fontSize: 18,
            letterSpacing: -0.8,
            color: colors.text,
          }}
        >
          Fin<Text style={{ fontFamily: fonts.displayBold, fontSize: 18, color: colors.accent }}>Hash</Text>
        </Text>

        {!online ? (
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.warningSoft,
            }}
          >
            <WifiOff size={13} color={colors.warning} />
          </View>
        ) : null}

        <Avatar
          uri={user?.photoUrl}
          name={user?.name}
          size={32}
          onPress={() => router.push("/settings")}
        />
      </View>
    </View>
  );
}
