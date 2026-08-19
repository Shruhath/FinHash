import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { haptic } from "../../lib/haptics";

interface Props {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  /** Blocks stepping past the current period. */
  nextDisabled?: boolean;
  /** Jump straight back to today. */
  onReset?: () => void;
  resetLabel?: string;
}

/** Month/year stepper with a directional slide on the label. */
export default function PeriodStepper({
  label,
  onPrev,
  onNext,
  nextDisabled,
  onReset,
  resetLabel = "Today",
}: Props) {
  const direction = useRef(1);

  const step = (dir: number, fn: () => void) => {
    direction.current = dir;
    haptic("light");
    fn();
  };

  return (
    <div className="period-stepper">
      <button
        type="button"
        className="period-stepper__btn"
        onClick={() => step(-1, onPrev)}
        aria-label="Previous period"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="period-stepper__display">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={label}
            className="period-stepper__label"
            initial={{ opacity: 0, x: direction.current * 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction.current * -16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        className="period-stepper__btn"
        onClick={() => step(1, onNext)}
        disabled={nextDisabled}
        aria-label="Next period"
      >
        <ChevronRight size={18} />
      </button>

      {onReset && (
        <button
          type="button"
          className="period-stepper__reset"
          onClick={() => {
            haptic("light");
            onReset();
          }}
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
