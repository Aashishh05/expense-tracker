import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { createRecurring, updateRecurring } from '@/api/recurring';
import type { RecurringInput } from '@/api/recurring';
import type { Category, Recurring, RecurringFrequency, TransactionType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiFieldErrors, apiMessage, cn, todayYMD } from '@/utils/format';

interface RecurringFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  rule: Recurring | null;
  categories: Category[];
}

type FormValues = {
  type: TransactionType;
  amount: string;
  category: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
  note: string;
};

const TYPE_CHOICES: Array<{ value: TransactionType; label: string }> = [
  { value: 'expense', label: 'Expense' },
  { value: 'income', label: 'Income' },
];

const FREQ_CHOICES: Array<{ value: RecurringFrequency; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
];

export function RecurringForm({ open, onClose, onSaved, rule, categories }: RecurringFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      type: 'expense',
      amount: '',
      category: '',
      frequency: 'monthly',
      startDate: '',
      endDate: '',
      note: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      rule
        ? {
            type: rule.type,
            amount: String(rule.amount),
            category:
              typeof rule.category === 'object' && rule.category !== null ? rule.category._id : '',
            frequency: rule.frequency,
            startDate: rule.startDate.slice(0, 10),
            endDate: rule.endDate?.slice(0, 10) ?? '',
            note: rule.note ?? '',
          }
        : {
            type: 'expense',
            amount: '',
            category: '',
            frequency: 'monthly',
            startDate: todayYMD(),
            endDate: '',
            note: '',
          }
    );
  }, [open, rule, reset]);

  const selectedType = watch('type');
  const options = categories.filter((c) => c.type === selectedType);

  const onSubmit = handleSubmit(async (values) => {
    const payload: RecurringInput = {
      type: values.type,
      amount: Number(values.amount),
      category: values.category,
      frequency: values.frequency,
      startDate: values.startDate,
      // Cleared end date comes through as null on updates.
      endDate: values.endDate || null,
      note: values.note.trim(),
    };
    try {
      if (rule) {
        await updateRecurring(rule._id, payload);
        toast.success('Recurring rule updated');
      } else {
        await createRecurring(payload);
        toast.success('Recurring rule saved');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not save the recurring rule'));
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
      title={rule ? 'Edit recurring rule' : 'New recurring rule'}
      subtitle="Entries appear automatically — even when the app is closed. Amounts are in the NPR base."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {/* Type segmented control */}
        <div>
          <span className="label">Type</span>
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
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount (NPR base)"
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
          <Select label="Repeats" error={errors.frequency?.message} {...register('frequency')}>
            {FREQ_CHOICES.map((choice) => (
              <option key={choice.value} value={choice.value}>
                {choice.label}
              </option>
            ))}
          </Select>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            max="2100-12-31"
            error={errors.startDate?.message}
            {...register('startDate', { required: 'Start date is required' })}
          />
          <Input
            label="End date (optional)"
            type="date"
            max="2100-12-31"
            error={errors.endDate?.message}
            {...register('endDate')}
          />
        </div>

        <div>
          <label className="label" htmlFor="note">
            Note <span className="font-normal text-ink-3">(optional)</span>
          </label>
          <textarea
            id="note"
            rows={2}
            maxLength={200}
            placeholder="e.g. Room rent — the same entry every month"
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
            {rule ? 'Save changes' : 'Create rule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
