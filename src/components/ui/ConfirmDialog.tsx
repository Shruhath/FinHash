import { ReactNode } from "react";
import Sheet from "./Sheet";
import { haptic } from "../../lib/haptics";

interface Props {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "accent";
  onConfirm: () => void;
  onCancel: () => void;
}

/** Replaces window.confirm so destructive actions match the app's surface. */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} size="sm">
      <div className="confirm">
        <div className="confirm__message">{message}</div>
        <div className="confirm__actions">
          <button className="btn btn--ghost btn--block" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`btn btn--block ${tone === "danger" ? "btn--danger-solid" : "btn--accent"}`}
            onClick={() => {
              haptic(tone === "danger" ? "warning" : "medium");
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
