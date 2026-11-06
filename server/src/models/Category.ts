import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';

/**
 * Categories. `user: null` marks shared default categories;
 * user-created custom categories carry the owner's id.
 */
export type CategoryType = 'income' | 'expense';

export interface ICategory {
  user: Types.ObjectId | null;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface CategoryDocument extends Document<Types.ObjectId>, ICategory {
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [30, 'Name must be at most 30 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be income or expense',
      },
      required: [true, 'Category type is required'],
    },
    icon: { type: String, trim: true, maxlength: 24 },
    color: { type: String, trim: true, maxlength: 7 },
  },
  { timestamps: true }
);

// A user cannot create two categories with the same name + type.
// Defaults (user: null) are unique too.
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

const Category = model<CategoryDocument>('Category', categorySchema);

export default Category;
