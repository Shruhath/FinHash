import { useEffect, useState } from "react";
import { View } from "react-native";
import Constants from "expo-constants";
import { useMutation, useQuery } from "convex/react";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Check,
  Download,
  LogOut,
  Monitor,
  Moon,
  Smartphone,
  Sun,
  UserRound,
} from "lucide-react-native";
import { api } from "@convex/_generated/api";
import { COUNTRIES, getCurrencyByCountry } from "@shared/countries";
import Screen from "@/components/ui/Screen";
import AppHeader from "@/components/layout/AppHeader";
import Text, { Overline } from "@/components/ui/Text";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import TextField from "@/components/ui/TextField";
import Avatar from "@/components/ui/Avatar";
import Divider from "@/components/ui/Divider";
import PressableScale from "@/components/ui/PressableScale";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { exportTransactionsCsv } from "@/lib/csvFiles";
import { logOut } from "@/lib/firebase";
import { haptic } from "@/lib/haptics";
import { radius, space, useTheme, type ThemePreference } from "@/theme";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match system", icon: Monitor },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference } = useTheme();
  const toast = useToast();
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const transactions = useQuery(api.transactions.getTransactions, {});
  const categories = useQuery(api.categories.getCategories) ?? [];

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setCountry(user.country);
    setCurrency(user.currency);
  }, [user]);

  const dirty =
    !!user &&
    (name.trim() !== user.name || country !== user.country || currency !== user.currency);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), country, currency });
      haptic("success");
      toast.success("Profile updated");
    } catch {
      haptic("error");
      toast.error("Couldn't save your profile");
    } finally {
      setSaving(false);
    }
  };

  const exportAll = async () => {
    if (!transactions || transactions.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const nameById = new Map(categories.map((category) => [category._id as string, category.name]));
    setBusy(true);
    try {
      await exportTransactionsCsv(
        transactions.map((transaction) => ({
          date: transaction.date,
          type: transaction.type,
          category: nameById.get(transaction.categoryId) ?? "Unknown",
          description: transaction.description,
          amount: transaction.amount,
        }))
      );
    } catch {
      toast.error("Couldn't export your transactions");
    } finally {
      setBusy(false);
    }
  };

  const currencyOptions = [...new Set(COUNTRIES.map((entry) => entry.currency))].map((code) => {
    const match = COUNTRIES.find((entry) => entry.currency === code)!;
    return { value: code, label: `${match.symbol} — ${code}` };
  });

  return (
    <Screen header={<AppHeader title="Settings" />} withTabBar={false}>
      <View style={{ gap: 2 }}>
        <Text variant="title">Settings</Text>
        <Text variant="caption" tone="secondary">
          Profile, appearance and your data
        </Text>
      </View>

      {/* ---------- Profile ---------- */}
      <Animated.View entering={FadeInDown.duration(340)}>
        <Card style={{ gap: space.lg }}>
          <SectionLabel icon={<UserRound size={14} color={colors.textMuted} />} label="Profile" />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: space.md,
              padding: space.md,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.bgElevated,
            }}
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
          </View>

          <Field label="Display name">
            <TextField value={name} onChangeText={setName} maxLength={60} />
          </Field>

          <Field label="Country">
            <Select
              value={country}
              onChange={(next) => {
                setCountry(next);
                setCurrency(getCurrencyByCountry(next).currency);
              }}
              options={COUNTRIES.map((entry) => ({ value: entry.code, label: entry.name }))}
            />
          </Field>

          <Field label="Currency">
            <Select value={currency} onChange={setCurrency} options={currencyOptions} />
          </Field>

          <Button
            block
            label={saving ? "Saving…" : dirty ? "Save changes" : "No changes"}
            variant={dirty ? "accent" : "secondary"}
            loading={saving}
            disabled={!dirty || !name.trim()}
            onPress={save}
          />
        </Card>
      </Animated.View>

      {/* ---------- Appearance ---------- */}
      <Animated.View entering={FadeInDown.delay(60).duration(340)}>
        <Card style={{ gap: space.lg }}>
          <SectionLabel icon={<Sun size={14} color={colors.textMuted} />} label="Appearance" />

          <View style={{ flexDirection: "row", gap: space.sm }}>
            {THEME_OPTIONS.map((option) => {
              const active = preference === option.value;
              return (
                <PressableScale
                  key={option.value}
                  onPress={() => {
                    haptic("light");
                    setPreference(option.value);
                  }}
                  scaleTo={0.96}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    gap: space.sm,
                    paddingVertical: space.lg,
                    paddingHorizontal: space.sm,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    backgroundColor: active ? colors.accentSofter : colors.bgCard,
                    borderColor: active ? colors.accentRing : colors.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      backgroundColor:
                        option.value === "light"
                          ? "#f4f2ef"
                          : option.value === "dark"
                            ? "#0e0e11"
                            : colors.bgElevated,
                    }}
                  >
                    <option.icon
                      size={18}
                      color={option.value === "light" ? "#cc5500" : colors.accent}
                    />
                  </View>
                  <Text
                    variant="caption"
                    tone={active ? "default" : "secondary"}
                    style={{ textAlign: "center" }}
                    numberOfLines={1}
                  >
                    {option.label}
                  </Text>
                  {active ? <Check size={13} color={colors.accent} /> : null}
                </PressableScale>
              );
            })}
          </View>
        </Card>
      </Animated.View>

      {/* ---------- Data ---------- */}
      <Animated.View entering={FadeInDown.delay(120).duration(340)}>
        <Card style={{ gap: space.lg }}>
          <SectionLabel icon={<Download size={14} color={colors.textMuted} />} label="Your data" />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: space.md,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="bodyStrong">Export transactions</Text>
              <Text variant="caption" tone="muted">
                {transactions ? `${transactions.length} entries as CSV` : "Preparing…"}
              </Text>
            </View>
            <Button
              label="Export"
              variant="secondary"
              size="sm"
              loading={busy}
              disabled={busy || !transactions?.length}
              icon={<Download size={15} color={colors.text} />}
              onPress={exportAll}
            />
          </View>
        </Card>
      </Animated.View>

      {/* ---------- App ---------- */}
      <Animated.View entering={FadeInDown.delay(180).duration(340)}>
        <Card style={{ gap: space.md }}>
          <SectionLabel icon={<Smartphone size={14} color={colors.textMuted} />} label="App" />

          <View>
            <Text variant="bodyStrong">Version</Text>
            <Text variant="caption" tone="muted">
              FinHash {Constants.expoConfig?.version ?? "1.0.0"}
            </Text>
          </View>

          <Divider />

          <View>
            <Text variant="bodyStrong">Syncs with the web app</Text>
            <Text variant="caption" tone="muted">
              Same account, same data — changes appear on both instantly.
            </Text>
          </View>
        </Card>
      </Animated.View>

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

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      {icon}
      <Overline>{label}</Overline>
    </View>
  );
}
