import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';

// GET /api/users/search?q=query - Search for users by name or email
export async function GET(req: Request) {
  try {
    const user = await getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by name or email (case-insensitive)
    const users = await User.find({
      $or: [
        { fullname: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: user.userId } // Exclude current user
    })
    .select('_id fullname email')
    .limit(10);

    return NextResponse.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
