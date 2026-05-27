import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { comparePasswords, signToken } from '@/lib/auth-node';
import { z } from 'zod';

const loginSchema = z.object({
  redirectUrl: z.string().url().optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const result = loginSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { email, password, redirectUrl } = result.data;

    // Find user (we explicitly select +password since it's hidden by default in schema)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Compare passwords
    const isMatch = await comparePasswords(password, user.password!);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT
    const token = signToken({ userId: user._id, role: user.role, status: user.subscriptionStatus });

    const response = NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role
      }
    }, { status: 200 });

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 day
    });

    if (redirectUrl) {
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Preserve the token cookie
    redirectResponse.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 day
    });
    return redirectResponse;
  }
  return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
