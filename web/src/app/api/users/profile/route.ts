import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';
import { comparePasswords, hashPassword } from '@/lib/auth-node';
import { z } from 'zod';

const updateProfileSchema = z.object({
  fullname: z.string().min(2).optional(),
  phone: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// PATCH /api/users/profile - Update profile
export async function PATCH(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();

    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(
      user.userId,
      { $set: result.data },
      { new: true }
    );

    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      user: {
        id: updated._id,
        fullname: updated.fullname,
        email: updated.email,
        role: updated.role,
        subscriptionStatus: updated.subscriptionStatus,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users/profile/change-password
export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const body = await req.json();

    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;

    const userData = await User.findById(user.userId).select('+password');
    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const isMatch = await comparePasswords(currentPassword, userData.password!);
    if (!isMatch) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

    const hashed = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user.userId, { $set: { password: hashed } });

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
