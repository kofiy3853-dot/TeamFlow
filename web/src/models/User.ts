import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  fullname: string;
  email: string;
  phone: string;
  password?: string;
  avatar?: string;
  subscriptionStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
  subscriptionPlan: string;
  subscriptionExpiry?: Date;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'SUPER_ADMIN';
  teams: mongoose.Types.ObjectId[];
  notifications: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    password: { type: String, required: true, select: false }, // don't return password by default
    avatar: { type: String },
    subscriptionStatus: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
    },
    subscriptionPlan: { type: String, default: 'FREE' },
    subscriptionExpiry: { type: Date },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'SUPER_ADMIN'],
      default: 'MEMBER',
    },
    teams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
