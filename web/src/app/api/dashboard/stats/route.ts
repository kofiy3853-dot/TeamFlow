import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Team } from '@/models/Team';
import { Task } from '@/models/Task';
import { getUserFromCookie, authorizeRoles } from '@/lib/rbac-node';

export async function GET(req: Request) {
  const authError = authorizeRoles('ADMIN')(req);
  if (authError) return authError;

  try {
    await connectToDatabase();
    const user = getUserFromCookie(req)!;

    // Get user's teams
    const teams = await Team.find({
      $or: [{ owner: user.userId }, { members: user.userId }, { admins: user.userId }],
    }).populate('members', 'fullname');

    const teamIds = teams.map((t) => t._id);

    // Count unique members across all teams
    const memberSet = new Set<string>();
    teams.forEach((team) => {
      team.members.forEach((m: any) => memberSet.add(m._id?.toString() || m.toString()));
    });

    // Get tasks in user's teams
    const [totalTasks, completedTasks, recentTasks] = await Promise.all([
      Task.countDocuments({ team: { $in: teamIds } }),
      Task.countDocuments({ team: { $in: teamIds }, status: 'DONE' }),
      Task.find({ team: { $in: teamIds } })
        .populate('team', 'name')
        .populate('assignedTo', 'fullname')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const productivity = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      activeProjects: teams.length,
      teamMembers: memberSet.size,
      tasksCompleted: completedTasks,
      productivity,
      recentTasks: recentTasks.map((t) => ({
        _id: t._id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        team: (t.team as any)?.name || 'Unknown',
        dueDate: t.dueDate
          ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : null,
      })),
      activities: [],
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      activeProjects: 0, teamMembers: 0, tasksCompleted: 0,
      productivity: 0, recentTasks: [], activities: [],
    });
  }
}
