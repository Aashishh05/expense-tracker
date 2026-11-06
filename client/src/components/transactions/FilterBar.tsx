import type { Category, TransactionType } from '@/types';
import { Select } from '@/components/ui/Input';
import { X as XIcon, Search as SearchIcon } from 'lucide-react';
import { cn } from '@/utils/format';

export interface TxnFilterState {
  type: '' | TransactionType;
  category: string;
  startDate: string;
  endDate: string;
  search: string;
}

interface FilterBarProps {
  filters: TxnFilterState;
  onChange: (patch: Partial<TxnFilterState>) => void;
  onClear: () => void;
  categories: Category[];
  error?: string | null;
}

const TYPE_OPTIONS: Array<{ value: '' | TransactionType; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export function FilterBar({ filters, onChange, onClear, categories, error }: FilterBarProps) {
  const activeCount =
    (filters.type ? 1 : 0) +
    (filters.category ? 1 : 0) +
    (filters.startDate ? 1 : 0) +
    (filters.endDate ? 1 : 0) +
    (filters.search ? 1 : 0);

  return (
    <div className="card space-y-3 p-4">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-ink-3" />
        <input
          type="search"
          placeholder="Search notes…"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="input pl-10"
          aria-label="Search notes"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          aria-label="Filter by type"
          value={filters.type}
          onChange={(e) => onChange({ type: e.target.value as TxnFilterState['type'] })}
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by category"
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>

        <input
          type="date"
          aria-label="Start date"
          value={filters.startDate}
          max={filters.endDate || undefined}
          onChange={(e) => onChange({ startDate: e.target.value })}
          className={cn('input', error && 'border-expense')}
        />
        <input
          type="date"
          aria-label="End date"
          value={filters.endDate}
          min={filters.startDate || undefined}
          onChange={(e) => onChange({ endDate: e.target.value })}
          className={cn('input', error && 'border-expense')}
        />
      </div>

      {activeCount > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-accent hover:bg-accent-soft"
          >
            <XIcon className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
