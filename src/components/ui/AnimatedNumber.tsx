import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface Props {
  value: number;
  /** Turns the raw number into display text (currency, percent, …). */
  format: (value: number) => string;
  /** Milliseconds for the count-up. */
  duration?: number;
  className?: string;
}

/**
 * Counts from the previous value to the next one so figures feel alive.
 * Falls back to an instant swap when the user prefers reduced motion.
 */
export default function AnimatedNumber({
  value,
  format,
  duration = 650,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo — fast settle, no overshoot on money figures
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(from + delta * eased);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration, reduceMotion]);

  return <span className={className}>{format(display)}</span>;
}
