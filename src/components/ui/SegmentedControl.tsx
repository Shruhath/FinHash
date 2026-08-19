import { LayoutGroup, motion } from "framer-motion";
import { useId } from "react";
import { haptic } from "../../lib/haptics";
import { springSnappy } from "../../lib/motion";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch to fill the container — the default on mobile rows. */
  fluid?: boolean;
  size?: "sm" | "md";
}

/** iOS-style tab switcher with a spring-animated selection pill. */
export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  fluid = false,
  size = "md",
}: Props<T>) {
  const groupId = useId();

  return (
    <LayoutGroup id={groupId}>
      <div
        className={`segmented segmented--${size} ${fluid ? "segmented--fluid" : ""}`}
        role="tablist"
      >
        {segments.map((segment) => {
          const active = segment.value === value;
          return (
            <button
              key={segment.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={`segmented__item ${active ? "segmented__item--active" : ""}`}
              onClick={() => {
                if (!active) haptic("light");
                onChange(segment.value);
              }}
            >
              {active && (
                <motion.span
                  layoutId="segmented-pill"
                  className="segmented__pill"
                  transition={springSnappy}
                />
              )}
              <span className="segmented__label">{segment.label}</span>
            </button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
