import { ReactNode, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { haptic } from "../../lib/haptics";
import { springSoft } from "../../lib/motion";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Pinned to the bottom of the sheet, outside the scroll area. */
  footer?: ReactNode;
  /** Widen the desktop dialog for denser forms. */
  size?: "sm" | "md" | "lg";
  /** Hide the close button when the action must be explicit. */
  dismissible?: boolean;
}

/**
 * One dialog primitive for the whole app: a drag-to-dismiss bottom sheet on
 * touch devices, a centered modal on desktop.
 */
export default function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: SheetProps) {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  // Lock the page behind the sheet without losing scroll position.
  useEffect(() => {
    if (!open) return;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open]);

  // Escape closes; focus lands inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    const timer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>(
          "input:not([type=hidden]), select, textarea, button, [tabindex]:not([tabindex='-1'])"
        )
        ?.focus({ preventScroll: true });
    }, 120);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose, dismissible]);

  const handleClose = () => {
    haptic("light");
    onClose();
  };

  const panelMotion = isMobile
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
        transition: reduceMotion ? { duration: 0 } : springSoft,
        drag: dismissible ? ("y" as const) : undefined,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.6 },
        onDragEnd: (
          _e: unknown,
          info: { offset: { y: number }; velocity: { y: number } }
        ) => {
          if (info.offset.y > 120 || info.velocity.y > 600) handleClose();
        },
      }
    : {
        initial: { opacity: 0, scale: 0.96, y: 12 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.97, y: 8 },
        transition: reduceMotion ? { duration: 0 } : springSoft,
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root" role="presentation">
          <motion.div
            className="sheet__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={dismissible ? handleClose : undefined}
          />

          <motion.div
            ref={panelRef}
            className={`sheet sheet--${size} ${isMobile ? "sheet--mobile" : "sheet--desktop"}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            {...panelMotion}
          >
            {isMobile && dismissible && <div className="sheet__grabber" />}

            {(title || dismissible) && (
              <header className="sheet__header">
                <div className="sheet__heading">
                  {title && (
                    <h2 className="sheet__title" id={titleId}>
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="sheet__description">{description}</p>
                  )}
                </div>
                {dismissible && (
                  <button
                    type="button"
                    className="icon-btn sheet__close"
                    onClick={handleClose}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </header>
            )}

            <div className="sheet__body">{children}</div>

            {footer && <footer className="sheet__footer">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
