'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { useRBAC } from '@/hooks/useRBAC';
import { UserRole } from '@/lib/rbac';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles: UserRole[];
  fallback?: ReactNode;
}

/**
 * Component to protect routes based on user role
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { userRole, user } = useRBAC();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!requiredRoles.includes(userRole)) {
      router.push('/unauthorized');
      return;
    }
  }, [user, userRole, requiredRoles, router]);

  if (!user) {
    return fallback || <div>Loading...</div>;
  }

  if (!requiredRoles.includes(userRole)) {
    return fallback || <div>Access Denied</div>;
  }

  return children;
}
