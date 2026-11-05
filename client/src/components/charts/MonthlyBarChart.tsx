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
import { tooltipStyle, currencyFormatter } from './ExpensePieChart';

interface MonthlyBarChartProps {
  data: MonthlyStat[];
  currency: string;
}

export function MonthlyBarChart({ data, currency }: MonthlyBarChartProps) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.055)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6e6e73' }}
            axisLine={{ stroke: '#e8e8ed' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tickFormatter={(value: number) => compactNumber(Number(value))}
            tick={{ fontSize: 11, fill: '#6e6e73' }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.035)' }}
            contentStyle={tooltipStyle}
            formatter={currencyFormatter(currency)}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12.5, color: '#6e6e73' }} />
          <Bar dataKey="income" name="Income" fill="#16a34a" radius={[5, 5, 0, 0]} maxBarSize={22} />
          <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[5, 5, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
