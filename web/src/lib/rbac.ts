// CLIENT-SAFE: Only types and permission matrix — no server imports

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'SUPER_ADMIN';

export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
  status: string;
}

/**
 * Permission matrix for features
 */
export const PERMISSIONS = {
  DASHBOARD: ['OWNER', 'ADMIN'],
  TEAM_ANALYTICS: ['OWNER', 'ADMIN'],
  MANAGE_MEMBERS: ['OWNER', 'ADMIN'],
  CREATE_TASKS: ['OWNER', 'ADMIN'],
  ASSIGN_TASKS: ['OWNER', 'ADMIN'],
  VIEW_ASSIGNED_TASKS: ['OWNER', 'ADMIN', 'MEMBER'],
  CHAT_ACCESS: ['OWNER', 'ADMIN', 'MEMBER'],
  PAYMENT_HISTORY: ['OWNER', 'ADMIN'],
  PERSONAL_PAYMENT_HISTORY: ['OWNER', 'ADMIN', 'MEMBER'],
  TEAM_SETTINGS: ['OWNER'],
  SUBSCRIPTION_CONTROLS: ['OWNER'],
  VIEW_ALL_PAYMENTS: ['OWNER', 'ADMIN'],
} as const;

/**
 * Check if user has permission for a feature
 */
export function canAccess(userRole: UserRole, feature: keyof typeof PERMISSIONS): boolean {
  const allowedRoles = PERMISSIONS[feature] as UserRole[];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}
