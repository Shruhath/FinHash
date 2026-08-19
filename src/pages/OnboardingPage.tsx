import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { COUNTRIES, getCurrencyByCountry } from "../lib/countries";
import { LogoMark } from "../components/ui/Logo";
import { EASE_OUT } from "../lib/motion";
import { haptic } from "../lib/haptics";
import "./OnboardingPage.css";

const STEPS = ["You", "Where", "Ready"] as const;

export default function OnboardingPage() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the name field once the user record arrives.
  if (user?.name && !name) setName(user.name);

  const filteredCountries = useMemo(() => {
    const term = countrySearch.trim().toLowerCase();
    if (!term) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.currency.toLowerCase().includes(term)
    );
  }, [countrySearch]);

  const selectedCountry = COUNTRIES.find((c) => c.code === country);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    haptic("light");
  };

  const chooseCountry = (code: string) => {
    setCountry(code);
    setCurrency(getCurrencyByCountry(code).currency);
    haptic("light");
    go(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country || !currency) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), country, currency });
      haptic("success");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Couldn't save your profile — try again");
      setSaving(false);
    }
  };

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? !!country : true;

  return (
    <div className="onboarding">
      <div className="login__aurora" aria-hidden>
        <span className="login__orb login__orb--1" />
        <span className="login__orb login__orb--2" />
      </div>

      <motion.div
        className="onboarding__card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
      >
        <header className="onboarding__head">
          <LogoMark size={40} />
          <div className="onboarding__steps">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`onboarding__step ${i <= step ? "onboarding__step--done" : ""}`}
              >
                <span className="onboarding__step-dot">
                  {i < step ? <Check size={11} /> : i + 1}
                </span>
                <span className="onboarding__step-label">{label}</span>
              </span>
            ))}
          </div>
        </header>

        <form className="onboarding__form" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            {step === 0 && (
              <motion.section
                key="step-name"
                className="onboarding__panel"
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h1 className="onboarding__title">What should we call you?</h1>
                <p className="onboarding__lead">
                  This is just for your dashboard greeting.
                </p>
                <input
                  type="text"
                  className="form-input onboarding__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  autoFocus
                  required
                />
              </motion.section>
            )}

            {step === 1 && (
              <motion.section
                key="step-country"
                className="onboarding__panel"
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h1 className="onboarding__title">Where are you based?</h1>
                <p className="onboarding__lead">
                  We'll set your currency to match — you can change it later.
                </p>

                <div className="search-field">
                  <Search size={16} className="search-field__icon" />
                  <input
                    type="search"
                    className="search-field__input"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Search countries"
                    aria-label="Search countries"
                  />
                </div>

                <ul className="country-list">
                  {filteredCountries.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        className={`country-row ${country === c.code ? "country-row--active" : ""}`}
                        onClick={() => chooseCountry(c.code)}
                      >
                        <span className="country-row__name truncate">
                          {c.name}
                        </span>
                        <span className="country-row__currency money">
                          {c.symbol} {c.currency}
                        </span>
                      </button>
                    </li>
                  ))}
                  {filteredCountries.length === 0 && (
                    <li className="country-list__empty">No matches</li>
                  )}
                </ul>
              </motion.section>
            )}

            {step === 2 && (
              <motion.section
                key="step-done"
                className="onboarding__panel onboarding__panel--center"
                custom={direction}
                variants={panelVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <motion.span
                  className="onboarding__check"
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                >
                  <Check size={30} />
                </motion.span>
                <h1 className="onboarding__title">You're all set, {name.split(" ")[0]}</h1>
                <p className="onboarding__lead">
                  Tracking in {selectedCountry?.name} using{" "}
                  <strong>
                    {selectedCountry?.symbol} {currency}
                  </strong>
                  .
                </p>

                <div className="field onboarding__currency">
                  <label className="field__label" htmlFor="currency">
                    Currency
                  </label>
                  <select
                    id="currency"
                    className="form-input"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    required
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
              </motion.section>
            )}
          </AnimatePresence>

          <footer className="onboarding__actions">
            {step > 0 && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => go(step - 1)}
              >
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                className="btn btn--accent btn--block"
                onClick={() => go(step + 1)}
                disabled={!canContinue}
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="btn btn--accent btn--block btn--lg"
                disabled={saving || !name.trim() || !country || !currency}
              >
                {saving ? "Setting up…" : "Start tracking"}
              </button>
            )}
          </footer>
        </form>
      </motion.div>
    </div>
  );
}

const panelVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction * 40,
  }),
  center: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -40,
    transition: { duration: 0.2 },
  }),
};
