import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { getUserFromCookie } from '@/lib/rbac-node';

// PATCH /api/tasks/[id]
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();

    // Members can only update status/comments on assigned tasks
    if (user.role === 'MEMBER') {
      const task = await Task.findOne({ _id: id, assignedTo: user.userId });
      if (!task) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const updated = await Task.findByIdAndUpdate(
        id,
        { $set: { status: body.status } },
        { new: true }
      ).populate('assignedTo', 'fullname email').populate('team', 'name');
      return NextResponse.json({ task: updated });
    }

    // Admins/Owners can update anything
    const updated = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).populate('assignedTo', 'fullname email').populate('team', 'name');

    if (!updated) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'MEMBER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectToDatabase();
    const { id } = await params;

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
