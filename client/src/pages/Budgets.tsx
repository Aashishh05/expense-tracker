import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { listBudgets, saveBudget, updateBudget, deleteBudget } from '@/api/budgets';
import type { Budget } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Loader';
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Plus as PlusIcon, Target as TargetIcon, Pencil as PencilIcon, Trash2 as TrashIcon, TriangleAlert } from 'lucide-react';
import { CategoryIconChip } from '@/components/categories/categoryIcons';
import { apiMessage, cn, formatCurrency, currentMonthKey, monthLabel, shiftMonth } from '@/utils/format';
import { RateNote } from '@/components/ui/RateNote';

export default function Budgets() {
  const { user } = useAuth();
  const { categories, refresh: refreshCategories } = useCategories();
  const [month, setMonth] = useState(currentMonthKey());

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listBudgets(month)
      .then((res) => active && setBudgets(res.data))
      .catch((err) => active && toast.error(apiMessage(err, 'Could not load budgets')))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [month, nonce]);

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const budgetedCategoryIds = new Set(budgets.map((b) => b.category?._id));
  const available = expenseCategories.filter((c) => !budgetedCategoryIds.has(c._id));

  const totals = budgets.reduce(
    (acc, budget) => {
      acc.limit += budget.limit;
      acc.spent += budget.spent;
      if (budget.percent >= 100) acc.over += 1;
      return acc;
    },
    { limit: 0, spent: 0, over: 0 }
  );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteBudget(deleteTarget._id);
      toast.success('Budget deleted');
      refetch();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the budget'));
    } finally {
      setDeletePending(false);
      setDeleteTarget(null);
    }
  };

  const currency = user?.currency ?? 'NPR';

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Budgets</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">Monthly limits per expense category</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-surface shadow-card">
            <IconButton label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
              <ChevronLeftIcon className="h-4.5 w-4.5" />
            </IconButton>
            <span className="min-w-[5.5rem] text-center text-[13.5px] font-medium text-ink">
              {monthLabel(month)}
            </span>
            <IconButton label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
              <ChevronRightIcon className="h-4.5 w-4.5" />
            </IconButton>
          </div>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <PlusIcon className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Set budget</span>
            <span className="sm:hidden">Set</span>
          </Button>
        </div>
      </header>
      <RateNote className="-mt-3.5 mb-5" />

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[92px] rounded-2xl" />
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TargetIcon className="h-6 w-6" />}
            title={`No budgets for ${monthLabel(month)}`}
            description="Set a monthly limit per expense category and watch the progress bars."
          />
        </div>
      ) : (
        <>
          <div className="card mb-4 grid grid-cols-3 divide-x divide-line p-0">
            <MiniStat label="Budgeted" value={formatCurrency(totals.limit, currency)} />
            <MiniStat label="Spent" value={formatCurrency(totals.spent, currency)} tone={totals.over > 0 ? 'expense' : undefined} />
            <MiniStat
              label="Left"
              value={formatCurrency(totals.limit - totals.spent, currency)}
              tone={totals.limit - totals.spent < 0 ? 'expense' : 'income'}
            />
          </div>

          <ul className="space-y-3">
            {budgets.map((budget) => (
              <BudgetRow
                key={budget._id}
                budget={budget}
                currency={currency}
                onEdit={() => {
                  setEditing(budget);
                  setFormOpen(true);
                }}
                onDelete={() => setDeleteTarget(budget)}
              />
            ))}
          </ul>

          {totals.over > 0 && (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-expense-soft px-4 py-3 text-[13.5px] text-expense">
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {totals.over} {totals.over === 1 ? 'budget is' : 'budgets are'} over the limit this month.
              </span>
            </p>
          )}
        </>
      )}

      <BudgetForm
        open={formOpen}
        editing={editing}
        month={month}
        available={available}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          refetch();
          refreshCategories();
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete budget?"
        message={
          deleteTarget
            ? `The monthly limit for "${deleteTarget.category?.name ?? 'category'}" in ${monthLabel(deleteTarget.month)} will be removed.`
            : ''
        }
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: 'expense' | 'income' }) {
  return (
    <div className="p-4 text-center">
      <p className="text-[12.5px] text-ink-2">{label}</p>
      <p
        className={cn(
          'nums mt-0.5 text-[17px] font-semibold',
          tone === 'expense' ? 'text-expense' : tone === 'income' ? 'text-income' : 'text-ink'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function BudgetRow({
  budget,
  currency,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const percent = Math.min(budget.percent, 100);
  const over = budget.percent >= 100;
  const warn = !over && budget.percent >= 85;
  const barTone = over ? 'bg-expense' : warn ? 'bg-warn' : 'bg-accent';
  const labelTone = over ? 'text-expense' : warn ? 'text-warn' : 'text-ink-2';

  return (
    <li className="card p-4">
      <div className="mb-2.5 flex items-center gap-3">
        <CategoryIconChip icon={budget.category?.icon} color={budget.category?.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-medium text-ink">{budget.category?.name}</p>
          <p className={cn('nums text-[12.5px]', labelTone)}>
            {formatCurrency(budget.spent, currency)} of {formatCurrency(budget.limit, currency)}
            {over && ' · over budget'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton label="Edit" tone="accent" onClick={onEdit}>
            <PencilIcon className="h-4 w-4" />
          </IconButton>
          <IconButton label="Delete" tone="danger" onClick={onDelete}>
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-ink/[0.06]"
        role="progressbar"
        aria-valuenow={budget.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${budget.category?.name} budget`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300', barTone)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={cn('nums mt-1.5 text-[12px]', labelTone)}>
        {over
          ? `${budget.percent}% of budget used`
          : `${budget.percent}% used · ${formatCurrency(budget.remaining, currency)} left`}
      </p>
    </li>
  );
}

function BudgetForm({
  open,
  editing,
  month,
  available,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Budget | null;
  month: string;
  available: Array<{ _id: string; name: string; icon?: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ category: string; limit: string }>({
    defaultValues: { category: '', limit: '' },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      category: editing?.category?._id ?? '',
      limit: editing ? String(editing.limit) : '',
    });
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateBudget(editing._id, Number(values.limit));
        toast.success('Budget updated');
      } else {
        await saveBudget({ category: values.category, month, limit: Number(values.limit) });
        toast.success('Budget saved');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the budget'));
      const fieldErrors = (err as { response?: { data?: { errors?: Array<{ field: string; msg: string }> } } })
        ?.response?.data?.errors;
      for (const fieldError of fieldErrors ?? []) {
        if (fieldError.field === 'category') setError('category', { type: 'server', message: fieldError.msg });
        if (fieldError.field === 'limit') setError('limit', { type: 'server', message: fieldError.msg });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit budget' : 'Set a budget'}
      subtitle={editing ? undefined : `For ${monthLabel(month)} · expense categories only`}
      maxWidth="26rem"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {editing ? (
          <Input label="Category" value={editing.category?.name ?? ''} readOnly disabled />
        ) : (
          <Select
            label="Category"
            error={errors.category?.message}
            {...register('category', { required: 'Choose a category' })}
          >
            <option value="">Select a category</option>
            {available.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Monthly limit"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          error={errors.limit?.message}
          {...register('limit', {
            required: 'Limit is required',
            validate: (value) => Number(value) > 0 || 'Limit must be greater than 0',
          })}
        />

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Save budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
