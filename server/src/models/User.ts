import { Schema, model } from 'mongoose';
import type { Document, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

const EMAIL_REGEX = /^[\w.+-]+@[\w-]+\.[\w.-]+$/;

export interface IUser {
  name: string;
  email: string;
  password: string;
  currency: string;
}

/** Instance methods declared on the schema. */
export interface UserInstanceMethods {
  comparePassword(candidate: string): Promise<boolean>;
}

export interface UserDocument extends Document<Types.ObjectId>, IUser, UserInstanceMethods {
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument, Model<UserDocument>, UserInstanceMethods>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    currency: {
      type: String,
      default: 'NPR',
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 3,
    },
  },
  { timestamps: true }
);

// Hash password before saving (only when it was modified)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (this: UserDocument, candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak the password hash in JSON responses.
// Attached via a cast because Document already types `toJSON` and it
// cannot be redeclared in an extending interface.
(userSchema.methods as Record<string, unknown>).toJSON = function (this: UserDocument) {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const User = model<UserDocument, Model<UserDocument>>('User', userSchema);

export default User;
