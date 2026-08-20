import { ReactNode } from "react";
import { View } from "react-native";
import Sheet from "./Sheet";
import Button from "./Button";
import Text from "./Text";
import { space } from "@/theme";
import { haptic } from "@/lib/haptics";

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

/** Destructive confirmations use the app's own surface, not a system alert. */
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
    <Sheet open={open} onClose={onCancel} title={title} snapPoint="42%">
      <View style={{ gap: space.xl }}>
        {typeof message === "string" ? (
          <Text variant="body" tone="secondary">
            {message}
          </Text>
        ) : (
          message
        )}

        <View style={{ flexDirection: "row", gap: space.sm }}>
          <Button
            label={cancelLabel}
            variant="ghost"
            onPress={onCancel}
            style={{ flex: 1 }}
            block
          />
          <Button
            label={confirmLabel}
            variant={tone === "danger" ? "danger" : "accent"}
            onPress={() => {
              haptic(tone === "danger" ? "warning" : "medium");
              onConfirm();
            }}
            style={{ flex: 1 }}
            block
          />
        </View>
      </View>
    </Sheet>
  );
}
