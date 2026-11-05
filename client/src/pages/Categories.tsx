import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createCategory, updateCategory, deleteCategory } from '@/api/categories';
import type { Category, TransactionType } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { Button, IconButton } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Loader';
import { PlusIcon, TagIcon, PencilIcon, TrashIcon, CheckIcon } from '@/components/icons';
import { SWATCH_COLORS } from '@/utils/constants';
import { apiMessage, cn, softColor } from '@/utils/format';

export default function Categories() {
  const { categories, refresh, loading, error } = useCategories();
  const [tab, setTab] = useState<TransactionType>('expense');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const visible = categories.filter((category) => category.type === tab);
  const counts = {
    income: categories.filter((c) => c.type === 'income').length,
    expense: categories.filter((c) => c.type === 'expense').length,
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletePending(true);
    try {
      await deleteCategory(deleteTarget._id);
      toast.success('Category deleted');
      refresh();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not delete the category'));
    } finally {
      setDeletePending(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight md:text-2xl">Categories</h1>
          <p className="mt-0.5 text-[13.5px] text-ink-2">
            Organize your entries — defaults are shared, custom ones are yours to change
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <PlusIcon className="h-4.5 w-4.5" />
          <span className="hidden sm:inline">New category</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </header>

      {/* Type switch */}
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-ink/[0.06] p-1">
        {(['expense', 'income'] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              'h-9 rounded-[10px] px-4 text-[14px] font-medium transition-all duration-150 active:scale-[0.98]',
              tab === value ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
            )}
          >
            {value === 'income' ? 'Income' : 'Expense'}
            <span className="nums ml-1.5 text-[12px] text-ink-3">{counts[value]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card">
          <EmptyState icon={<TagIcon className="h-6 w-6" />} title="Couldn't load categories" description={error} />
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<TagIcon className="h-6 w-6" />}
            title={`No ${tab} categories yet`}
            description="Create your own to start sorting entries."
          />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map((category) => (
            <li key={category._id} className="card flex items-center gap-3 p-3.5">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[18px]"
                style={{ backgroundColor: softColor(category.color) }}
                aria-hidden="true"
              >
                {category.icon || '🏷️'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[14.5px] font-medium text-ink">
                  {category.name}
                  {category.isDefault && (
                    <span className="shrink-0 rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[10.5px] font-medium text-ink-2">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-[12.5px] text-ink-2">
                  <span className="nums">{category.usageCount ?? 0}</span>{' '}
                  {(category.usageCount ?? 0) === 1 ? 'entry' : 'entries'}
                </p>
              </div>
              {!category.isDefault && (
                <div className="flex shrink-0 gap-0.5">
                  <IconButton
                    label="Edit"
                    tone="accent"
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Delete" tone="danger" onClick={() => setDeleteTarget(category)}>
                    <TrashIcon className="h-4 w-4" />
                  </IconButton>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <CategoryForm
        open={formOpen}
        editing={editing}
        type={editing?.type ?? tab}
        onClose={() => setFormOpen(false)}
        onSaved={refresh}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete category?"
        message={
          deleteTarget
            ? `"${deleteTarget.name}" can't be deleted while transactions still use it. Deleting is only possible once it's unused.`
            : ''
        }
        loading={deletePending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function CategoryForm({
  open,
  editing,
  type,
  onClose,
  onSaved,
}: {
  open: boolean;
  editing: Category | null;
  type: TransactionType;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ name: string; icon: string }>({ defaultValues: { name: '', icon: '' } });

  const [color, setColor] = useState<string>(SWATCH_COLORS[0]);

  useEffect(() => {
    if (!open) return;
    reset({ name: editing?.name ?? '', icon: editing?.icon ?? '' });
    setColor(editing?.color ?? SWATCH_COLORS[0]);
  }, [open, editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateCategory(editing._id, {
          name: values.name.trim(),
          icon: values.icon.trim(),
          color,
        });
        toast.success('Category updated');
      } else {
        await createCategory({
          name: values.name.trim(),
          type,
          icon: values.icon.trim(),
          color,
        });
        toast.success('Category created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the category'));
      if (err && (err as { response?: { status?: number } }).response?.status === 409) {
        setError('name', { type: 'server', message: 'You already have a category with this name for this type' });
      }
    }
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit category' : 'New category'}
      subtitle={editing ? undefined : `${type === 'income' ? 'Income' : 'Expense'} categories keep your entries organized.`}
      maxWidth="26rem"
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label className="label" htmlFor="category-name">
            Name
          </label>
          <input
            id="category-name"
            type="text"
            maxLength={30}
            placeholder={type === 'income' ? 'e.g. Side hustle' : 'e.g. Groceries'}
            className={`input ${errors.name ? 'input-error' : ''}`}
            {...register('name', { required: 'Name is required', maxLength: 30 })}
          />
          {errors.name && <p className="error-text">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label" htmlFor="category-icon">
            Icon <span className="font-normal text-ink-3">(any emoji)</span>
          </label>
          <input
            id="category-icon"
            type="text"
            maxLength={8}
            placeholder="🐾"
            className="input"
            {...register('icon')}
          />
        </div>

        <div>
          <span className="label" id="color-label">
            Color
          </span>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="color-label">
            {SWATCH_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-pressed={color === swatch}
                aria-label={`Color ${swatch}`}
                onClick={() => setColor(swatch)}
                style={{ backgroundColor: swatch }}
                className={cn(
                  'pressable grid h-8 w-8 place-items-center rounded-full text-white shadow-card transition-all',
                  color === swatch ? 'ring-2 ring-offset-2 ring-ink/25' : ''
                )}
              >
                {color === swatch && <CheckIcon className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {editing ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
