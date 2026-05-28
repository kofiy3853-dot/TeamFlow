import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';
import { initializePayment } from '@/lib/paystack';
import { verifyToken } from '@/lib/auth-node';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // Verify authentication
    const authCookie = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!authCookie) {
      return NextResponse.json({ error: 'Unauthorized - Please log in again' }, { status: 401 });
    }

    const decoded = verifyToken(authCookie) as { userId?: string };
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Amount for subscription (e.g., $10 or 100 GHS)
    const SUBSCRIPTION_AMOUNT = 100;
    const reference = crypto.randomBytes(16).toString('hex');
    // IMPORTANT: For Paystack to reach this callback, the URL must be publicly accessible.
    // We dynamically extract the origin from the request URL if NEXT_PUBLIC_APP_URL isn't set.
    const requestUrl = new URL(req.url);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/$/, '');
    const callbackUrl = `${appUrl}/api/payment/verify?reference=${reference}`;
    const paystackData = await initializePayment(user.email, SUBSCRIPTION_AMOUNT, reference, callbackUrl);

    // Save payment record as PENDING
    await Payment.create({
      user: user._id,
      amount: SUBSCRIPTION_AMOUNT,
      provider: 'PAYSTACK',
      reference,
      status: 'PENDING',
    });

    return NextResponse.json({ 
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference 
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Payment initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
