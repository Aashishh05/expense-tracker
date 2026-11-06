import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryStat } from '@/types';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/format';
import { useChartTooltip, useChartVar } from '@/utils/chartTheme';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChartPie as PieIcon } from 'lucide-react';

interface ExpensePieChartProps {
  data: CategoryStat[];
  currency: string;
}

export function ExpensePieChart({ data, currency }: ExpensePieChartProps) {
  // Called before the early return so the hook order stays stable.
  const cssVar = useChartVar();
  const tooltipStyle = useChartTooltip();

  if (!data.length) {
    return (
      <EmptyState
        compact
        icon={<PieIcon className="h-6 w-6" />}
        title="No expenses this month"
        description="Once you log expenses, the breakdown appears here."
      />
    );
  }

  const slices = data.map((d, i) => ({
    name: d.name,
    value: d.total,
    color: d.color || CHART_COLORS[i % CHART_COLORS.length],
  }));

  const legendColor = cssVar('--ink-2', '#6d5c57');

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius="56%"
            outerRadius="82%"
            paddingAngle={2}
            cornerRadius={5}
            strokeWidth={0}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={currencyFormatter(currency)} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: legendColor }}>{value}</span>}
            wrapperStyle={{ fontSize: 12.5, paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function currencyFormatter(currency: string) {
  return (value: unknown) => formatCurrency(Number(value), currency);
}
