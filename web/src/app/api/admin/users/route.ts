import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { authorizeRoles } from '@/lib/rbac-node';

// GET /api/admin/users - Get all users (admin only)
export async function GET(req: Request) {
  const authError = authorizeRoles('ADMIN', 'SUPER_ADMIN')(req);
  if (authError) return authError;

  try {
    await connectToDatabase();
    
    const users = await User.find({})
      .select('_id fullname email role subscriptionStatus subscriptionPlan subscriptionExpiry createdAt')
      .sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
