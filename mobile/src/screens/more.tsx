import { View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChartNoAxesCombined,
  HandCoins,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Shapes,
  Sun,
  Target,
  type LucideIcon,
} from "lucide-react-native";
import Screen from "@/components/ui/Screen";
import HomeHeader from "@/components/layout/HomeHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { logOut } from "@/lib/firebase";
import { haptic } from "@/lib/haptics";
import { radius, space, useTheme, type ThemePreference } from "@/theme";
import { useState } from "react";

const TILES: { href: string; icon: LucideIcon; label: string }[] = [
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/debts", icon: HandCoins, label: "Debts" },
  { href: "/analytics", icon: ChartNoAxesCombined, label: "Analytics" },
  { href: "/categories", icon: Shapes, label: "Categories" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const THEMES: { value: ThemePreference; icon: LucideIcon; label: string }[] = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "Auto" },
];

export default function MoreScreen() {
  const { colors, preference, setPreference } = useTheme();
  const router = useRouter();
  const user = useCurrentUser();
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <Screen header={<HomeHeader />}>
      <Text variant="title">Menu</Text>

      <Card
        padded="md"
        style={{ flexDirection: "row", alignItems: "center", gap: space.md }}
      >
        <Avatar uri={user?.photoUrl} name={user?.name} size={48} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="heading" numberOfLines={1}>
            {user?.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {user?.email}
          </Text>
        </View>
      </Card>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {TILES.map((tile, index) => (
          <Animated.View
            key={tile.href}
            entering={FadeInDown.delay(index * 40).duration(300)}
            style={{ width: "31.5%" }}
          >
            <PressableScale
              onPress={() => {
                haptic("light");
                router.push(tile.href as never);
              }}
              scaleTo={0.95}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              style={{
                alignItems: "center",
                gap: space.sm,
                paddingVertical: space.lg,
                paddingHorizontal: space.sm,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.bgCard,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: radius.md,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accentSoft,
                }}
              >
                <tile.icon size={20} color={colors.accent} />
              </View>
              <Text variant="caption" tone="secondary" numberOfLines={1}>
                {tile.label}
              </Text>
            </PressableScale>
          </Animated.View>
        ))}
      </View>

      <Card
        padded="md"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.md,
        }}
      >
        <Overline>Appearance</Overline>
        <View
          style={{
            flexDirection: "row",
            gap: 2,
            padding: 3,
            borderRadius: radius.full,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.bgInput,
          }}
        >
          {THEMES.map((option) => {
            const active = preference === option.value;
            return (
              <PressableScale
                key={option.value}
                onPress={() => {
                  haptic("light");
                  setPreference(option.value);
                }}
                scaleTo={0.9}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={option.label}
                style={{
                  minWidth: 40,
                  height: 30,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? colors.accent : "transparent",
                }}
              >
                <option.icon size={16} color={active ? "#fff" : colors.textMuted} />
              </PressableScale>
            );
          })}
        </View>
      </Card>

      <Button
        block
        label="Sign out"
        variant="danger"
        size="lg"
        icon={<LogOut size={18} color={colors.danger} />}
        onPress={() => setSignOutOpen(true)}
      />

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out?"
        message="You'll need to sign in with Google again to get back to your data."
        confirmLabel="Sign out"
        onConfirm={() => {
          setSignOutOpen(false);
          logOut();
        }}
        onCancel={() => setSignOutOpen(false)}
      />
    </Screen>
  );
}
