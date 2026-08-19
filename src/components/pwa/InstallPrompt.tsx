import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share, SquarePlus, X } from "lucide-react";
import { LogoMark } from "../ui/Logo";
import { usePwaInstall } from "../../hooks/usePwaInstall";
import { haptic } from "../../lib/haptics";
import { springSoft } from "../../lib/motion";
import "./pwa.css";

/** Invites installation once the user has had a moment to look around. */
export default function InstallPrompt() {
  const { available, canPrompt, isIos, install, dismiss } = usePwaInstall();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!available) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 6000);
    return () => window.clearTimeout(timer);
  }, [available]);

  const close = () => {
    setVisible(false);
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="install-prompt"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={springSoft}
          role="dialog"
          aria-label="Install FinHash"
        >
          <LogoMark size={40} />
          <div className="install-prompt__text">
            <strong>Install FinHash</strong>
            {isIos && !canPrompt ? (
              <span>
                Tap <Share size={13} /> then <SquarePlus size={13} /> Add to Home
                Screen
              </span>
            ) : (
              <span>Full screen, offline-ready, one tap from your home screen</span>
            )}
          </div>

          {canPrompt && (
            <button
              className="btn btn--accent btn--sm"
              onClick={async () => {
                haptic("medium");
                const accepted = await install();
                if (accepted) setVisible(false);
                else close();
              }}
            >
              Install
            </button>
          )}

          <button
            className="icon-btn install-prompt__close"
            onClick={close}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
