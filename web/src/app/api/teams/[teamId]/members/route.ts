import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';

// POST /api/teams/[teamId]/members - Add a member to a team
export async function POST(
  req: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const user = await getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    const { teamId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if requester is admin or owner
    const isAdmin = team.admins.some((id: any) => id.toString() === user.userId);
    const isOwner = team.owner.toString() === user.userId;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Check if user is already a member
    const alreadyMember = team.members.some((id: any) => id.toString() === userId);
    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    // Add user to team
    await Team.findByIdAndUpdate(teamId, { 
      $addToSet: { members: userId } 
    });

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, { 
      $addToSet: { teams: teamId } 
    });

    // Fetch updated team with populated members
    const updatedTeam = await Team.findById(teamId)
      .populate('owner', 'fullname email')
      .populate('members', 'fullname email')
      .populate('admins', 'fullname email');

    return NextResponse.json({ 
      message: 'Member added successfully',
      team: updatedTeam 
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
