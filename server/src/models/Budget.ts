import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface IBudget {
  user: Types.ObjectId;
  category: Types.ObjectId;
  month: string;
  limit: number;
}

export interface BudgetDocument extends Document<Types.ObjectId>, IBudget {
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<BudgetDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    month: {
      type: String,
      required: [true, 'Month is required'],
      match: [MONTH_REGEX, 'Month must be in YYYY-MM format'],
    },
    limit: {
      type: Number,
      required: [true, 'Limit is required'],
      min: [0.01, 'Limit must be positive'],
    },
  },
  { timestamps: true }
);

// One budget per user + category + month (upsert friendly).
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

const Budget = model<BudgetDocument>('Budget', budgetSchema);

export default Budget;
