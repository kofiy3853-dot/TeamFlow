import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Task } from '@/models/Task';
import { Team } from '@/models/Team';
import { getUserFromCookie } from '@/lib/rbac-node';
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  teamId: z.string().min(1, 'Team is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  assignedTo: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
});

// GET /api/tasks
export async function GET(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    let tasks;
    if (user.role === 'MEMBER') {
      // Members only see tasks assigned to them
      tasks = await Task.find({ assignedTo: user.userId })
        .populate('assignedTo', 'fullname email')
        .populate('team', 'name')
        .sort({ createdAt: -1 });
    } else {
      // Admins/Owners see all tasks in their teams
      const userTeams = await Team.find({
        $or: [{ owner: user.userId }, { members: user.userId }, { admins: user.userId }],
      }).select('_id');
      const teamIds = userTeams.map((t) => t._id);
      tasks = await Task.find({ team: { $in: teamIds } })
        .populate('assignedTo', 'fullname email')
        .populate('team', 'name')
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks
export async function POST(req: Request) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Only ADMIN can create tasks
    if (user.role === 'MEMBER') {
      return NextResponse.json({ error: 'Only admins can create tasks' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await req.json();
    const result = createTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: (result.error as any).errors[0].message }, { status: 400 });
    }

    const { title, description, teamId, priority, status, assignedTo, dueDate } = result.data;

    const task = await Task.create({
      title,
      description,
      team: teamId,
      priority,
      status,
      assignedTo: assignedTo || [],
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    const populated = await task.populate([
      { path: 'assignedTo', select: 'fullname email' },
      { path: 'team', select: 'name' },
    ]);

    return NextResponse.json({ task: populated }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
