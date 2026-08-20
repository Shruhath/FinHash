import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

type Pattern = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Mirrors the web app's haptics helper. Android's generic vibrate is coarse,
 * so selection-level taps map to the lightest impact available.
 */
export function haptic(pattern: Pattern = "light") {
  if (Platform.OS === "web") return;

  try {
    switch (pattern) {
      case "light":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case "medium":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case "heavy":
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case "success":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "warning":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "error":
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch {
    /* haptics are best-effort */
  }
}
