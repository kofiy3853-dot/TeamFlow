import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  content: string;
  attachments?: string[];
  readBy: mongoose.Types.ObjectId[];
  reactions: Array<{
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    content: { type: String, required: true },
    attachments: [{ type: String }],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reactions: [
      {
        emoji: { type: String },
        users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
