import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { hashPassword, signToken } from '@/lib/auth-node';
import { z } from 'zod';

const registerSchema = z.object({
  fullname: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const result = registerSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 });
    }

    const { fullname, email, phone, password } = result.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // First user to register becomes OWNER, everyone else is MEMBER
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'OWNER' : 'MEMBER';

    // Create user with PENDING subscription status by default
    const newUser = await User.create({
      fullname,
      email,
      phone,
      password: hashedPassword,
      subscriptionStatus: 'PENDING',
      role,
    });

    // Generate JWT
    const token = signToken({ userId: newUser._id, role: newUser.role, status: newUser.subscriptionStatus });

    const response = NextResponse.json({ 
      message: 'Registration successful',
      user: {
        id: newUser._id,
        fullname: newUser.fullname,
        email: newUser.email,
        role: newUser.role,
        subscriptionStatus: newUser.subscriptionStatus
      }
    }, { status: 201 });

    // Set HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 1 day
    });

    return response;

  } catch (error: any) {
    console.error('Registration error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
