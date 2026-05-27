import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Team } from '@/models/Team';
import { User } from '@/models/User';
import { getUserFromCookie } from '@/lib/rbac-node';

// GET /api/teams/[id] - Get team details with members
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

// PATCH /api/teams/[id] - Update team (owner only)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

    // Only owner or admin can update
    const isOwner = team.owner.toString() === user.userId;
    const isAdmin = team.admins.map((a: any) => a.toString()).includes(user.userId);
    if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updated = await Team.findByIdAndUpdate(
      id,
      { $set: { name: body.name, description: body.description } },
      { new: true }
    ).populate('owner', 'fullname email').populate('members', 'fullname email');

    return NextResponse.json({ team: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/teams/[id] - Delete team (owner only)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;

    const team = await Team.findById(id);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (team.owner.toString() !== user.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Team.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Team deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
