import { Link } from 'react-router-dom';
import type { Transaction } from '@/types';
import { formatDate, formatCurrency, softColor } from '@/utils/format';
import { PencilIcon, TrashIcon, ReceiptIcon, RepeatIcon, PaperclipIcon } from '@/components/icons';
import { IconButton } from '@/components/ui/Button';

interface TransactionListProps {
  data: Transaction[];
  currency: string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  /** Opens the receipt viewer; the paperclip only shows when it's provided. */
  onViewReceipt?: (transaction: Transaction) => void;
  /** Adds the author name to each row (shared group feeds are read-only). */
  showPayer?: boolean;
  showActions?: boolean;
}

function CategoryChip({ transaction }: { transaction: Transaction }) {
  const category =
    typeof transaction.category === 'object' && transaction.category !== null
      ? transaction.category
      : null;
  const color = category?.color || '#64748b';
  return (
    <span
      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px]"
      style={{ backgroundColor: softColor(color) }}
      aria-hidden="true"
    >
      {category?.icon || '🧾'}
    </span>
  );
}

function categoryMeta(transaction: Transaction) {
  const category =
    typeof transaction.category === 'object' && transaction.category !== null
      ? transaction.category
      : null;
  return {
    name: category?.name ?? 'Uncategorized',
    note: transaction.note ?? '',
  };
}

export function TransactionList({
  data,
  currency,
  onEdit,
  onDelete,
  onViewReceipt,
  showPayer = false,
  showActions = true,
}: TransactionListProps) {
  const rowHasActions = (transaction: Transaction) =>
    Boolean(showActions) || (Boolean(transaction.receipt) && Boolean(onViewReceipt));
  const headerHasActions =
    Boolean(showActions) || data.some((t) => Boolean(t.receipt) && Boolean(onViewReceipt));

  const payerOf = (transaction: Transaction): string | null => {
    if (!showPayer) return null;
    return typeof transaction.user === 'object' && transaction.user !== null
      ? transaction.user.name
      : null;
  };

  return (
    <>
      {/* Mobile cards */}
      <ul className="divide-y divide-line md:hidden">
        {data.map((transaction) => {
          const { name, note } = categoryMeta(transaction);
          return (
            <li key={transaction._id} className="flex items-center gap-3 px-4 py-3">
              <CategoryChip transaction={transaction} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-ink">
                  {name}
                  {transaction.recurring && (
                    <RepeatIcon aria-label="Recurring" className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-2px] text-ink-3" />
                  )}
                </p>
                <p className="truncate text-[12.5px] text-ink-2">
                  {[payerOf(transaction), note || formatDate(transaction.date)].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`nums text-[14.5px] font-semibold ${
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '−'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
                <p className="text-[11.5px] text-ink-3">{formatDate(transaction.date)}</p>
              </div>
              {rowHasActions(transaction) && (
                <div className="ml-1 flex flex-col gap-0.5">
                  {transaction.receipt && onViewReceipt && (
                    <IconButton label="View receipt" onClick={() => onViewReceipt(transaction)}>
                      <PaperclipIcon className="h-4 w-4" />
                    </IconButton>
                  )}
                  {showActions && (
                    <>
                      <IconButton label="Edit" tone="accent" onClick={() => onEdit(transaction)}>
                        <PencilIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton label="Delete" tone="danger" onClick={() => onDelete(transaction)}>
                        <TrashIcon className="h-4 w-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Desktop table */}
      <table className="hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-line text-[12.5px] font-medium text-ink-2">
            <th className="px-4 py-2.5 font-medium">Category</th>
            <th className="px-4 py-2.5 font-medium">Date</th>
            <th className="px-4 py-2.5 text-right font-medium">Amount</th>
            {headerHasActions && <th className="w-24 px-4 py-2.5 font-medium" aria-label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {data.map((transaction) => {
            const { name, note } = categoryMeta(transaction);
            return (
              <tr key={transaction._id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-ink/[0.02]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CategoryChip transaction={transaction} />
                    <div className="min-w-0">
                      <p className="text-[14.5px] font-medium text-ink">
                        {name}
                        {transaction.recurring && (
                          <RepeatIcon aria-label="Recurring" className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-2px] text-ink-3" />
                        )}
                      </p>
                      {note && <p className="truncate text-[12.5px] text-ink-2">{[payerOf(transaction), note].filter(Boolean).join(' · ')}</p>}
                      {!note && payerOf(transaction) && (
                        <p className="truncate text-[12.5px] text-ink-2">{payerOf(transaction)}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="nums px-4 py-3 text-[13.5px] text-ink-2">
                  {formatDate(transaction.date)}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`nums text-[14.5px] font-semibold ${
                      transaction.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatCurrency(transaction.amount, currency)}
                  </span>
                </td>
                {rowHasActions(transaction) && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-0.5">
                      {transaction.receipt && onViewReceipt && (
                        <IconButton label="View receipt" onClick={() => onViewReceipt(transaction)}>
                          <PaperclipIcon className="h-4 w-4" />
                        </IconButton>
                      )}
                      {showActions && (
                        <>
                          <IconButton label="Edit" tone="accent" onClick={() => onEdit(transaction)}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton label="Delete" tone="danger" onClick={() => onDelete(transaction)}>
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

/** Small compact row used on the dashboard's recent list. */
export function RecentRow({ transaction, currency }: { transaction: Transaction; currency: string }) {
  const { name, note } = categoryMeta(transaction);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <CategoryChip transaction={transaction} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14.5px] font-medium text-ink">
          {note || name}
          {transaction.recurring && (
            <RepeatIcon aria-label="Recurring" className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-2px] text-ink-3" />
          )}
          {transaction.receipt && (
            <PaperclipIcon aria-label="Receipt" className="ml-1 inline h-3.5 w-3.5 shrink-0 align-[-2px] text-ink-3" />
          )}
        </p>
        <p className="text-[12.5px] text-ink-2">
          {name} · {formatDate(transaction.date)}
        </p>
      </div>
      <span
        className={`nums text-[14.5px] font-semibold ${
          transaction.type === 'income' ? 'text-income' : 'text-expense'
        }`}
      >
        {transaction.type === 'income' ? '+' : '−'}
        {formatCurrency(transaction.amount, currency)}
      </span>
    </li>
  );
}

export function EmptyTransactions({ href, ctaLabel }: { href: string; ctaLabel: string }) {
  return (
    <div className="px-4 md:px-0">
      <div className="card bg-transparent shadow-none border-dashed">
        <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <div className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-ink/[0.04] text-ink-3">
            <ReceiptIcon className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-medium text-ink">No transactions yet</p>
          <p className="max-w-[38ch] text-[13.5px] text-ink-2">
            Track your first income or expense and the dashboard will come alive.
          </p>
          <Link
            to={href}
            className="mt-2 rounded-xl bg-accent px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[#0077ed] active:scale-95"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
