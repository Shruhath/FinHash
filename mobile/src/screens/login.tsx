import { useEffect } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { ChartNoAxesCombined, ShieldCheck, Zap, type LucideIcon } from "lucide-react-native";
import Text from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { fonts, radius, space, useTheme } from "@/theme";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Zap,
    title: "Log in seconds",
    text: "Amount, category, done — split payments included.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "See the pattern",
    text: "Budgets, goals, debts and trends in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Yours alone",
    text: "Your data stays tied to your account. No ads, no selling.",
  },
];

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { signIn, pending, error, ready } = useGoogleSignIn();

  useEffect(() => {
    if (error) toast.error(error);
  }, [error, toast]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: "center",
        paddingHorizontal: space.lg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + space.lg,
      }}
    >
      <Aurora />

      <Animated.View
        entering={FadeInDown.duration(460)}
        style={{
          gap: space.lg,
          padding: space.xl,
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.glass,
        }}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(18)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: space.md,
          }}
        >
          <LogoMark size={56} />
          <Text
            style={{
              fontFamily: fonts.displayHeavy,
              fontSize: 34,
              letterSpacing: -1.7,
              color: colors.text,
            }}
          >
            Fin
            <Text
              style={{
                fontFamily: fonts.displayHeavy,
                fontSize: 34,
                letterSpacing: -1.7,
                color: colors.accent,
              }}
            >
              Hash
            </Text>
          </Text>
        </Animated.View>

        <Text variant="body" tone="secondary" style={{ textAlign: "center" }}>
          Every rupee, dollar and euro — accounted for.
        </Text>

        <View style={{ gap: space.md, marginVertical: space.xs }}>
          {FEATURES.map((feature, index) => (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.delay(120 + index * 80).duration(380)}
              style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: radius.sm,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.accentSoft,
                }}
              >
                <feature.icon size={17} color={colors.accent} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodyStrong">{feature.title}</Text>
                <Text variant="caption" tone="muted">
                  {feature.text}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(420)}>
          <Button
            block
            size="lg"
            label={pending ? "Opening Google…" : "Continue with Google"}
            variant="secondary"
            icon={<GoogleMark />}
            loading={pending}
            disabled={!ready}
            onPress={signIn}
          />
        </Animated.View>

        <Text variant="caption" tone="faint" style={{ textAlign: "center" }}>
          Syncs with FinHash on the web
        </Text>
      </Animated.View>
    </View>
  );
}

/** Soft orange bloom behind the card. */
function Aurora() {
  return (
    <Svg
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id="orb1" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#cc5500" stopOpacity={0.45} />
          <Stop offset="1" stopColor="#cc5500" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="orb2" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#f5782a" stopOpacity={0.3} />
          <Stop offset="1" stopColor="#f5782a" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="10%" cy="12%" r="210" fill="url(#orb1)" />
      <Circle cx="95%" cy="88%" r="200" fill="url(#orb2)" />
    </Svg>
  );
}

function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}
