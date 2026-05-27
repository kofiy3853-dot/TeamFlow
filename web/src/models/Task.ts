import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  assignedTo: mongoose.Types.ObjectId[];
  team: mongoose.Types.ObjectId;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  dueDate?: Date;
  comments: Array<{
    user: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  activityLogs: Array<{
    user: mongoose.Types.ObjectId;
    action: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema<ITask> = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
      default: 'TODO',
    },
    dueDate: { type: Date },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activityLogs: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);
