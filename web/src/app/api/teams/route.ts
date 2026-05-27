import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { verifyToken } from '@/lib/auth';
import crypto from 'crypto';
import { z } from 'zod';

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters'),
  description: z.string().optional(),
});

function getUserFromCookie(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1]?.split(';')[0];
  if (!token) return null;
  return verifyToken(token) as any;
}

// GET /api/teams – List all teams for the authenticated user
export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const teams = await Team.find({
      $or: [{ owner: user.userId }, { members: user.userId }, { admins: user.userId }],
    }).populate('owner', 'fullname email avatar');

    return NextResponse.json({ teams }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams – Create a new team
export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const body = await req.json();
    const result = createTeamSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 });
    }

    const { name, description } = result.data;
    const inviteCode = crypto.randomBytes(8).toString('hex');

    const team = await Team.create({
      name,
      description,
      owner: user.userId,
      admins: [user.userId],
      members: [user.userId],
      inviteCode,
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
