import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';
import { signToken } from '@/lib/auth-node';

// Build an absolute redirect URL that works whether running locally or in production
function absoluteUrl(req: Request, path: string): string {
  const requestUrl = new URL(req.url);
  const base = (process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin).replace(/\/$/, '');
  return `${base}${path}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(absoluteUrl(req, '/payment?error=MissingReference'));
    }

    // Call Paystack API to verify transaction
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await paystackRes.json();

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.redirect(absoluteUrl(req, '/payment?error=PaymentFailed'));
    }

    await connectToDatabase();

    // Find the payment by reference
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return NextResponse.redirect(absoluteUrl(req, '/payment?error=PaymentNotFound'));
    }

    // If already processed (e.g. webhook arrived first), just log the user in
    if (payment.status === 'SUCCESS') {
      const user = await User.findById(payment.user);
      if (user) {
        const newToken = signToken({ userId: user._id, role: user.role, status: user.subscriptionStatus });
        const response = NextResponse.redirect(absoluteUrl(req, '/dashboard'));
        response.cookies.set('token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
        });
        return response;
      }
    }

    // Update Payment Record
    payment.status = 'SUCCESS';
    payment.paidAt = new Date();
    payment.subscriptionStart = new Date();
    payment.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await payment.save();

    // Update User subscription
    const user = await User.findById(payment.user);
    if (user) {
      user.subscriptionStatus = 'ACTIVE';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      user.subscriptionExpiry = expiry;
      await user.save();

      // Issue a fresh JWT so the user is logged in automatically with ACTIVE status
      const newToken = signToken({ userId: user._id, role: user.role, status: 'ACTIVE' });

      const response = NextResponse.redirect(absoluteUrl(req, '/dashboard'));
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    }

    // Fallback: payment succeeded but no user found — ask them to log in
    return NextResponse.redirect(
      absoluteUrl(req, '/login?redirectUrl=/dashboard&message=PaymentSuccessfulPleaseLogin')
    );
  } catch (error) {
    console.error('Verify Payment Error:', error);
    return NextResponse.redirect(absoluteUrl(req, '/payment?error=VerificationError'));
  }
}
