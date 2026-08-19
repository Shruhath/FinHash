import { useState } from "react";
import { motion } from "framer-motion";
import { ChartNoAxesCombined, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { signInWithGoogle } from "../lib/firebase";
import { LogoMark } from "../components/ui/Logo";
import { EASE_OUT } from "../lib/motion";
import "./LoginPage.css";

const FEATURES = [
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

export default function LoginPage() {
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed:", error);
      const code = (error as { code?: string })?.code;
      if (code !== "auth/popup-closed-by-user") {
        toast.error("Sign-in failed — please try again");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login__aurora" aria-hidden>
        <span className="login__orb login__orb--1" />
        <span className="login__orb login__orb--2" />
        <span className="login__orb login__orb--3" />
      </div>

      <motion.main
        className="login__inner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        <motion.div
          className="login__brand"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <LogoMark size={64} />
          <h1 className="login__wordmark">
            Fin<span className="logo__word-accent">Hash</span>
          </h1>
        </motion.div>

        <motion.p
          className="login__tagline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4, ease: EASE_OUT }}
        >
          Every rupee, dollar and euro — accounted for.
        </motion.p>

        <motion.ul
          className="login__features"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
          }}
        >
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <motion.li
              className="login__feature"
              key={title}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
            >
              <span className="login__feature-icon">
                <Icon size={17} />
              </span>
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </motion.li>
          ))}
        </motion.ul>

        <motion.button
          className="login__btn"
          onClick={handleLogin}
          disabled={busy}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4, ease: EASE_OUT }}
          whileTap={{ scale: 0.97 }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {busy ? "Opening Google…" : "Continue with Google"}
        </motion.button>

        <motion.p
          className="login__legal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Works offline · Installs like a native app
        </motion.p>
      </motion.main>
    </div>
  );
}
