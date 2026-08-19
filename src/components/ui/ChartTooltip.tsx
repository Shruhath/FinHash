interface Payload {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
  payload?: { color?: string; name?: string };
}

interface Props {
  active?: boolean;
  payload?: Payload[];
  label?: string | number;
  formatValue: (value: number) => string;
  /** Maps a series key to a readable name for multi-series charts. */
  labelFor?: Record<string, string>;
}

/**
 * Recharts' inline `contentStyle` can't read CSS custom properties reliably
 * across themes, so tooltips render as a real component instead.
 */
export default function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  labelFor,
}: Props) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tip">
      {label !== undefined && <p className="chart-tip__label">{label}</p>}
      {payload.map((entry, i) => {
        const key = String(entry.dataKey ?? entry.name ?? i);
        const name = labelFor?.[key] ?? entry.payload?.name ?? entry.name ?? key;
        const color = entry.color ?? entry.payload?.color;
        return (
          <div className="chart-tip__row" key={i}>
            {color && (
              <span className="dot" style={{ backgroundColor: color }} />
            )}
            <span className="chart-tip__name">{name}</span>
            <span className="chart-tip__value money">
              {formatValue(entry.value ?? 0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
