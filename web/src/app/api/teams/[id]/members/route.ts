import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';

// GET /api/teams/[id]/members - list members
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;

    const team = await Team.findById(id)
      .populate('owner', 'fullname email role')
      .populate('members', 'fullname email role')
      .populate('admins', 'fullname email role');

    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    return NextResponse.json({ team });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/teams/[id]/members - Add a member to a team
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const team = await Team.findById(id);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if requester is admin or owner
    const isAdmin = team.admins.some((adminId: any) => adminId.toString() === user.userId);
    const isOwner = team.owner.toString() === user.userId;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
    }

    // Check if user is already a member
    const alreadyMember = team.members.some((memberId: any) => memberId.toString() === userId);
    if (alreadyMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    // Add user to team
    await Team.findByIdAndUpdate(id, { 
      $addToSet: { members: userId } 
    });

    // Add team to user's teams
    await User.findByIdAndUpdate(userId, { 
      $addToSet: { teams: id } 
    });

    // Fetch updated team with populated members
    const updatedTeam = await Team.findById(id)
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

// PATCH /api/teams/[id]/members - update member role
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    const { userId, role } = await req.json();

    if (!['OWNER', 'ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    if (team.owner.toString() !== user.userId) {
      return NextResponse.json({ error: 'Only the team owner can change roles' }, { status: 403 });
    }

    await User.findByIdAndUpdate(userId, { $set: { role } });

    if (role === 'ADMIN') {
      await Team.findByIdAndUpdate(id, { $addToSet: { admins: userId } });
    } else {
      await Team.findByIdAndUpdate(id, { $pull: { admins: userId } });
    }

    return NextResponse.json({ message: `Role updated to ${role}` });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[id]/members - remove member
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    const { userId } = await req.json();

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    const isOwner = team.owner.toString() === user.userId;
    const isAdmin = team.admins.map((a: any) => a.toString()).includes(user.userId);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (team.owner.toString() === userId) {
      return NextResponse.json({ error: 'Cannot remove the team owner' }, { status: 400 });
    }

    await Team.findByIdAndUpdate(id, { $pull: { members: userId, admins: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { teams: id } });

    return NextResponse.json({ message: 'Member removed' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
