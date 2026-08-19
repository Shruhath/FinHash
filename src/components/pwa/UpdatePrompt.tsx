import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, X } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { springSoft } from "../../lib/motion";
import "./pwa.css";

/** Surfaces a new service worker instead of silently swapping under the user. */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Look for a new build every hour of continuous use.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          className="update-prompt"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={springSoft}
          role="status"
        >
          <RefreshCw size={16} />
          <span>A new version of FinHash is ready</span>
          <button
            className="update-prompt__action"
            onClick={() => updateServiceWorker(true)}
          >
            Reload
          </button>
          <button
            className="update-prompt__close"
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
