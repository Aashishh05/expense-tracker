import type { Pagination as PaginationData } from '@/types';
import { cn } from '@/utils/format';
import { IconButton } from './Button';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  pagination: PaginationData;
  onChange: (page: number) => void;
}

export function Pagination({ pagination, onChange }: PaginationProps) {
  const { page, pages, total } = pagination;
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <p className="text-[13px] text-ink-2">
        <span className="nums">{total}</span> {total === 1 ? 'item' : 'items'}
      </p>
      <div className="flex items-center gap-1">
        <IconButton label="Previous page" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        <span
          className={cn('min-w-[4.2rem] text-center text-[13px] text-ink-2')}
          aria-live="polite"
        >
          Page <span className="nums">{page}</span> of <span className="nums">{pages}</span>
        </span>
        <IconButton
          label="Next page"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
}
