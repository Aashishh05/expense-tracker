const mongoose = require('mongoose');

/**
 * Categories. `user: null` marks shared default categories;
 * user-created custom categories carry the owner's id.
 */
const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
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
    icon: { type: String, trim: true, maxlength: 10 },
    color: { type: String, trim: true, maxlength: 7 },
  },
  { timestamps: true }
);

// A user cannot create two categories with the same name + type.
// Defaults (user: null) are unique too.
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
