import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, SlideInRight, SlideOutLeft, ZoomIn } from "react-native-reanimated";
import { useMutation } from "convex/react";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react-native";
import { api } from "@convex/_generated/api";
import { COUNTRIES, getCurrencyByCountry } from "@shared/countries";
import Text, { Overline } from "@/components/ui/Text";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import Select from "@/components/ui/Select";
import { LogoMark } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { haptic } from "@/lib/haptics";
import { fonts, fontSize, radius, space, useTheme } from "@/theme";

const STEPS = ["You", "Where", "Ready"] as const;

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the name field once the user record arrives.
  if (user?.name && !name) setName(user.name);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (entry) =>
        entry.name.toLowerCase().includes(term) ||
        entry.currency.toLowerCase().includes(term)
    );
  }, [search]);

  const selectedCountry = COUNTRIES.find((entry) => entry.code === country);
  const currencyOptions = useMemo(
    () =>
      [...new Set(COUNTRIES.map((entry) => entry.currency))].map((code) => {
        const match = COUNTRIES.find((entry) => entry.currency === code)!;
        return { value: code, label: `${match.symbol} — ${code}` };
      }),
    []
  );

  const go = (next: number) => {
    haptic("light");
    setStep(next);
  };

  const chooseCountry = (code: string) => {
    setCountry(code);
    setCurrency(getCurrencyByCountry(code).currency);
    haptic("light");
    go(2);
  };

  const submit = async () => {
    if (!name.trim() || !country || !currency) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), country, currency });
      haptic("success");
    } catch {
      toast.error("Couldn't save your profile — try again");
      setSaving(false);
    }
  };

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? !!country : true;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: space.lg,
          paddingVertical: space.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <LogoMark size={34} />
        <View style={{ flexDirection: "row", gap: space.md }}>
          {STEPS.map((label, index) => (
            <View
              key={label}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: radius.full,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: index <= step ? colors.accent : colors.bgHover,
                }}
              >
                {index < step ? (
                  <Check size={12} color="#fff" />
                ) : (
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: fontSize["2xs"],
                      color: index === step ? "#fff" : colors.textMuted,
                    }}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                variant="caption"
                tone={index <= step ? "accent" : "faint"}
                style={{ fontFamily: fonts.semibold }}
              >
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {step === 0 ? (
          <Animated.View
            key="name"
            entering={SlideInRight.duration(240)}
            exiting={SlideOutLeft.duration(180)}
            style={{ padding: space.xl, gap: space.md }}
          >
            <Text variant="title" style={{ fontSize: 24 }}>
              What should we call you?
            </Text>
            <Text variant="caption" tone="secondary">
              This is just for your dashboard greeting.
            </Text>
            <TextField
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              maxLength={60}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={() => canContinue && go(1)}
              style={{ height: 54, fontSize: 18, fontFamily: fonts.semibold, marginTop: space.sm }}
            />
          </Animated.View>
        ) : null}

        {step === 1 ? (
          <Animated.View
            key="country"
            entering={SlideInRight.duration(240)}
            exiting={SlideOutLeft.duration(180)}
            style={{ flex: 1, paddingHorizontal: space.xl, paddingTop: space.xl, gap: space.md }}
          >
            <Text variant="title" style={{ fontSize: 24 }}>
              Where are you based?
            </Text>
            <Text variant="caption" tone="secondary">
              We'll set your currency to match — you can change it later.
            </Text>

            <View style={{ position: "relative", justifyContent: "center" }}>
              <Search
                size={16}
                color={colors.textMuted}
                style={{ position: "absolute", left: space.md, zIndex: 1 }}
              />
              <TextField
                value={search}
                onChangeText={setSearch}
                placeholder="Search countries"
                style={{ paddingLeft: 42 }}
                autoCorrect={false}
              />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: space.xl }}
            >
              {filtered.map((entry) => (
                <Pressable
                  key={entry.code}
                  onPress={() => chooseCountry(entry.code)}
                  accessibilityRole="button"
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: space.md,
                    paddingVertical: space.md,
                    paddingHorizontal: space.md,
                    borderRadius: radius.md,
                    backgroundColor:
                      country === entry.code
                        ? colors.accentSoft
                        : pressed
                          ? colors.bgHover
                          : "transparent",
                  })}
                >
                  <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                    {entry.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.numericSemi,
                      fontSize: fontSize.xs,
                      color: colors.textMuted,
                    }}
                  >
                    {entry.symbol} {entry.currency}
                  </Text>
                </Pressable>
              ))}
              {filtered.length === 0 ? (
                <Text variant="caption" tone="muted" style={{ textAlign: "center", padding: space.xl }}>
                  No matches
                </Text>
              ) : null}
            </ScrollView>
          </Animated.View>
        ) : null}

        {step === 2 ? (
          <Animated.View
            key="done"
            entering={FadeIn.duration(240)}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: space.xl,
              gap: space.md,
            }}
          >
            <Animated.View
              entering={ZoomIn.springify().damping(16)}
              style={{
                width: 68,
                height: 68,
                borderRadius: radius.full,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.accentSoft,
                marginBottom: space.sm,
              }}
            >
              <Check size={30} color={colors.accent} />
            </Animated.View>

            <Text variant="title" style={{ fontSize: 24, textAlign: "center" }}>
              You're all set, {name.split(" ")[0]}
            </Text>
            <Text variant="caption" tone="secondary" style={{ textAlign: "center" }}>
              Tracking in {selectedCountry?.name} using {selectedCountry?.symbol} {currency}.
            </Text>

            <View style={{ width: "100%", marginTop: space.lg, gap: 8 }}>
              <Overline>Currency</Overline>
              <Select value={currency} onChange={setCurrency} options={currencyOptions} />
            </View>
          </Animated.View>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: space.sm,
          padding: space.lg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        {step > 0 ? (
          <Button
            label="Back"
            variant="ghost"
            icon={<ArrowLeft size={16} color={colors.textSecondary} />}
            onPress={() => go(step - 1)}
          />
        ) : null}

        {step < 2 ? (
          <Button
            block
            style={{ flex: 1 }}
            label="Continue"
            icon={<ArrowRight size={16} color="#fff" />}
            disabled={!canContinue}
            onPress={() => go(step + 1)}
          />
        ) : (
          <Button
            block
            size="lg"
            style={{ flex: 1 }}
            label={saving ? "Setting up…" : "Start tracking"}
            loading={saving}
            disabled={!name.trim() || !country || !currency}
            onPress={submit}
          />
        )}
      </View>
    </View>
  );
}
