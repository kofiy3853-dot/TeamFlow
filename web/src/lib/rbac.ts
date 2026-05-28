// CLIENT-SAFE: Only types and permission matrix — no server imports

export type UserRole = 'ADMIN' | 'MEMBER' | 'SUPER_ADMIN';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  status: string;
}

/**
 * Permission matrix for features
 */
export const PERMISSIONS = {
  DASHBOARD: ['ADMIN'],
  TEAM_ANALYTICS: ['ADMIN'],
  MANAGE_MEMBERS: ['ADMIN'],
  CREATE_TASKS: ['ADMIN'],
  ASSIGN_TASKS: ['ADMIN'],
  VIEW_ASSIGNED_TASKS: ['ADMIN', 'MEMBER'],
  CHAT_ACCESS: ['ADMIN', 'MEMBER'],
  PAYMENT_HISTORY: ['ADMIN'],
  PERSONAL_PAYMENT_HISTORY: ['ADMIN', 'MEMBER'],
  TEAM_SETTINGS: ['ADMIN'],
  SUBSCRIPTION_CONTROLS: ['ADMIN'],
  VIEW_ALL_PAYMENTS: ['ADMIN'],
} as const;

/**
 * Check if user has permission for a feature
 */
export function canAccess(userRole: UserRole, feature: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[feature] as unknown as UserRole[];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
