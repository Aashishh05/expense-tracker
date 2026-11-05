const mongoose = require('mongoose');

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model('Budget', budgetSchema);
