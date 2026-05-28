'use client';

import { useStore } from "@/store/useStore";
import { Menu, Moon, Sun, Bell, CheckCheck, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/workspace': 'My Workspace',
  '/teams': 'Teams',
  '/tasks': 'Task Board',
  '/chat': 'Chat',
  '/payments': 'Payments',
  '/settings': 'Settings',
  '/analytics': 'Analytics',
};

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function Header() {
  const { toggleSidebar, theme, toggleTheme, user } = useStore();
  const pathname = usePathname();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = Object.entries(routeLabels).find(([route]) =>
    pathname.startsWith(route)
  )?.[1] || 'TeamFlow';

  const initials = user?.fullname
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';


  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => fetchNotifications(), 0);
    return () => clearTimeout(timer);
  }, [user]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', credentials: 'include' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const typeIcon: Record<string, string> = {
    TASK: '📋',
    TEAM: '👥',
    PAYMENT: '💳',
    SYSTEM: '🔔',
  };

  return (
    <header className="h-16 glass-panel border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-outfit font-semibold text-lg tracking-tight hidden sm:block">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) fetchNotifications(); }}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-foreground/70" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-80 glass-panel border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifs(false)} aria-label="Close notifications" title="Close notifications" className="p-1 rounded-lg hover:bg-surface-hover">
                      <X className="w-4 h-4 text-foreground/50" />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-foreground/40 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n._id} className={`px-4 py-3 border-b border-border/50 hover:bg-surface-hover transition-colors ${!n.read ? 'bg-primary/5' : ''}`}>
                        <div className="flex items-start gap-3">
                          <span className="text-lg shrink-0">{typeIcon[n.type] || '🔔'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <p className="text-xs text-foreground/50 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-foreground/30 mt-1">
                              {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground/70" />
          ) : (
            <Moon className="w-5 h-5 text-foreground/70" />
          )}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* User avatar */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-primary to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.fullname || 'User'}</p>
            <p className="text-xs text-foreground/50 mt-0.5">{user?.role || 'MEMBER'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
