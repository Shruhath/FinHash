import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import Text, { type TextProps } from "./Text";

interface Props extends Omit<TextProps, "children"> {
  value: number;
  format: (value: number) => string;
  /** Milliseconds for the count-up. */
  duration?: number;
}

/**
 * Counts from the previous value to the next so figures feel alive.
 * Honours the OS "reduce motion" setting by swapping instantly instead.
 */
export default function AnimatedNumber({
  value,
  format,
  duration = 650,
  ...textProps
}: Props) {
  const [display, setDisplay] = useState(value);
  const [reduceMotion, setReduceMotion] = useState(false);
  const fromRef = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
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
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration, reduceMotion]);

  return <Text {...textProps}>{format(display)}</Text>;
}
