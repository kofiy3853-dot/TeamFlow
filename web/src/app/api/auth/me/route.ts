import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';

function getUserFromCookie(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1]?.split(';')[0];
  if (!token) return null;
  try {
    return verifyToken(token) as any;
  } catch (e) {
    return null;
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Get token from cookies
    const decoded = getUserFromCookie(req);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user data
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
