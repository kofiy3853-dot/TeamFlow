import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Message } from '@/models/Message';
import { verifyToken } from '@/lib/auth';

function getUserFromCookie(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1]?.split(';')[0];
  if (!token) return null;
  return verifyToken(token) as any;
}

// GET /api/chat/messages?teamId=xxx&limit=10&offset=0
export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    await connectToDatabase();
    
    // Get messages for the team, sorted by most recent first
    const messages = await Message.find({ team: teamId })
      .populate('sender', 'fullname avatar')
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/messages – Create a new message
export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const body = await req.json();
    const { teamId, content } = body;

    if (!teamId || !content) {
      return NextResponse.json({ error: 'teamId and content are required' }, { status: 400 });
    }

    // Create message in database
    const message = await Message.create({
      team: teamId,
      content,
      sender: user.userId,
      createdAt: new Date(),
    });

    // Populate sender info for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullname avatar');

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}