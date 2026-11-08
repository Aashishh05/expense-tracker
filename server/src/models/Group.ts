import { Schema, model } from 'mongoose';
import type { Document, Types } from 'mongoose';

export type GroupRole = 'owner' | 'member';

export interface IGroupMember {
  user: Types.ObjectId;
  role: GroupRole;
  joinedAt: Date;
}

/**
 * Pending invitation before the person signs up.
 */
export interface IPendingInvitation {
  email: string;
  role: GroupRole;
  invitationId: string;
  invitedAt: Date;
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
  pendingInvitations: IPendingInvitation[];
}

/** GroupDocument also has createdAt/updatedAt from timestamps. */
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

const pendingInvitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['member'],
      default: 'member',
    },
    invitationId: {
      type: String,
      required: true,
    },
    invitedAt: {
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
    pendingInvitations: {
      type: [pendingInvitationSchema],
      default: [],
    },
  },
  { timestamps: true }
);

groupSchema.index({ 'members.user': 1 });
groupSchema.index({ 'members.user': 1, 'members.role': 1 });
groupSchema.index({ 'pendingInvitations.email': 1 });

const Group = model<GroupDocument>('Group', groupSchema);

export default Group;