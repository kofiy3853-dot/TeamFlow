// Node.js-only RBAC utilities — never import in client components

import { NextResponse } from 'next/server';
import { verifyToken } from './auth-node';
import { UserRole, AuthenticatedUser, hasRole } from './rbac';

export function getUserFromCookie(req: Request): AuthenticatedUser | null {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('token=')[1]?.split(';')[0];
  if (!token) return null;
  try {
    return verifyToken(token) as AuthenticatedUser;
  } catch (e) {
    return null;
  }
}

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request) => {
    const user = getUserFromCookie(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!hasRole(user.role, allowedRoles)) {
      return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
    }
    return null;
  };
}
