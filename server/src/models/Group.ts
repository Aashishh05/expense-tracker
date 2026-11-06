import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';

export type GroupRole = 'owner' | 'member';

export interface IGroupMember {
  user: Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

/**
 * A group of app users sharing expenses. Members are permanent once added:
 * removal would silently distort the equal-split maths, so the only way to
 * dissolve a group is the owner deleting it (transactions are kept).
 */
export interface IGroup {
  name: string;
  owner: Types.ObjectId;
  members: IGroupMember[];
}

export interface GroupDocument extends Document<Types.ObjectId>, IGroup {
  createdAt: Date;
  updatedAt: Date;
}

const memberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'member'],
        message: 'Role must be owner or member',
      },
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const groupSchema = new Schema<GroupDocument>(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    members: {
      type: [memberSchema],
      validate: {
        validator: (members: IGroupMember[]) => members.length >= 1 && members.length <= 12,
        message: 'A group can have 1-12 members',
      },
    },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.user': 1 });
groupSchema.index({ 'members.user': 1, 'members.role': 1 });

const Group = model<GroupDocument>('Group', groupSchema);

export default Group;
