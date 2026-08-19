import { Toaster } from "sonner";
import { useTheme } from "../../hooks/useTheme";
import { useIsMobile } from "../../hooks/useMediaQuery";

/** Toast surface tuned to the app's glass styling and fixed chrome. */
export default function AppToaster() {
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  return (
    <Toaster
      position={isMobile ? "top-center" : "top-right"}
      theme={theme}
      richColors
      // The toast has to clear the fixed top bar; sonner switches to
      // `mobileOffset` under 600px, so both need setting.
      offset={
        isMobile
          ? { top: "calc(env(safe-area-inset-top, 0px) + 70px)" }
          : { top: 20, right: 20 }
      }
      mobileOffset={{
        top: "calc(env(safe-area-inset-top, 0px) + 70px)",
        left: 16,
        right: 16,
      }}
      toastOptions={{
        style: {
          background: "var(--color-bg-glass)",
          backdropFilter: "blur(18px) saturate(180%)",
          WebkitBackdropFilter: "blur(18px) saturate(180%)",
          border: "1px solid var(--color-border-light)",
          color: "var(--color-text-primary)",
          borderRadius: "var(--radius-md)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
