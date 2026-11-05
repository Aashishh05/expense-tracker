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
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

const Transaction = model<TransactionDocument>('Transaction', transactionSchema);

export default Transaction;
