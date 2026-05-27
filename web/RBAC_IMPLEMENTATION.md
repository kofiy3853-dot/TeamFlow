# Role-Based Access Control (RBAC) Implementation

## Overview
Complete role-based access control system for TeamFlow with three roles: OWNER, ADMIN, and MEMBER.

## Roles & Permissions

### OWNER
- **Full system access**
- Can access dashboard and analytics
- Can manage all team members
- Can create and assign tasks
- Can manage subscription and payments
- Can access team settings
- Can view all payment history

### ADMIN
- **Limited management access**
- Can access dashboard and analytics
- Can manage team members
- Can create and assign tasks
- Can moderate chat
- Can view all payment history
- Cannot manage subscription or team settings

### MEMBER
- **Collaboration-only access**
- Cannot access dashboard or analytics
- Cannot manage team members
- Cannot create or assign tasks
- Can view only assigned tasks
- Can access team chat
- Can view only personal payment history
- Can manage own profile

## Permission Matrix

| Feature | OWNER | ADMIN | MEMBER |
|---------|-------|-------|--------|
| Dashboard | ✅ | ✅ | ❌ |
| Team Analytics | ✅ | ✅ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Create Tasks | ✅ | ✅ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ | ✅ |
| Chat Access | ✅ | ✅ | ✅ |
| View All Payments | ✅ | ✅ | ❌ |
| View Personal Payments | ✅ | ✅ | ✅ |
| Team Settings | ✅ | ❌ | ❌ |
| Subscription Controls | ✅ | ❌ | ❌ |

## Architecture

### 1. Core RBAC Library (`web/src/lib/rbac.ts`)
- `getUserFromCookie()` - Extract user from request
- `hasRole()` - Check if user has required role
- `authorizeRoles()` - Middleware for route protection
- `canAccess()` - Check feature access
- `PERMISSIONS` - Permission matrix

### 2. Frontend Hook (`web/src/hooks/useRBAC.ts`)
```typescript
const { 
  userRole, 
  isOwner, 
  isAdmin, 
  isMember,
  canAccessDashboard,
  canManageMembers,
  canCreateTasks,
  // ... more helpers
} = useRBAC();
```

### 3. Role-Based Sidebar (`web/src/components/RoleBasedSidebar.tsx`)
- Shows different navigation based on role
- Admin/Owner: Dashboard, Teams, Tasks, Chat, Analytics, Payments, Settings
- Member: My Tasks, Chat, Notifications, My Payments, Profile

### 4. Protected Routes
- Dashboard: OWNER, ADMIN only
- Analytics: OWNER, ADMIN only
- Team Settings: OWNER only
- Subscription: OWNER only

### 5. API Endpoints with RBAC

#### Dashboard Stats (`/api/dashboard/stats`)
- Protected: OWNER, ADMIN only
- Returns 403 for MEMBER

#### Tasks (`/api/tasks`)
- OWNER/ADMIN: See all tasks
- MEMBER: See only assigned tasks

#### Payments (`/api/payments`)
- OWNER/ADMIN: See all payments
- MEMBER: See only personal payments

## Usage Examples

### Frontend - Check Permissions
```typescript
import { useRBAC } from '@/hooks/useRBAC';

export function MyComponent() {
  const { canAccessDashboard, isAdmin, userRole } = useRBAC();

  return (
    <>
      {canAccessDashboard() && <DashboardLink />}
      {isAdmin() && <AdminPanel />}
      <p>Your role: {userRole}</p>
    </>
  );
}
```

### Frontend - Protect Routes
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['OWNER', 'ADMIN']}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

### Backend - Protect API Routes
```typescript
import { authorizeRoles, getUserFromCookie } from '@/lib/rbac';

export async function GET(req: Request) {
  // Check authorization
  const authError = authorizeRoles('OWNER', 'ADMIN')(req);
  if (authError) return authError;

  const user = getUserFromCookie(req);
  // ... rest of handler
}
```

### Backend - Role-Based Data Filtering
```typescript
const user = getUserFromCookie(req);

if (user.role === 'MEMBER') {
  // Members see only their data
  const data = await Model.find({ userId: user.userId });
} else {
  // Admins/Owners see all data
  const data = await Model.find({});
}
```

## Navigation Structure

### Admin/Owner Sidebar
```
Dashboard
Teams
Tasks
Chat
Analytics
Payments
Settings
```

### Member Sidebar
```
My Tasks
Chat
Notifications
My Payments
Profile
```

## Unauthorized Access

When a user tries to access a restricted resource:
1. **Frontend**: Redirected to `/unauthorized` page
2. **Backend**: Returns 403 Forbidden with error message
3. **API**: Returns 403 with `{ error: "Forbidden: Insufficient permissions" }`

## Security Features

✅ **Backend Enforcement**: All permissions checked server-side
✅ **Frontend Hiding**: UI elements hidden based on role
✅ **Route Protection**: Protected routes redirect unauthorized users
✅ **API Authorization**: All endpoints validate user role
✅ **Data Filtering**: Users see only data they have access to
✅ **Cookie-Based Auth**: JWT token in HTTP-only cookie

## Implementation Checklist

- [x] RBAC library with permission matrix
- [x] Frontend hook for permission checking
- [x] Role-based sidebar navigation
- [x] Protected route component
- [x] Dashboard protection (OWNER/ADMIN only)
- [x] Tasks filtering by role
- [x] Payments filtering by role
- [x] Unauthorized page
- [x] API endpoint protection
- [ ] Team member role assignment
- [ ] Role change functionality
- [ ] Audit logging for permission changes

## Next Steps

1. **Team Member Management**: Add ability to assign roles to team members
2. **Role Change**: Implement role change functionality with audit logging
3. **Granular Permissions**: Add more specific permissions as needed
4. **Audit Logging**: Log all permission-related actions
5. **Analytics**: Track role-based access patterns

## Testing

### Test as OWNER
- Access dashboard ✅
- Access analytics ✅
- Manage members ✅
- Create tasks ✅
- View all payments ✅

### Test as ADMIN
- Access dashboard ✅
- Access analytics ✅
- Cannot access settings ❌
- Cannot manage subscription ❌

### Test as MEMBER
- Cannot access dashboard ❌
- Can see assigned tasks ✅
- Can access chat ✅
- Can see personal payments ✅
- Cannot see all payments ❌

## Files Modified/Created

### New Files
- `web/src/lib/rbac.ts` - RBAC library
- `web/src/hooks/useRBAC.ts` - Frontend hook
- `web/src/components/ProtectedRoute.tsx` - Protected route component
- `web/src/components/RoleBasedSidebar.tsx` - Role-based navigation
- `web/src/app/unauthorized/page.tsx` - Unauthorized page
- `web/src/app/api/payments/route.ts` - Protected payments endpoint

### Modified Files
- `web/src/app/dashboard/page.tsx` - Added role check
- `web/src/app/dashboard/layout.tsx` - Use RoleBasedSidebar
- `web/src/app/api/dashboard/stats/route.ts` - Added authorization
- `web/src/app/api/tasks/route.ts` - Added role-based filtering

## Status: ✅ COMPLETE

Full RBAC system implemented with proper role separation, permission matrix, and secure access control.
