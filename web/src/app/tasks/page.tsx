'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, X, Loader2, Trash2, Search, Filter } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

interface Member { _id: string; fullname: string; email: string; }
interface Task {
  id: string; title: string; description?: string;
  priority: Priority; status: Status;
  assignee: string; assigneeId?: string;
  dueDate?: string; team?: string;
}
interface Column { id: Status; label: string; color: string; tasks: Task[]; }

const priorityStyles: Record<Priority, string> = {
  LOW: 'bg-blue-500/10 text-blue-400',
  MEDIUM: 'bg-yellow-500/10 text-yellow-400',
  HIGH: 'bg-orange-500/10 text-orange-400',
  URGENT: 'bg-red-500/10 text-red-400',
};

const emptyColumns: Column[] = [
  { id: 'TODO', label: 'To Do', color: 'border-t-foreground/20', tasks: [] },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500', tasks: [] },
  { id: 'REVIEW', label: 'In Review', color: 'border-t-purple-500', tasks: [] },
  { id: 'DONE', label: 'Done', color: 'border-t-emerald-500', tasks: [] },
];

function TaskCard({ task, canManage, onDelete, onStatusChange }: {
  task: Task; canManage: boolean;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 relative">
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
          {task.priority}
        </span>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="p-0.5 rounded-md hover:bg-surface-hover transition-colors">
            <MoreHorizontal className="w-4 h-4 text-foreground/40" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-6 z-20 bg-surface border border-border rounded-xl shadow-xl py-1 w-44">
              <p className="px-3 py-1 text-xs text-foreground/40 font-medium">Move to</p>
              {statuses.map((s) => (
                <button key={s} onClick={() => { onStatusChange(task.id, s); setShowMenu(false); }}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-surface-hover transition-colors ${task.status === s ? 'text-primary font-medium' : 'text-foreground/70'}`}>
                  {s.replace('_', ' ')}
                </button>
              ))}
              {canManage && (
                <>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                    <Trash2 className="w-3 h-3" /> Delete task
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <h4 className="text-sm font-medium leading-snug mb-2">{task.title}</h4>
      {task.description && <p className="text-xs text-foreground/50 mb-3 line-clamp-2">{task.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-[10px] font-bold" title={task.assignee}>
            {task.assignee?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <span className="text-xs text-foreground/50 truncate max-w-[80px]">{task.assignee || 'Unassigned'}</span>
        </div>
        {task.dueDate && <span className="text-xs text-foreground/40">{task.dueDate}</span>}
      </div>
    </motion.div>
  );
}

export default function TasksPage() {
  const { canCreateTasks } = useRBAC();
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>(emptyColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newStatus, setNewStatus] = useState<Status>('TODO');
  const [newTeamId, setNewTeamId] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newAssignees, setNewAssignees] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => { fetchTasks(); fetchTeams(); }, []);

  // Re-group when filters change
  useEffect(() => { applyFilters(allTasks); }, [search, filterPriority, filterStatus, allTasks]);

  // Fetch team members when team changes
  useEffect(() => {
    if (!newTeamId) return;
    fetch(`/api/teams/${newTeamId}/members`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTeamMembers(d.team?.members || []))
      .catch(console.error);
  }, [newTeamId]);

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTeams(data.teams || []);
        if (data.teams?.length > 0) setNewTeamId(data.teams[0]._id);
      }
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      setError('');
      const res = await fetch('/api/tasks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const tasks = await res.json();

      const mapped: Task[] = tasks.map((t: any) => ({
        id: t._id?.toString(),
        title: t.title,
        description: t.description,
        priority: t.priority as Priority,
        status: t.status as Status,
        assignee: t.assignedTo?.[0]?.fullname || 'Unassigned',
        assigneeId: t.assignedTo?.[0]?._id,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined,
        team: t.team?.name,
      }));

      setAllTasks(mapped);
    } catch (err: any) {
      setError(err.message);
      setColumns(emptyColumns);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (tasks: Task[]) => {
    let filtered = tasks;
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority);
    if (filterStatus) filtered = filtered.filter(t => t.status === filterStatus);

    const grouped: Record<Status, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], DONE: [] };
    filtered.forEach(t => { if (grouped[t.status]) grouped[t.status].push(t); });

    setColumns([
      { id: 'TODO', label: 'To Do', color: 'border-t-foreground/20', tasks: grouped.TODO },
      { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-blue-500', tasks: grouped.IN_PROGRESS },
      { id: 'REVIEW', label: 'In Review', color: 'border-t-purple-500', tasks: grouped.REVIEW },
      { id: 'DONE', label: 'Done', color: 'border-t-emerald-500', tasks: grouped.DONE },
    ]);
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim() || !newTeamId) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle, description: newDesc,
          teamId: newTeamId, priority: newPriority,
          status: newStatus, dueDate: newDueDate || undefined,
          assignedTo: newAssignees,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowCreate(false);
      setNewTitle(''); setNewDesc(''); setNewDueDate(''); setNewAssignees([]);
      await fetchTasks();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' });
      await fetchTasks();
    } catch (e) { console.error(e); }
  };

  const handleStatusChange = async (id: string, status: Status) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      await fetchTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleAssignee = (id: string) => {
    setNewAssignees(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold font-outfit tracking-tight">Task Board</h2>
          <p className="text-foreground/60 mt-1">
            {totalTasks > 0 ? `${doneTasks}/${totalTasks} tasks completed` : 'Manage and track your team\'s progress'}
          </p>
        </div>
        {canCreateTasks() && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> New Task
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Priorities</option>
          {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50">
          <option value="">All Statuses</option>
          {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {(search || filterPriority || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterPriority(''); setFilterStatus(''); }}
            className="px-4 py-2.5 text-sm text-foreground/60 hover:text-foreground border border-border rounded-xl hover:bg-surface-hover transition-colors flex items-center gap-2">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm flex items-center justify-between">
          {error} <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {columns.map((column) => (
            <motion.div key={column.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`bg-surface/50 rounded-2xl border border-border border-t-4 ${column.color} flex flex-col min-h-[400px]`}>
              <div className="p-4 flex items-center justify-between">
                <h3 className="font-semibold font-outfit text-sm">{column.label}</h3>
                <span className="w-6 h-6 rounded-full bg-surface border border-border text-xs flex items-center justify-center text-foreground/60 font-medium">
                  {column.tasks.length}
                </span>
              </div>
              <div className="flex-1 px-3 pb-3 space-y-3 overflow-y-auto">
                {column.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} canManage={canCreateTasks()}
                    onDelete={handleDelete} onStatusChange={handleStatusChange} />
                ))}
                {column.tasks.length === 0 && (
                  <div className="text-center py-8 text-foreground/20 text-xs">No tasks</div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg glass-panel rounded-2xl border border-border p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold font-outfit">Create Task</h3>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-surface-hover">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground/80 block mb-1.5">Title *</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title" autoFocus
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground/80 block mb-1.5">Description</label>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={2}
                    placeholder="Optional description"
                    className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary/50 outline-none text-sm resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Priority</label>
                    <select value={newPriority} onChange={(e) => setNewPriority(e.target.value as Priority)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none text-sm">
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Status</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as Status)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none text-sm">
                      {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Team *</label>
                    <select value={newTeamId} onChange={(e) => setNewTeamId(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none text-sm">
                      {teams.length === 0 && <option value="">No teams</option>}
                      {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Due Date</label>
                    <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-border rounded-xl outline-none text-sm" />
                  </div>
                </div>

                {/* Assignees */}
                {teamMembers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground/80 block mb-1.5">Assign To</label>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {teamMembers.map(m => (
                        <label key={m._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border cursor-pointer hover:border-primary/30 transition-colors">
                          <input type="checkbox" checked={newAssignees.includes(m._id)}
                            onChange={() => toggleAssignee(m._id)}
                            className="w-4 h-4 accent-primary" />
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {m.fullname.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.fullname}</p>
                            <p className="text-xs text-foreground/50">{m.email}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {createError && <p className="text-red-500 text-sm">{createError}</p>}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)}
                    className="flex-1 py-3 rounded-xl border border-border hover:bg-surface-hover text-sm font-medium">
                    Cancel
                  </button>
                  <button onClick={handleCreateTask} disabled={creating || !newTitle.trim() || !newTeamId}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Task
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
