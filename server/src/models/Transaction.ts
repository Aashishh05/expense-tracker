import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';
import type { CategoryType } from './Category';

export interface ITransaction {
  user: Types.ObjectId;
  type: CategoryType;
  amount: number;
  category: Types.ObjectId;
  date: Date;
  note?: string;
  /** Set when this entry was auto-created by a recurring rule. */
  recurring?: Types.ObjectId;
  /** Receipt image stored in server/uploads (filename only). */
  receipt?: string;
  /** Set when this is a shared group expense (one row per logged entry). */
  group?: Types.ObjectId;
}

export interface TransactionDocument extends Document<Types.ObjectId>, ITransaction {
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<TransactionDocument>(
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
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note must be at most 200 characters'],
    },
    recurring: {
      type: Schema.Types.ObjectId,
      ref: 'Recurring',
      default: undefined,
    },
    receipt: {
      type: String,
      maxlength: [120, 'Receipt name is too long'],
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: undefined,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ group: 1, date: -1 });
// Stops a repeated materialization from inserting the same automatic
// entry twice. A unique PARTIAL index (recurring is an ObjectId) — a
// compound sparse index would still index hand-made rows (they carry
// user+date) as recurring=null, wrongly blocking two same-day entries.
transactionSchema.index(
  { user: 1, recurring: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { recurring: { $type: 'objectId' } },
  }
);

const Transaction = model<TransactionDocument>('Transaction', transactionSchema);

export default Transaction;
