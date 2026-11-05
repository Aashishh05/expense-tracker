import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategoryStat } from '@/types';
import { CHART_COLORS } from '@/utils/constants';
import { formatCurrency } from '@/utils/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { PieIcon } from '@/components/icons';

interface ExpensePieChartProps {
  data: CategoryStat[];
  currency: string;
}

export function ExpensePieChart({ data, currency }: ExpensePieChartProps) {
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
            wrapperStyle={{ fontSize: 12.5, color: '#6e6e73', paddingTop: 8 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e8e8ed',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  background: '#ffffff',
  fontSize: 13,
  padding: '8px 12px',
} as const;

export function currencyFormatter(currency: string) {
  return (value: unknown) => formatCurrency(Number(value), currency);
}
