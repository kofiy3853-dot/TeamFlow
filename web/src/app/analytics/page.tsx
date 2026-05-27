'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useRBAC } from '@/hooks/useRBAC';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const { canViewAnalytics, user } = useRBAC();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return; // wait for user to load
    if (!canViewAnalytics()) {
      router.push('/unauthorized');
      return;
    }
    fetch('/api/dashboard/stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const cards = [
    { label: 'Active Projects', value: stats?.activeProjects ?? 0, icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Team Members', value: stats?.teamMembers ?? 0, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Tasks Completed', value: stats?.tasksCompleted ?? 0, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Productivity', value: `${stats?.productivity ?? 0}%`, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h2 className="text-3xl font-bold font-outfit tracking-tight">Analytics</h2>
        <p className="text-foreground/60 mt-1">Track your team's performance and productivity</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-panel rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} mb-4`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <h3 className="text-3xl font-bold font-outfit mb-1">{card.value}</h3>
                  <p className="text-sm text-foreground/60">{card.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Recent Tasks */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-bold font-outfit mb-6">Recent Tasks</h3>
            {stats?.recentTasks?.length > 0 ? (
              <div className="space-y-3">
                {stats.recentTasks.map((task: any) => (
                  <div key={task._id} className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        task.status === 'DONE' ? 'bg-emerald-500' :
                        task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                        task.status === 'REVIEW' ? 'bg-purple-500' : 'bg-foreground/30'
                      }`} />
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-foreground/50">{task.team}</span>
                      {task.dueDate && (
                        <span className="text-xs text-foreground/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {task.dueDate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground/40">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No tasks yet. Create tasks to see analytics.</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
