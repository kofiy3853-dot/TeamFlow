'use client';

import { useStore } from "@/store/useStore";
import { LayoutDashboard, Users, MessageSquare, CheckSquare, CreditCard, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Teams", href: "/teams", icon: Users },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const sidebarOpen = useStore((state) => state.sidebarOpen);
  const setUser = useStore((state) => state.setUser);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        // Clear user from store
        setUser(null);
        // Redirect to login
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 256 : 80 }}
      className="h-screen bg-surface border-r border-border flex flex-col justify-between overflow-hidden relative z-20 transition-colors duration-300"
    >
      <div className="py-6 flex flex-col items-center">
        <div className="flex items-center justify-center h-12 w-full mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-outfit font-bold text-xl shadow-lg shadow-primary/30">
            TF
          </div>
          {sidebarOpen && (
            <span className="ml-3 font-outfit font-bold text-2xl tracking-tight">
              TeamFlow
            </span>
          )}
        </div>

        <nav className="w-full px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const linkClass = [
              "flex items-center px-3 py-3 rounded-xl transition-all duration-200 group relative",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground/70 hover:bg-surface-hover hover:text-foreground",
            ].join(" ");
            const iconClass = [
              "w-6 h-6 shrink-0",
              isActive ? "text-primary" : "group-hover:text-primary transition-colors",
            ].join(" ");

            return (
              <Link key={item.name} href={item.href} className={linkClass}>
                <Icon className={iconClass} />
                {sidebarOpen && (
                  <span className="ml-4 font-medium">{item.name}</span>
                )}
                {isActive && sidebarOpen && (
                  <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-3 rounded-xl text-foreground/70 hover:bg-red-500/10 hover:text-red-500 transition-colors duration-200"
        >
          <LogOut className="w-6 h-6 shrink-0" />
          {sidebarOpen && <span className="ml-4 font-medium">Log out</span>}
        </button>
      </div>
    </motion.aside>
  );
}
