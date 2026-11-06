import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { deleteTransaction, exportTransactionsCsv } from '@/api/transactions';
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
import { ReceiptViewer } from '@/components/transactions/ReceiptViewer';
import { Skeleton } from '@/components/ui/Loader';
import { Plus as PlusIcon, Receipt as ReceiptIcon, Download as DownloadIcon } from 'lucide-react';
import { apiMessage, cn } from '@/utils/format';
import { RateNote } from '@/components/ui/RateNote';
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
  const [exporting, setExporting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

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

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportTransactionsCsv({
        type: filters.type,
        category: filters.category || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        search: filters.search || undefined,
        sort: '-date',
      });
      // Parse CSV text from blob and convert to simple printable HTML/PDF document
      const text = await blob.text();
      const lines = text.split('\n').filter(Boolean);
      const headers = lines[0]?.split(',').map((h) => h.replace(/"/g, '')) ?? [];
      const rows = lines.slice(1).map((line) => line.split(',').map((cell) => cell.replace(/"/g, '')));

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Transactions Report</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 20px; color: #111; }
                h1 { margin-bottom: 5px; font-size: 20px; }
                p { color: #666; font-size: 13px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
                th { background-color: #f5ebd0; font-weight: 600; }
                tr:nth-child(even) { background-color: #fcfbfa; }
              </style>
            </head>
            <body>
              <h1>Transactions Report</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
              <table>
                <thead>
                  <tr>
                    <th>SN</th>
                    ${headers.map((h) => `<th>${h}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map(
                      (row, index) => `
                    <tr>
                      <td>${index + 1}</td>
                      ${row.map((cell) => `<td>${cell}</td>`).join('')}
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              <script>
                window.onload = () => {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      toast.success('PDF export dialog opened');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not export the PDF'));
    } finally {
      setExporting(false);
    }
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
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleExport} loading={exporting}>
            <DownloadIcon className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
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
        </div>
      </header>
      <RateNote className="-mt-3.5 mb-5" />

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
              onViewReceipt={setViewingReceipt}
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
        onViewReceipt={setViewingReceipt}
      />

      <ReceiptViewer transaction={viewingReceipt} onClose={() => setViewingReceipt(null)} />

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
