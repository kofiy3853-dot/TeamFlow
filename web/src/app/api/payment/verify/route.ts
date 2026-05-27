import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { User } from '@/models/User';
import { verifyToken, signToken } from '@/lib/auth-node';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.redirect(new URL('/payment?error=MissingReference', req.url));
    }

    // Call Paystack API to verify transaction
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await paystackRes.json();

    if (!data.status || data.data.status !== 'success') {
      return NextResponse.redirect(new URL('/payment?error=PaymentFailed', req.url));
    }

    await connectToDatabase();

    // Find the payment by reference first (since the cookie might be dropped by the browser on redirect)
    const payment = await Payment.findOne({ reference });
    if (!payment) {
      return NextResponse.redirect(new URL('/payment?error=PaymentNotFound', req.url));
    }

    // Check if it's already successful (e.g. from a webhook)
    if (payment.status === 'SUCCESS') {
      const user = await User.findById(payment.user);
      if (user) {
        const newToken = signToken({ userId: user._id, role: user.role, status: user.subscriptionStatus });
        const response = NextResponse.redirect(new URL('/dashboard', req.url));
        response.cookies.set('token', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24
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
      expiry.setDate(expiry.getDate() + 30); // 30 days from now
      user.subscriptionExpiry = expiry;
      await user.save();

      // Regenerate JWT to log the user in automatically with new status
      const newToken = signToken({ userId: user._id, role: user.role, status: 'ACTIVE' });

      // Redirect to dashboard with the new cookie
      const response = NextResponse.redirect(new URL('/dashboard', req.url));
      response.cookies.set('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 1 day
      });

      return response;
    }

    // Fallback if no user is found but payment succeeded
    return NextResponse.redirect(new URL('/login?redirectUrl=/dashboard&message=PaymentSuccessfulPleaseLogin', req.url));

  } catch (error) {
    console.error('Verify Payment Error:', error);
    return NextResponse.redirect(new URL('/payment?error=VerificationError', req.url));
  }
}
