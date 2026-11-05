import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center gap-2 px-6 py-10 text-center'
          : 'flex flex-col items-center justify-center gap-2 px-6 py-16 text-center'
      }
    >
      {icon && (
        <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.04] text-ink-3">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description && <p className="max-w-[36ch] text-[13.5px] text-ink-2">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
