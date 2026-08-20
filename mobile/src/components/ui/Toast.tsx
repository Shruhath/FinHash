import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, Layout } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react-native";
import Text from "./Text";
import { radius, shadow, space, useTheme } from "@/theme";

type ToastTone = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi>({
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const DURATIONS: Record<ToastTone, number> = {
  success: 2600,
  info: 2600,
  warning: 4200,
  error: 4200,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const push = useCallback((tone: ToastTone, title: string, description?: string) => {
    const id = ++nextId.current;
    setItems((prev) => [...prev.slice(-2), { id, tone, title, description }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, DURATIONS[tone]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, description) => push("success", title, description),
      error: (title, description) => push("error", title, description),
      warning: (title, description) => push("warning", title, description),
      info: (title, description) => push("info", title, description),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport items={items} />
    </ToastContext.Provider>
  );
}

function ToastViewport({ items }: { items: ToastItem[] }) {
  const insets = useSafeAreaInsets();

  if (items.length === 0) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: insets.top + space.sm,
        left: space.lg,
        right: space.lg,
        gap: space.sm,
        zIndex: 1000,
      }}
    >
      {items.map((item) => (
        <ToastRow key={item.id} item={item} />
      ))}
    </View>
  );
}

function ToastRow({ item }: { item: ToastItem }) {
  const { colors, isDark } = useTheme();

  const tone = {
    success: { color: colors.success, Icon: CheckCircle2 },
    error: { color: colors.danger, Icon: XCircle },
    warning: { color: colors.warning, Icon: TriangleAlert },
    info: { color: colors.accent, Icon: Info },
  }[item.tone];

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(20)}
      exiting={FadeOutUp.duration(180)}
      layout={Layout.springify().damping(20)}
      style={[
        {
          borderRadius: radius.md,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        shadow(colors, "md"),
      ]}
    >
      <BlurView
        intensity={40}
        tint={isDark ? "dark" : "light"}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: space.md,
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          backgroundColor: colors.glass,
        }}
      >
        <tone.Icon size={18} color={tone.color} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2}>
            {item.title}
          </Text>
          {item.description ? (
            <Text variant="caption" tone="muted" numberOfLines={3}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </BlurView>
    </Animated.View>
  );
}
