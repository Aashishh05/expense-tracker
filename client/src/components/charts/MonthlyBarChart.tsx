import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MonthlyStat } from '@/types';
import { compactNumber } from '@/utils/format';
import { useChartTooltip, useChartVar } from '@/utils/chartTheme';
import { currencyFormatter } from './ExpensePieChart';

interface MonthlyBarChartProps {
  data: MonthlyStat[];
  currency: string;
}

export function MonthlyBarChart({ data, currency }: MonthlyBarChartProps) {
  const cssVar = useChartVar();
  const tooltipStyle = useChartTooltip();

  const tickFill = cssVar('--ink-2', '#6d5c57');

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke={cssVar('--chart-grid', 'rgba(0,0,0,0.055)')} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: tickFill }}
            axisLine={{ stroke: cssVar('--line', '#e8dcbc') }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tickFormatter={(value: number) => compactNumber(Number(value), currency)}
            tick={{ fontSize: 11, fill: tickFill }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: cssVar('--chart-cursor', 'rgba(0,0,0,0.035)') }}
            contentStyle={tooltipStyle}
            formatter={currencyFormatter(currency)}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: tickFill }}>{value}</span>}
            wrapperStyle={{ fontSize: 12.5 }}
          />
          <Bar
            dataKey="income"
            name="Income"
            fill={cssVar('--income', '#15803d')}
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="expense"
            name="Expense"
            fill={cssVar('--expense', '#a3123c')}
            radius={[5, 5, 0, 0]}
            maxBarSize={22}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
