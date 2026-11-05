import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { deleteTransaction } from '@/api/transactions';
import type { Transaction } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { FilterBar, type TxnFilterState } from '@/components/transactions/FilterBar';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Skeleton } from '@/components/ui/Loader';
import { PlusIcon, ReceiptIcon } from '@/components/icons';
import { apiMessage, cn } from '@/utils/format';
import { useLocation } from 'react-router-dom';

const PAGE_LIMIT = 10;

const emptyFilters: TxnFilterState = {
  type: '',
  category: '',
  startDate: '',
  endDate: '',
  search: '',
};

export default function Transactions() {
  const { user } = useAuth();
  const { categories } = useCategories();
  const location = useLocation();

  const [filters, setFilters] = useState<TxnFilterState>(emptyFilters);
  const [page, setPage] = useState(1);

  // Debounce the search box so the list doesn't refetch on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const firstSearchRun = useRef(true);

  useEffect(() => {
    if (firstSearchRun.current) {
      firstSearchRun.current = false;
      return;
    }
    setFilters((f) => (f.search === debouncedSearch ? f : { ...f, search: debouncedSearch }));
    setPage(1);
  }, [debouncedSearch]);

  // Deep-link from the app layout's center "+" button opens the form.
  const wantsNew = (location.state as Record<string, unknown> | null)?.add === true;
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const request = useMemo(
    () => ({
      type: filters.type,
      category: filters.category || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      search: filters.search || undefined,
      sort: '-date',
      page,
      limit: PAGE_LIMIT,
    }),
    [filters, page]
  );

  const { data, pagination, loading, error, refetch } = useTransactions(request);
  const onceDataLoaded = useRef(false);
  useEffect(() => {
    if (wantsNew && !onceDataLoaded.current) {
      onceDataLoaded.current = true;
      setEditing(null);
      setFormOpen(true);
    }
  }, [wantsNew]);

  // If a filter change empties the current page, fall back to page 1.
  useEffect(() => {
    if (!loading && pagination && page > pagination.pages) setPage(pagination.pages);
  }, [loading, pagination, page]);

  const patchFilters = useCallback((patch: Partial<TxnFilterState>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
    setSearchInput('');
    setPage(1);
  }, []);

  const openEdit = (transaction: Transaction) => {
    setEditing(transaction);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteTransaction(deleteTarget._id);
      toast.success('Transaction deleted');
      if (data.length === 1 && page > 1) setPage(page - 1);
      else refetch();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the transaction'));
    } finally {
      setDeletePending(false);
      setDeleteTarget(null);
    }
  };

  const hasAnyFilters = data.length === 0 && !loading && pagination !== null && pagination.total === 0;

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Transactions</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Every income and expense you've logged</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">Add transaction</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      <div className="space-y-3 md:space-y-4">
        <FilterBar
          filters={{ ...filters, search: searchInput }}
          onChange={(patch) => {
            if ('search' in patch) setSearchInput(patch.search ?? '');
            if (!('search' in patch)) patchFilters(patch);
          }}
          onClear={clearFilters}
          categories={categories}
        />

        {error ? (
          <div className="card">
            <EmptyState
              icon={<ReceiptIcon className="h-6 w-6" />}
              title="Couldn't load transactions"
              description={error}
            />
          </div>
        ) : loading ? (
          <ListSkeleton />
        ) : hasAnyFilters ? (
          <div className="card">
            <EmptyState
              icon={<ReceiptIcon className="h-6 w-6" />}
              title="No matching transactions"
              description="Try adjusting the filters, or clear them to see everything."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <TransactionList
              data={data}
              currency={user?.currency ?? 'NPR'}
              onEdit={openEdit}
              onDelete={(transaction) => setDeleteTarget(transaction)}
            />
          </div>
        )}

        {!loading && pagination && data.length > 0 && (
          <Pagination pagination={pagination} onChange={setPage} />
        )}
      </div>

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        transaction={editing}
        categories={categories}
        currency={user?.currency ?? 'NPR'}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete transaction?"
        message={
          deleteTarget
            ? `This will remove the ${deleteTarget.type} of ${deleteTarget.amount} ${deleteTarget.note ? `"${deleteTarget.note}"` : ''} for good.`
            : ''
        }
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="divide-y divide-line">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('flex items-center gap-3 px-4 py-3.5')}>
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
