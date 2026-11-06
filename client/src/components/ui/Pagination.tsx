import type { Pagination as PaginationData } from '@/types';
import { cn } from '@/utils/format';
import { IconButton } from './Button';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react';
import React from 'react';

interface PaginationProps {
  pagination: PaginationData;
  onChange: (page: number) => void;
}

export function Pagination({ pagination, onChange }: PaginationProps) {
  const { page, pages, total } = pagination;
  if (total === 0 || pages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = (): (number | string)[] => {
    const delta = 1; // how many pages around current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    range.forEach((num, index) => {
      if (index > 0 && num - range[index - 1] > 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(num);
    });

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-1">
      <p className="text-[12.5px] text-ink-2 order-last sm:order-none">
        <span className="nums font-medium">{total}</span> {total === 1 ? 'item' : 'items'}
      </p>
      <div className="flex items-center gap-1" role="navigation" aria-label="Pagination">
        <IconButton
          label="Previous page"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={cn('min-w-[40px]', page <= 1 && 'opacity-40 cursor-not-allowed')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </IconButton>
        {pageNumbers.map((num, index) => (
          <React.Fragment key={index}>
            {num === '...' ? (
              <span className="px-2 text-[13px] text-ink-3" aria-hidden="true">…</span>
            ) : (
              <button
                onClick={() => onChange(num as number)}
                disabled={page === num}
                className={cn(
                  'min-w-[40px] h-9 rounded-xl text-[13px] font-medium transition-colors',
                  page === num
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-ink-2 hover:bg-ink/[0.05]'
                )}
                aria-label={`Page ${num}`}
                aria-current={page === num ? 'page' : undefined}
              >
                {num}
              </button>
            )}
          </React.Fragment>
        ))}
        <IconButton
          label="Next page"
          onClick={() => onChange(page + 1)}
          disabled={page >= pages}
          className={cn('min-w-[40px]', page >= pages && 'opacity-40 cursor-not-allowed')}
        >
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  );
}
