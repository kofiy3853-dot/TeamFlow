import { useStore } from '@/store/useStore';
import { PERMISSIONS, canAccess, type UserRole } from '@/lib/rbac';

/**
 * Hook to check user permissions
 */
export function useRBAC() {
  const user = useStore((state) => state.user);

  const userRole = (user?.role as UserRole) || 'MEMBER';

  const can = (feature: keyof typeof PERMISSIONS): boolean => {
    return canAccess(userRole, feature);
  };

  const isAdmin = (): boolean => userRole === 'ADMIN';
  const isMember = (): boolean => userRole === 'MEMBER';

  const canAccessDashboard = (): boolean => can('DASHBOARD');
  const canManageMembers = (): boolean => can('MANAGE_MEMBERS');
  const canCreateTasks = (): boolean => can('CREATE_TASKS');
  const canAssignTasks = (): boolean => can('ASSIGN_TASKS');
  const canViewAnalytics = (): boolean => can('TEAM_ANALYTICS');
  const canManageSubscription = (): boolean => can('SUBSCRIPTION_CONTROLS');
  const canViewAllPayments = (): boolean => can('VIEW_ALL_PAYMENTS');
  const canViewPersonalPayments = (): boolean => can('PERSONAL_PAYMENT_HISTORY');
  const canAccessChat = (): boolean => can('CHAT_ACCESS');
  const canViewAssignedTasks = (): boolean => can('VIEW_ASSIGNED_TASKS');

  return {
    user,
    userRole,
    can,
    isAdmin,
    isMember,
    canAccessDashboard,
    canManageMembers,
    canCreateTasks,
    canAssignTasks,
    canViewAnalytics,
    canManageSubscription,
    canViewAllPayments,
    canViewPersonalPayments,
    canAccessChat,
    canViewAssignedTasks,
  };
}
