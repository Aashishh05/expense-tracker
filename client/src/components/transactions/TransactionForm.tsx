import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createTransaction, updateTransaction } from '@/api/transactions';
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
  currency,
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

  useEffect(() => {
    if (!open) return;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={transaction ? 'Edit transaction' : 'Add transaction'}
      subtitle={transaction ? undefined : 'Amounts always use your account currency.'}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Type segmented control */}
        <div>
          <span className="label">Type</span>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f2f2f4] p-1">
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={`Amount${currency ? ` (${currency})` : ''}`}
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
              {category.icon ? `${category.icon}  ` : ''}{category.name}
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
