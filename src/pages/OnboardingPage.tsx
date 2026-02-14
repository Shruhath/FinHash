import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { COUNTRIES, getCurrencyByCountry } from "../lib/countries";
import "./OnboardingPage.css";

export default function OnboardingPage() {
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState(user?.name ?? "");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [saving, setSaving] = useState(false);

  // Pre-fill name once user loads
  if (user?.name && !name) {
    setName(user.name);
  }

  const handleCountryChange = (code: string) => {
    setCountry(code);
    const { currency: cur } = getCurrencyByCountry(code);
    setCurrency(cur);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country || !currency) return;

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        country,
        currency,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setSaving(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div className="onboarding-logo">
            <span className="onboarding-logo__text">Fin</span>
            <span className="onboarding-logo__hash">#</span>
          </div>
          <h1 className="onboarding-title">Welcome aboard!</h1>
          <p className="onboarding-subtitle">
            Let's set up your profile to get started.
          </p>
        </div>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="country">
              Country
            </label>
            <select
              id="country"
              className="form-input"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              required
            >
              <option value="" disabled>
                Select your country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="currency">
              Currency
            </label>
            <select
              id="currency"
              className="form-input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              required
            >
              <option value="" disabled>
                Auto-selected from country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c.currency} value={c.currency}>
                  {c.symbol} — {c.currency}
                </option>
              ))}
            </select>
            {currency && (
              <span className="form-hint">
                Auto-set to {currency}. You can override if needed.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="onboarding-submit"
            disabled={saving || !name.trim() || !country || !currency}
          >
            {saving ? "Saving..." : "Get Started"}
          </button>
        </form>
      </div>
    </div>
  );
}
