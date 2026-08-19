import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Download,
  LogOut,
  Monitor,
  Moon,
  Smartphone,
  Sun,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { COUNTRIES, getCurrencyByCountry } from "../lib/countries";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useTheme, ThemePreference } from "../hooks/useTheme";
import { usePwaInstall } from "../hooks/usePwaInstall";
import PageHeader from "../components/ui/PageHeader";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { logOut } from "../lib/firebase";
import { initialsOf } from "../lib/format";
import { haptic } from "../lib/haptics";
import { riseVariants } from "../lib/motion";
import "./SettingsPage.css";

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match system", icon: Monitor },
];

export default function SettingsPage() {
  const user = useCurrentUser();
  const updateProfile = useMutation(api.users.updateProfile);
  const transactions = useQuery(api.transactions.getTransactions, {});
  const categories = useQuery(api.categories.getCategories) ?? [];
  const { preference, setPreference } = useTheme();
  const { canPrompt, install, installed, isIos } = usePwaInstall();

  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setCountry(user.country);
    setCurrency(user.currency);
  }, [user]);

  const dirty =
    !!user &&
    (name.trim() !== user.name ||
      country !== user.country ||
      currency !== user.currency);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
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

  const exportAll = () => {
    if (!transactions || transactions.length === 0) {
      toast.error("Nothing to export yet");
      return;
    }
    const nameById = new Map(categories.map((c) => [c._id as string, c.name]));
    const header = "date,type,category,description,amount";
    const body = transactions
      .map((t) => {
        const cat = nameById.get(t.categoryId) ?? "Unknown";
        const note = (t.description ?? "").replace(/"/g, '""');
        return `${new Date(t.date).toISOString()},${t.type},"${cat}","${note}",${t.amount}`;
      })
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finhash-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${transactions.length} transactions`);
  };

  return (
    <div className="page settings-page">
      <PageHeader title="Settings" subtitle="Profile, appearance and your data" />

      {/* ---------- Profile ---------- */}
      <motion.section
        className="card settings-card"
        variants={riseVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="section-title">
          <UserRound size={14} />
          Profile
        </h2>

        <div className="settings-identity">
          {user?.photoUrl ? (
            <img
              className="avatar avatar--lg"
              src={user.photoUrl}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="avatar avatar--lg avatar--fallback">
              {initialsOf(user?.name)}
            </span>
          )}
          <div className="settings-identity__text">
            <span className="settings-identity__name">{user?.name}</span>
            <span className="settings-identity__email truncate">
              {user?.email}
            </span>
          </div>
        </div>

        <form className="settings-form" onSubmit={handleSave}>
          <div className="field">
            <label className="field__label" htmlFor="settings-name">
              Display name
            </label>
            <input
              id="settings-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              required
            />
          </div>

          <div className="settings-form__pair">
            <div className="field">
              <label className="field__label" htmlFor="settings-country">
                Country
              </label>
              <select
                id="settings-country"
                className="form-input"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCurrency(getCurrencyByCountry(e.target.value).currency);
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="settings-currency">
                Currency
              </label>
              <select
                id="settings-currency"
                className="form-input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {[...new Set(COUNTRIES.map((c) => c.currency))].map((cur) => {
                  const match = COUNTRIES.find((c) => c.currency === cur)!;
                  return (
                    <option key={cur} value={cur}>
                      {match.symbol} — {cur}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={`btn ${dirty ? "btn--accent" : "btn--secondary"}`}
            disabled={saving || !dirty || !name.trim()}
          >
            {saving ? "Saving…" : dirty ? "Save changes" : "No changes"}
          </button>
        </form>
      </motion.section>

      {/* ---------- Appearance ---------- */}
      <motion.section
        className="card settings-card"
        variants={riseVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="section-title">
          <Sun size={14} />
          Appearance
        </h2>

        <div className="theme-cards">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={`theme-card ${preference === value ? "theme-card--active" : ""}`}
              onClick={() => {
                haptic("light");
                setPreference(value);
              }}
              aria-pressed={preference === value}
            >
              <span className={`theme-card__swatch theme-card__swatch--${value}`}>
                <Icon size={18} />
              </span>
              <span className="theme-card__label">{label}</span>
              {preference === value && (
                <span className="theme-card__check">
                  <Check size={13} />
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* ---------- Data ---------- */}
      <motion.section
        className="card settings-card"
        variants={riseVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="section-title">
          <Download size={14} />
          Your data
        </h2>

        <div className="settings-row">
          <div className="settings-row__text">
            <span className="settings-row__title">Export transactions</span>
            <span className="settings-row__hint">
              {transactions
                ? `${transactions.length} entries as CSV`
                : "Preparing…"}
            </span>
          </div>
          <button className="btn btn--secondary btn--sm" onClick={exportAll}>
            <Download size={15} />
            Export
          </button>
        </div>
      </motion.section>

      {/* ---------- App ---------- */}
      <motion.section
        className="card settings-card"
        variants={riseVariants}
        initial="initial"
        animate="animate"
      >
        <h2 className="section-title">
          <Smartphone size={14} />
          App
        </h2>

        <div className="settings-row">
          <div className="settings-row__text">
            <span className="settings-row__title">Install FinHash</span>
            <span className="settings-row__hint">
              {installed
                ? "Already installed on this device"
                : isIos
                  ? "In Safari: Share → Add to Home Screen"
                  : "Run full screen and work offline"}
            </span>
          </div>
          {canPrompt && !installed && (
            <button className="btn btn--secondary btn--sm" onClick={install}>
              Install
            </button>
          )}
          {installed && (
            <span className="badge badge--success">
              <Check size={11} />
              Installed
            </span>
          )}
        </div>

        <div className="settings-row">
          <div className="settings-row__text">
            <span className="settings-row__title">Version</span>
            <span className="settings-row__hint">FinHash 1.0</span>
          </div>
        </div>
      </motion.section>

      <button
        className="settings-signout"
        onClick={() => setSignOutOpen(true)}
      >
        <LogOut size={18} />
        Sign out
      </button>

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
    </div>
  );
}
