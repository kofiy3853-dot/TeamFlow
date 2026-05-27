import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  provider: 'PAYSTACK' | 'HUBTEL';
  network?: string;
  reference: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  paidAt?: Date;
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    provider: { type: String, enum: ['PAYSTACK', 'HUBTEL'], required: true },
    network: { type: String },
    reference: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      default: 'PENDING',
    },
    paidAt: { type: Date },
    subscriptionStart: { type: Date },
    subscriptionEnd: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
