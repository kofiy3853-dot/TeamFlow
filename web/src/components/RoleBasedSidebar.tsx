'use client';

import { useRBAC } from '@/hooks/useRBAC';
import { useStore } from '@/store/useStore';
import { LayoutDashboard, Users, MessageSquare, CheckSquare, CreditCard, Settings, LogOut, BarChart3, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export function RoleBasedSidebar() {
  const { isAdmin, userRole } = useRBAC();
  const { sidebarOpen } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const adminNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const memberNavItems = [
    { name: 'My Workspace', href: '/workspace', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'My Payments', href: '/payments', icon: CreditCard },
    { name: 'Profile', href: '/settings', icon: User },
  ];

  const navItems = isAdmin() ? adminNavItems : memberNavItems;

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-screen bg-surface border-r border-border flex flex-col justify-between overflow-hidden relative z-20 shrink-0"
    >
      {/* Logo */}
      <div className="py-6 flex flex-col">
        <div className="flex items-center h-12 mb-8 px-4">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-outfit font-bold text-xl shadow-lg shadow-primary/30 shrink-0">
            TF
          </div>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ml-3 font-outfit font-bold text-xl tracking-tight whitespace-nowrap overflow-hidden"
            >
              TeamFlow
            </motion.span>
          )}
        </div>

        {/* Nav items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!sidebarOpen ? item.name : undefined}
                className={`flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/70 hover:bg-surface-hover hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-primary transition-colors'}`} />
                {sidebarOpen && (
                  <span className="ml-3 font-medium text-sm whitespace-nowrap">{item.name}</span>
                )}
                {isActive && (
                  <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-7 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role badge */}
        {sidebarOpen && (
          <div className="mx-4 mt-6 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold text-center">
            {userRole}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          title={!sidebarOpen ? 'Log out' : undefined}
          className="flex items-center w-full px-3 py-2.5 rounded-xl text-foreground/70 hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {sidebarOpen && <span className="ml-3 font-medium text-sm">Log out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
