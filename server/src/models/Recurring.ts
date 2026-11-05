import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';
import type { CategoryType } from './Category';

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * A repeating transaction template. The sweeper materializes one
 * Transaction per occurrence; `nextRunAt` is the pending occurrence
 * date (UTC midnight) so catch-up work lands on the right days.
 */
export interface IRecurring {
  user: Types.ObjectId;
  type: CategoryType;
  amount: number;
  category: Types.ObjectId;
  note?: string;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date | null;
  nextRunAt: Date;
  lastRunAt?: Date | null;
  active: boolean;
}

export interface RecurringDocument extends Document<Types.ObjectId>, IRecurring {
  createdAt: Date;
  updatedAt: Date;
}

const recurringSchema = new Schema<RecurringDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense',
      },
      required: [true, 'Type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note must be at most 200 characters'],
    },
    frequency: {
      type: String,
      enum: {
        values: ['daily', 'weekly', 'monthly'],
        message: 'Frequency must be daily, weekly or monthly',
      },
      required: [true, 'Frequency is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      default: null,
    },
    nextRunAt: {
      type: Date,
      required: [true, 'Next run is required'],
      index: true,
    },
    lastRunAt: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

recurringSchema.index({ user: 1, active: 1, nextRunAt: 1 });

const Recurring = model<RecurringDocument>('Recurring', recurringSchema);

export default Recurring;
