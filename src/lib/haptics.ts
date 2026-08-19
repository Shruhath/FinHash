/** Tiny haptic helper — silently no-ops where unsupported (iOS Safari). */

type Pattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 24,
  success: [10, 40, 16],
  warning: [16, 60, 16],
  error: [24, 50, 24, 50, 24],
};

export function haptic(pattern: Pattern = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    /* ignore */
  }
}
