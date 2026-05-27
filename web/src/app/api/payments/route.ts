import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Payment } from '@/models/Payment';
import { getUserFromCookie } from '@/lib/rbac-node';

export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    let payments;

    // Members only see their own payments
    if (user.role === 'MEMBER') {
      payments = await Payment.find({
        user: user.userId,
      })
        .populate('user', 'fullname email')
        .sort({ createdAt: -1 });
    } else {
      // Admins and owners see all team payments
      payments = await Payment.find({})
        .populate('user', 'fullname email')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
