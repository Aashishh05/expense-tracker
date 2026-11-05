import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { deleteRecurring, listRecurring, updateRecurring } from '@/api/recurring';
import type { Recurring, RecurringFrequency } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCategories } from '@/hooks/useCategories';
import { RateNote } from '@/components/ui/RateNote';
import { Button, IconButton } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Loader';
import { RecurringForm } from '@/components/recurring/RecurringForm';
import { PlusIcon, RepeatIcon, PencilIcon, TrashIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { apiMessage, cn, formatDate, formatCurrency, softColor } from '@/utils/format';

const FREQ_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
};

export default function Recurring() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'NPR';
  const { categories } = useCategories();

  const [items, setItems] = useState<Recurring[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Recurring | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Recurring | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await listRecurring();
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError(apiMessage(err, 'Could not load recurring rules'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleActive = async (rule: Recurring) => {
    try {
      await updateRecurring(rule._id, { active: !rule.active });
      toast.success(rule.active ? 'Rule paused' : 'Rule resumed');
      void load();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not update the rule'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteRecurring(deleteTarget._id);
      toast.success('Recurring rule deleted');
      void load();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the rule'));
    } finally {
      setDeletePending(false);
      setDeleteTarget(null);
    }
  };

  const runLabel = (rule: Recurring) => {
    if (!rule.active) return 'Paused';
    if (new Date(rule.nextRunAt).getTime() <= Date.now()) return 'Due now';
    return `Next ${formatDate(rule.nextRunAt)}`;
  };

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Recurring</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            Rent, salary, subscriptions — logged even when you miss opening the app
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">New rule</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>
      <RateNote className="-mt-3.5 mb-5" />

      {loading ? (
        <div className="space-y-3" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState icon={<RepeatIcon className="h-6 w-6" />} title="Couldn't load recurring rules" description={error} />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<RepeatIcon className="h-6 w-6" />}
            title="No recurring rules yet"
            description="Set up rent, salary or a subscription once and it's logged for you automatically."
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((rule) => {
            const category =
              typeof rule.category === 'object' && rule.category !== null ? rule.category : null;
            return (
              <li key={rule._id} className="card flex items-center gap-3 p-3.5">
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[17px]"
                  style={{ backgroundColor: softColor(category?.color) }}
                  aria-hidden="true"
                >
                  {category?.icon || '🔁'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-[14.5px] font-medium text-ink">
                    {category?.name ?? 'Uncategorized'}
                    {!rule.active && (
                      <span className="shrink-0 rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[10.5px] font-medium text-ink-2">
                        Paused
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[12.5px] text-ink-2">
                    {FREQ_LABELS[rule.frequency]}
                    {rule.note ? ` · ${rule.note}` : ''} · since {formatDate(rule.startDate)}
                    {rule.endDate ? ` until ${formatDate(rule.endDate)}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'nums text-[14.5px] font-semibold',
                      rule.type === 'income' ? 'text-income' : 'text-expense'
                    )}
                  >
                    {rule.type === 'income' ? '+' : '−'}
                    {formatCurrency(rule.amount, currency)}
                  </p>
                  <p className="text-[11.5px] text-ink-3">{runLabel(rule)}</p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <IconButton
                    label={rule.active ? 'Pause' : 'Resume'}
                    tone="accent"
                    onClick={() => toggleActive(rule)}
                  >
                    {rule.active ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </IconButton>
                  <IconButton
                    label="Edit"
                    onClick={() => {
                      setEditing(rule);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleteTarget(rule)}>
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RecurringForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        rule={editing}
        categories={categories}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete recurring rule?"
        message={
          deleteTarget
            ? 'This rule will stop repeating — transactions already created are kept.'
            : ''
        }
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
