'use client';

import { motion } from "framer-motion";
import { Users, CheckCircle, Clock, TrendingUp, MessageSquare, Loader2 } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRBAC } from "@/hooks/useRBAC";

interface DashboardStats {
  activeProjects: number;
  teamMembers: number;
  tasksCompleted: number;
  productivity: number;
  recentTasks: any[];
  activities: any[];
}

interface User {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  subscriptionStatus: string;
  createdAt: string;
}

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const initialized = useStore((state) => state.initialized);
  const router = useRouter();
  const { canAccessDashboard } = useRBAC();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  // Authentication guard - wait for initialization
  useEffect(() => {
    if (initialized) {
      if (!user) {
        router.push('/login');
      } else if (!canAccessDashboard()) {
        router.push('/unauthorized');
      } else {
        setPageLoading(false);
      }
    }
  }, [user, initialized, router, canAccessDashboard]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError('');
        
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/dashboard/stats', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }),
          fetch('/api/admin/users', {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          })
        ]);
        
        if (!statsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        const statsData = await statsRes.json();
        setStats(statsData);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(usersData.users || []);
        }
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        setError(err.message || 'Failed to load dashboard');
        setStats({
          activeProjects: 0,
          teamMembers: 0,
          tasksCompleted: 0,
          productivity: 0,
          recentTasks: [],
          activities: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && canAccessDashboard()) {
      fetchDashboardData();
    }
  }, [user]);

  const statsConfig = [
    { label: "Active Projects", value: stats?.activeProjects || "0", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Team Members", value: stats?.teamMembers || "0", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Tasks Completed", value: stats?.tasksCompleted || "0", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Productivity", value: `+${stats?.productivity || 0}%`, icon: TrendingUp, color: "text-rose-500", bg: "bg-rose-500/10" },
  ];

  const firstName = user?.fullname?.split(' ')[0] || 'User';

  // Show loading state while initializing
  if (!initialized || pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-outfit font-bold tracking-tight mb-2"
          >
            Welcome back, <span className="text-primary">{firstName}</span> 👋
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70"
          >
            Here's what's happening with your teams today.
          </motion.p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsConfig.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.2 }}
                className="glass-panel rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
            <div>
              <h3 className="text-3xl font-bold font-outfit mb-1">{stat.value}</h3>
              <p className="text-sm text-foreground/60 font-medium">{stat.label}</p>
            </div>
          </motion.div>
            );
          })}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-outfit">Recent Tasks</h3>
            <button 
              onClick={() => router.push('/tasks')}
              className="text-sm text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {stats?.recentTasks && stats.recentTasks.length > 0 ? (
              stats.recentTasks.map((task: any, i: number) => (
                <div key={task._id || i} className="p-4 rounded-xl bg-surface hover:bg-surface-hover transition-colors border border-border flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded-md border-2 border-border group-hover:border-primary transition-colors"></div>
                    <div>
                      <h4 className="font-medium mb-1 group-hover:text-primary transition-colors">{task.title || 'Untitled Task'}</h4>
                      <p className="text-xs text-foreground/60">{task.team || 'Team'} • Due {task.dueDate || 'Soon'}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-surface shrink-0"></div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No recent tasks</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* All Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-panel rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-outfit">All Users</h3>
            <span className="text-sm text-foreground/60">{users.length} total</span>
          </div>
          
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {users.length > 0 ? (
              users.map((u) => (
                <div key={u._id} className="p-3 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.fullname.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.fullname}</p>
                      <p className="text-xs text-foreground/50 truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'ADMIN' ? 'bg-primary/10 text-primary' : 
                      u.role === 'SUPER_ADMIN' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-surface-hover text-foreground/60'
                    }`}>
                      {u.role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                      u.subscriptionStatus === 'EXPIRED' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {u.subscriptionStatus}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No users found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
        </>
      )}
    </div>
  );
}
