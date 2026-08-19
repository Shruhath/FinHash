import { motion } from "framer-motion";
import { LogoMark } from "./Logo";

/** Full-screen brand hold while auth and the user record resolve. */
export default function SplashScreen({ label }: { label?: string }) {
  return (
    <div className="splash">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <LogoMark size={72} animated />
      </motion.div>
      <motion.div
        className="splash__bar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="splash__bar-fill" />
      </motion.div>
      {label && <p className="splash__label">{label}</p>}
    </div>
  );
}
