/**
 * FinHash design tokens — the native counterpart of the web app's CSS
 * custom properties. Values are kept identical so the two clients read as
 * one product.
 */

export const brand = {
  orange50: "#fff4ec",
  orange100: "#ffe2cd",
  orange200: "#ffc296",
  orange300: "#ff9d5c",
  orange400: "#f5782a",
  orange500: "#cc5500",
  orange600: "#b34900",
  orange700: "#8d3900",
  orange800: "#632800",
  orange900: "#3d1900",
} as const;

const semantic = {
  success: "#2fbf6b",
  successSoft: "rgba(47, 191, 107, 0.13)",
  warning: "#f0a020",
  warningSoft: "rgba(240, 160, 32, 0.13)",
  danger: "#f0483c",
  dangerSoft: "rgba(240, 72, 60, 0.13)",
  info: "#3b9dff",
} as const;

const accent = {
  accent: brand.orange500,
  accentHover: "#e06000",
  accentSoft: "rgba(204, 85, 0, 0.14)",
  accentSofter: "rgba(204, 85, 0, 0.07)",
  accentRing: "rgba(204, 85, 0, 0.35)",
  onAccent: "#ffffff",
} as const;

export const darkColors = {
  ...semantic,
  ...accent,
  income: semantic.success,
  expense: semantic.danger,

  bg: "#000000",
  bgSecondary: "#08080a",
  bgCard: "#0e0e11",
  bgElevated: "#17171b",
  bgHover: "#1e1e23",
  bgInput: "#121216",
  scrim: "rgba(0, 0, 0, 0.68)",
  glass: "rgba(8, 8, 10, 0.86)",

  text: "#f7f7f8",
  textSecondary: "#a8a8b2",
  textMuted: "#7c7c87",
  textFaint: "#55555f",

  border: "rgba(255, 255, 255, 0.07)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  borderStrong: "rgba(255, 255, 255, 0.18)",

  /** Tint used behind translucent stat cards inside gradient heroes. */
  inlay: "rgba(255, 255, 255, 0.035)",
} as const;

/** Both palettes share these keys; values are plain colour strings. */
export type Colors = { [K in keyof typeof darkColors]: string };

export const lightColors: Colors = {
  ...semantic,
  ...accent,
  income: semantic.success,
  expense: semantic.danger,

  bg: "#f6f5f3",
  bgSecondary: "#ffffff",
  bgCard: "#ffffff",
  bgElevated: "#fbfaf8",
  bgHover: "#f1efec",
  bgInput: "#f4f2ef",
  scrim: "rgba(24, 18, 12, 0.4)",
  glass: "rgba(255, 255, 255, 0.9)",

  text: "#14100c",
  textSecondary: "#605a52",
  textMuted: "#78716a",
  textFaint: "#a49d94",

  border: "rgba(20, 16, 12, 0.09)",
  borderLight: "rgba(20, 16, 12, 0.14)",
  borderStrong: "rgba(20, 16, 12, 0.22)",

  accentSoft: "rgba(204, 85, 0, 0.1)",
  accentSofter: "rgba(204, 85, 0, 0.05)",

  inlay: "rgba(20, 16, 12, 0.025)",
};

export const space = {
  "2xs": 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
  "4xl": 64,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  "2xl": 32,
  full: 999,
} as const;

export const fontSize = {
  "2xs": 11,
  xs: 12,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  "2xl": 28,
  "3xl": 36,
  "4xl": 48,
} as const;

/** Loaded via @expo-google-fonts; keys match the exported font names. */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  display: "Sora_600SemiBold",
  displayBold: "Sora_700Bold",
  displayHeavy: "Sora_800ExtraBold",
  numeric: "Sora_700Bold",
  numericSemi: "Sora_600SemiBold",
} as const;

export const duration = {
  fast: 140,
  normal: 220,
  slow: 380,
} as const;

/** Shared spring config so every transition settles the same way. */
export const springs = {
  soft: { damping: 34, stiffness: 380, mass: 0.7 },
  snappy: { damping: 38, stiffness: 520, mass: 0.6 },
  bouncy: { damping: 18, stiffness: 300, mass: 0.8 },
} as const;

export const layout = {
  tabBarHeight: 62,
  fabSize: 54,
  headerHeight: 52,
  maxContentWidth: 720,
} as const;

export function shadow(colors: Colors, level: "sm" | "md" | "lg") {
  const isDark = colors.bg === "#000000";
  const opacity = isDark ? { sm: 0.5, md: 0.55, lg: 0.6 } : { sm: 0.07, md: 0.09, lg: 0.12 };
  const config = {
    sm: { radius: 8, offset: 2, elevation: 2 },
    md: { radius: 24, offset: 8, elevation: 6 },
    lg: { radius: 48, offset: 20, elevation: 12 },
  }[level];

  return {
    shadowColor: isDark ? "#000000" : "#18120c",
    shadowOpacity: opacity[level],
    shadowRadius: config.radius,
    shadowOffset: { width: 0, height: config.offset },
    elevation: config.elevation,
  };
}

/** Accent glow used on primary buttons and the tab-bar action button. */
export function accentShadow() {
  return {
    shadowColor: brand.orange500,
    shadowOpacity: 0.42,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  };
}
