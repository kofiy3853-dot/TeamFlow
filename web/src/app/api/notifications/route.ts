import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { getUserFromCookie } from '@/lib/rbac-node';

// GET /api/notifications
export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const notifications = await Notification.find({ user: user.userId })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({ user: user.userId, read: false });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/notifications - mark all as read
export async function PATCH(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    await Notification.updateMany({ user: user.userId, read: false }, { $set: { read: true } });

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
