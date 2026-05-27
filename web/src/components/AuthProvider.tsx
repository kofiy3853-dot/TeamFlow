'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ['/login', '/register', '/', '/payment'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useStore((state) => state.setUser);
  const setInitialized = useStore((state) => state.setInitialized);
  const initialized = useStore((state) => state.initialized);
  const pathname = usePathname();

  const isAuthPage = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '?'));

  useEffect(() => {
    const restoreUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error restoring user:', error);
      } finally {
        setInitialized(true);
      }
    };

    restoreUser();
  }, []);

  // On auth pages, render immediately without waiting
  if (isAuthPage) return children;

  // On protected pages, wait until user restore is done
  if (!initialized) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
