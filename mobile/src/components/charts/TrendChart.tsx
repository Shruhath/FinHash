import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Defs, LinearGradient, Line, Path, Stop } from "react-native-svg";
import Animated, { FadeIn } from "react-native-reanimated";
import { scaleLinear, scalePoint } from "d3-scale";
import { area as d3Area, line as d3Line, curveMonotoneX } from "d3-shape";
import Text from "../ui/Text";
import { brand, fonts, useTheme } from "@/theme";

export interface TrendDatum {
  monthLabel: string;
  value: number;
}

interface Props {
  data: TrendDatum[];
  height?: number;
  formatCompact: (value: number) => string;
}

const PADDING = { top: 12, right: 8, bottom: 24, left: 46 };

/** Filled area chart used for the spending trend. */
export default function TrendChart({ data, height = 220, formatCompact }: Props) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const chart = useMemo(() => {
    if (width === 0 || data.length === 0) return null;

    const innerWidth = width - PADDING.left - PADDING.right;
    const innerHeight = height - PADDING.top - PADDING.bottom;

    const x = scalePoint<string>()
      .domain(data.map((d) => d.monthLabel))
      .range([0, innerWidth]);

    const y = scaleLinear()
      .domain([0, Math.max(1, ...data.map((d) => d.value))])
      .nice()
      .range([innerHeight, 0]);

    const linePath =
      d3Line<TrendDatum>()
        .x((d) => x(d.monthLabel) ?? 0)
        .y((d) => y(d.value))
        .curve(curveMonotoneX)(data) ?? "";

    const areaPath =
      d3Area<TrendDatum>()
        .x((d) => x(d.monthLabel) ?? 0)
        .y0(innerHeight)
        .y1((d) => y(d.value))
        .curve(curveMonotoneX)(data) ?? "";

    return { innerHeight, y, linePath, areaPath, ticks: y.ticks(4) };
  }, [width, height, data]);

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {chart ? (
        <Animated.View entering={FadeIn.duration(320)}>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={brand.orange400} stopOpacity={0.45} />
                <Stop offset="1" stopColor={brand.orange500} stopOpacity={0} />
              </LinearGradient>
            </Defs>

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

            <Path
              d={chart.areaPath}
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
              fill="url(#trendFill)"
            />
            <Path
              d={chart.linePath}
              transform={`translate(${PADDING.left}, ${PADDING.top})`}
              stroke={colors.accent}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>

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
              marginTop: -PADDING.bottom + 4,
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
        </Animated.View>
      ) : (
        <View style={{ height }} />
      )}
    </View>
  );
}
