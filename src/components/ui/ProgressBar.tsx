import { motion, useReducedMotion } from "framer-motion";

interface Props {
  /** 0–100; values above 100 stay pinned at full width. */
  value: number;
  tone?: "accent" | "safe" | "warning" | "danger" | "exceeded";
  height?: number;
  /** Delays the fill so it animates after the card has settled. */
  delay?: number;
}

export default function ProgressBar({
  value,
  tone = "accent",
  height = 8,
  delay = 0,
}: Props) {
  const reduceMotion = useReducedMotion();
  const width = `${Math.max(0, Math.min(100, value))}%`;

  return (
    <div className="progress" style={{ height }}>
      <motion.div
        className={`progress__fill ${tone !== "accent" ? `progress__fill--${tone}` : ""}`}
        initial={{ width: 0 }}
        animate={{ width }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }
        }
      />
    </div>
  );
}
