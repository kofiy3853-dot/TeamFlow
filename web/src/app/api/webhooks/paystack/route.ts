import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';
import { verifyPaystackSignature } from '@/lib/paystack';
import { z } from 'zod';

// Zod schema for expected webhook payload (partial, focusing on needed fields)
const PaystackWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
  }).passthrough(),
}).passthrough();

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // 1. Verify Webhook Signature
    if (!verifyPaystackSignature(signature, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const parsed = PaystackWebhookSchema.safeParse(JSON.parse(rawBody));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }
    const safeEvent = parsed.data;

    // 2. Only process successful charge events
    if (safeEvent.event === 'charge.success') {
      await connectToDatabase();
      
      const reference = safeEvent.data.reference;
      
      const payment = await Payment.findOne({ reference });
      if (!payment || payment.status === 'SUCCESS') {
        return NextResponse.json({ message: 'Payment already processed or not found' }, { status: 200 });
      }

      // 3. Mark payment as SUCCESS
      payment.status = 'SUCCESS';
      payment.paidAt = new Date();
      payment.subscriptionStart = new Date();
      
      // Add 30 days for subscription
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      payment.subscriptionEnd = endDate;
      
      await payment.save();

      // 4. Update User Subscription Status
      const user = await User.findById(payment.user);
      if (user) {
        user.subscriptionStatus = 'ACTIVE';
        user.subscriptionExpiry = endDate;
        await user.save();
      }

      // 5. Emit real-time payment success event to all connected sockets
      try {
        // Import the global io instance
        const { io } = require('global');
        if (io && typeof io.paymentSuccess === 'function') {
          io.paymentSuccess({
            reference,
            userId: user?._id?.toString(),
            email: user?.email,
            amount: payment.amount,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to emit payment success event:', err);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}