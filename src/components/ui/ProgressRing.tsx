import { motion, useReducedMotion } from "framer-motion";

interface Props {
  /** 0–100 */
  value: number;
  size?: number;
  thickness?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/** Circular progress used by goal cards and the budget overview. */
export default function ProgressRing({
  value,
  size = 84,
  thickness = 8,
  color = "var(--color-accent)",
  trackColor = "var(--color-bg-hover)",
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduceMotion ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
          }
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      {children && <div className="progress-ring__center">{children}</div>}
    </div>
  );
}
