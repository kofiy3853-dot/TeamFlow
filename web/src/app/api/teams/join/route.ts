import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';

// POST /api/teams/join - Join a team via invite code
export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { inviteCode } = await req.json();
    if (!inviteCode) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

    const team = await Team.findOne({ inviteCode });
    if (!team) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });

    // Check if already a member
    const alreadyMember = team.members.map((m: any) => m.toString()).includes(user.userId);
    if (alreadyMember) return NextResponse.json({ error: 'Already a member of this team' }, { status: 409 });

    // Add user to team
    await Team.findByIdAndUpdate(team._id, { $addToSet: { members: user.userId } });
    await User.findByIdAndUpdate(user.userId, { $addToSet: { teams: team._id } });

    const updated = await Team.findById(team._id)
      .populate('owner', 'fullname email')
      .populate('members', 'fullname email');

    return NextResponse.json({ team: updated, message: 'Joined team successfully' });
  } catch (error) {
    console.error('Error joining team:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
