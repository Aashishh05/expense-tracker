import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import {
  createTransaction,
  updateTransaction,
  uploadReceipt,
  removeReceipt,
} from '@/api/transactions';
import type { TransactionInput } from '@/api/transactions';
import type { Category, Transaction, TransactionType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiFieldErrors, apiMessage, cn, todayYMD } from '@/utils/format';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  transaction: Transaction | null;
  categories: Category[];
  currency: string;
  onViewReceipt?: (transaction: Transaction) => void;
  /** When set, the form creates a shared expense locked to that group. */
  group?: { _id: string; name: string } | null;
}

type FormValues = {
  type: TransactionType;
  amount: string;
  category: string;
  date: string;
  note: string;
};

const TYPE_CHOICES: Array<{ value: TransactionType; label: string }> = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

export function TransactionForm({
  open,
  onClose,
  onSaved,
  transaction,
  categories,
  onViewReceipt,
  group,
}: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { type: 'expense', amount: '', category: '', date: '', note: '' },
  });

  // Receipts attach to the stored entry, so they're manageable only in edit mode.
  const fileRef = useRef<HTMLInputElement>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHasReceipt(Boolean(transaction?.receipt));
    reset(
      transaction
        ? {
            type: transaction.type,
            amount: String(transaction.amount),
            category:
              typeof transaction.category === 'object' && transaction.category !== null
                ? transaction.category._id
                : '',
            date: transaction.date.slice(0, 10),
            note: transaction.note ?? '',
          }
        : {
            type: 'expense',
            amount: '',
            category: '',
            date: todayYMD(),
            note: '',
          }
    );
  }, [open, transaction, reset]);

  const selectedType = watch('type');
  const options = categories.filter((c) => c.type === selectedType);

  const onSubmit = handleSubmit(async (values) => {
    const payload: TransactionInput = {
      type: values.type,
      amount: Number(values.amount),
      category: values.category,
      date: values.date,
      note: values.note.trim(),
      ...(group && { group: group._id }),
    };
    try {
      if (transaction) {
        await updateTransaction(transaction._id, payload);
        toast.success('Transaction updated');
      } else {
        await createTransaction(payload);
        toast.success('Transaction added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the transaction'));
      for (const fieldError of apiFieldErrors(err)) {
        if (fieldError.field in values) {
          setError(fieldError.field as keyof FormValues, { type: 'server', message: fieldError.msg });
        }
      }
    }
  });

  async function onReceiptPicked(file: File) {
    if (!transaction) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Receipt must be 5 MB or smaller');
      return;
    }
    setReceiptBusy(true);
    try {
      await uploadReceipt(transaction._id, file);
      setHasReceipt(true);
      toast.success('Receipt attached');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not upload the receipt'));
    } finally {
      setReceiptBusy(false);
    }
  }

  async function onReceiptRemove() {
    if (!transaction) return;
    setReceiptBusy(true);
    try {
      await removeReceipt(transaction._id);
      setHasReceipt(false);
      toast.success('Receipt removed');
    } catch (err) {
      toast.error(apiMessage(err, 'Could not remove the receipt'));
    } finally {
      setReceiptBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit transaction' : 'Add transaction'}
      subtitle={transaction ? undefined : 'Typed amounts are in NPR (base); everything converts to your display currency.'}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Type segmented control — locked to expense for shared group expenses */}
        <div>
          <span className="label">Type</span>
          {group ? (
            <p className="rounded-xl bg-ink/[0.05] px-3 py-2.5 text-[13.5px] text-ink-2">
              Shared expense — split equally between all members of{' '}
              <span className="font-medium text-ink">{group.name}</span>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink/[0.06] p-1">
              {TYPE_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={selectedType === choice.value}
                  onClick={() => {
                    setValue('type', choice.value);
                    setValue('category', '');
                  }}
                  className={cn(
                    'h-9 rounded-[10px] text-[14px] font-medium transition-all duration-150 active:scale-[0.98]',
                    selectedType === choice.value
                      ? 'bg-surface text-ink shadow-card'
                      : 'text-ink-2 hover:text-ink'
                  )}
                >
                  <span
                    className={cn(
                      'mr-1.5 inline-block h-2 w-2 rounded-full align-middle',
                      choice.value === 'income' ? 'bg-income' : 'bg-expense'
                    )}
                  />
                  {choice.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount (base NPR)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount', {
              required: 'Amount is required',
              validate: (value) => Number(value) > 0 || 'Amount must be greater than 0',
            })}
          />
          <Input
            label="Date"
            type="date"
            max="2100-12-31"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
          />
        </div>

        <Select
          label="Category"
          error={errors.category?.message}
          {...register('category', { required: 'Choose a category' })}
        >
          <option value="">Select a category</option>
          {options.map((category) => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </Select>

        <div>
          <label className="label" htmlFor="note">
            Note <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={2}
            maxLength={200}
            placeholder="e.g. Lunch with the team"
            className="input resize-none"
            {...register('note')}
          />
          <p className="error-text">{errors.note?.message}</p>
        </div>

        {/* Receipt — attach/replace/remove while editing */}
        <div>
          <span className="label">Receipt</span>
          {!transaction ? (
            <p className="text-[12.5px] text-ink-3">Save the transaction first — receipts attach on edit.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (file) void onReceiptPicked(file);
                }}
              />
              <Button variant="ghost" size="md" loading={receiptBusy} onClick={() => fileRef.current?.click()}>
                {hasReceipt ? 'Replace receipt' : 'Attach receipt'}
              </Button>
              {hasReceipt && (
                <Button variant="ghost" size="md" onClick={() => onViewReceipt?.(transaction)}>
                  View
                </Button>
              )}
              {hasReceipt && (
                <Button variant="ghost" size="md" disabled={receiptBusy} onClick={() => void onReceiptRemove()}>
                  Remove
                </Button>
              )}
              <span className="text-[12.5px] text-ink-3">JPG · PNG · WebP · PDF · max 5 MB</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" loading={isSubmitting}>
            {transaction ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
