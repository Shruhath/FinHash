import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Line, Path, Rect } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { scaleLinear, scalePoint } from "d3-scale";
import { line as d3Line, curveMonotoneX } from "d3-shape";
import Text from "../ui/Text";
import { fonts, fontSize, space, useTheme } from "@/theme";
import { haptic } from "@/lib/haptics";

export interface TrendPoint {
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

interface Props {
  data: TrendPoint[];
  height?: number;
  formatCompact: (value: number) => string;
  formatFull: (value: number) => string;
}

const PADDING = { top: 12, right: 8, bottom: 26, left: 46 };

/** Income/expense bars with a net line laid over them. */
export default function CashFlowChart({
  data,
  height = 240,
  formatCompact,
  formatFull,
}: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (width === 0 || data.length === 0) return null;

    const innerWidth = width - PADDING.left - PADDING.right;
    const innerHeight = height - PADDING.top - PADDING.bottom;

    const maxValue = Math.max(
      1,
      ...data.map((d) => Math.max(d.income, d.expense, Math.abs(d.balance)))
    );

    const x = scalePoint<string>()
      .domain(data.map((d) => d.monthLabel))
      .range([0, innerWidth])
      .padding(0.5);

    const y = scaleLinear().domain([0, maxValue]).nice().range([innerHeight, 0]);

    const barWidth = Math.min(16, (innerWidth / data.length) * 0.28);

    const netLine =
      d3Line<TrendPoint>()
        .x((d) => x(d.monthLabel) ?? 0)
        .y((d) => y(Math.max(0, d.balance)))
        .curve(curveMonotoneX)(data) ?? "";

    return { innerWidth, innerHeight, x, y, barWidth, netLine, ticks: y.ticks(4) };
  }, [width, height, data]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {chart ? (
        <Animated.View entering={FadeIn.duration(320)}>
          <Svg width={width} height={height}>
            {/* Grid */}
            {chart.ticks.map((tick) => (
              <Line
                key={tick}
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={PADDING.top + chart.y(tick)}
                y2={PADDING.top + chart.y(tick)}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="2 6"
              />
            ))}

            {/* Income bars */}
            {data.map((point, index) => {
              const cx = PADDING.left + (chart.x(point.monthLabel) ?? 0);
              const barY = PADDING.top + chart.y(point.income);
              return (
                <Rect
                  key={`${point.monthLabel}-in`}
                  x={cx - chart.barWidth - 2}
                  y={barY}
                  width={chart.barWidth}
                  height={Math.max(1, PADDING.top + chart.innerHeight - barY)}
                  rx={4}
                  fill={colors.income}
                  opacity={active !== null && active !== index ? 0.3 : 1}
                />
              );
            })}

            {/* Expense bars */}
            {data.map((point, index) => {
              const cx = PADDING.left + (chart.x(point.monthLabel) ?? 0);
              const barY = PADDING.top + chart.y(point.expense);
              return (
                <Rect
                  key={`${point.monthLabel}-out`}
                  x={cx + 2}
                  y={barY}
                  width={chart.barWidth}
                  height={Math.max(1, PADDING.top + chart.innerHeight - barY)}
                  rx={4}
                  fill={colors.expense}
                  opacity={active !== null && active !== index ? 0.3 : 1}
                />
              );
            })}

            <Path
              d={chart.netLine}
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
              stroke={colors.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />

            {/* Transparent columns capture the tap for the read-out below */}
            {data.map((point, index) => {
              const cx = PADDING.left + (chart.x(point.monthLabel) ?? 0);
              const slot = chart.innerWidth / data.length;
              return (
                <Rect
                  key={`${point.monthLabel}-hit`}
                  x={cx - slot / 2}
                  y={PADDING.top}
                  width={slot}
                  height={chart.innerHeight}
                  fill="transparent"
                  onPress={() => {
                    haptic("light");
                    setActive(index === active ? null : index);
                  }}
                />
              );
            })}
          </Svg>

          {/* Axis labels are React Native text so they inherit the font stack */}
          <View style={{ position: "absolute", left: 0, top: PADDING.top, width: PADDING.left - 6 }}>
            {chart.ticks.map((tick) => (
              <Text
                key={tick}
                numberOfLines={1}
                style={{
                  position: "absolute",
                  top: chart.y(tick) - 7,
                  right: 0,
                  fontFamily: fonts.regular,
                  fontSize: 10,
                  color: colors.textMuted,
                }}
              >
                {formatCompact(tick)}
              </Text>
            ))}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingLeft: PADDING.left,
              paddingRight: PADDING.right,
              marginTop: -PADDING.bottom + 6,
            }}
          >
            {data.map((point) => (
              <Text
                key={point.monthLabel}
                style={{ fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted }}
              >
                {point.monthLabel}
              </Text>
            ))}
          </View>

          {active !== null && data[active] ? (
            <Animated.View
              entering={FadeIn.duration(140)}
              style={{
                marginTop: space.md,
                padding: space.md,
                borderRadius: 12,
                backgroundColor: colors.bgElevated,
                borderWidth: 1,
                borderColor: colors.borderLight,
                gap: 4,
              }}
            >
              <Text variant="bodyStrong">{data[active].monthLabel}</Text>
              <Row label="Income" value={formatFull(data[active].income)} color={colors.income} />
              <Row label="Expenses" value={formatFull(data[active].expense)} color={colors.expense} />
              <Row label="Net" value={formatFull(data[active].balance)} color={colors.accent} />
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.numeric, fontSize: fontSize.xs }}>{value}</Text>
    </View>
  );
}
