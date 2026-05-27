'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, MessageSquare, CreditCard, User, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

export default function WorkspacePage() {
  const user = useStore((state) => state.user);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const firstName = user?.fullname?.split(' ')[0] || 'there';

  useEffect(() => {
    fetch('/api/tasks', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTasks(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const pending = tasks.filter(t => t.status !== 'DONE').length;
  const done = tasks.filter(t => t.status === 'DONE').length;

  const quickLinks = [
    { label: 'My Tasks', href: '/tasks', icon: CheckSquare, color: 'bg-blue-500/10 text-blue-500', value: `${pending} pending` },
    { label: 'Team Chat', href: '/chat', icon: MessageSquare, color: 'bg-purple-500/10 text-purple-500', value: 'Open chat' },
    { label: 'My Payments', href: '/payments', icon: CreditCard, color: 'bg-emerald-500/10 text-emerald-500', value: 'View history' },
    { label: 'Profile', href: '/settings', icon: User, color: 'bg-rose-500/10 text-rose-500', value: 'Edit profile' },
  ];

  const priorityColor: Record<string, string> = {
    LOW: 'bg-blue-500/10 text-blue-400',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400',
    HIGH: 'bg-orange-500/10 text-orange-400',
    URGENT: 'bg-red-500/10 text-red-400',
  };

  const statusDot: Record<string, string> = {
    TODO: 'bg-foreground/20',
    IN_PROGRESS: 'bg-blue-500',
    REVIEW: 'bg-purple-500',
    DONE: 'bg-emerald-500',
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome */}
      <div>
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-outfit font-bold tracking-tight mb-2">
          Hey, <span className="text-primary">{firstName}</span> 👋
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-foreground/60">
          {pending > 0 ? `You have ${pending} task${pending > 1 ? 's' : ''} pending.` : 'All caught up! No pending tasks.'}
        </motion.p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-2xl p-5 border border-border">
          <p className="text-3xl font-bold font-outfit text-primary">{pending}</p>
          <p className="text-sm text-foreground/60 mt-1">Tasks pending</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass-panel rounded-2xl p-5 border border-border">
          <p className="text-3xl font-bold font-outfit text-emerald-500">{done}</p>
          <p className="text-sm text-foreground/60 mt-1">Tasks completed</p>
        </motion.div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div key={link.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}>
              <Link href={link.href}
                className="glass-panel rounded-2xl p-5 border border-border hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col gap-3 block">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold font-outfit text-sm">{link.label}</h3>
                  <p className="text-xs text-foreground/50 mt-0.5">{link.value}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* My Tasks */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold font-outfit">My Tasks</h3>
          <Link href="/tasks" className="text-sm text-primary hover:underline font-medium">View all →</Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.slice(0, 6).map((task: any) => (
              <div key={task._id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot[task.status] || 'bg-foreground/20'}`} />
                  <div>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-foreground/40 mt-0.5">
                      {task.status?.replace('_', ' ')}
                      {task.dueDate && ` · Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${priorityColor[task.priority] || ''}`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-foreground/40">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tasks assigned yet</p>
            <p className="text-sm mt-1">Your team leader will assign tasks to you</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
