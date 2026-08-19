import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "../ui/ChartTooltip";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  formatValue: (value: number) => string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
}

/**
 * Lazily loaded so recharts stays out of the first paint — the dashboard
 * renders long before this chart matters.
 */
export default function CategoryDonut({
  data,
  formatValue,
  height = 188,
  innerRadius = 62,
  outerRadius = 88,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2.5}
          dataKey="value"
          stroke="none"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          content={<ChartTooltip formatValue={formatValue} />}
          cursor={false}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
