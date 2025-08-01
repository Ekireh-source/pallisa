# Permission System Documentation

This document explains how to use the permission-based navigation and access control system in the Pallisa application.

## Overview

The permission system allows you to control access to different parts of the application based on user roles and permissions. It consists of:

1. **Permission Utilities** (`/lib/permissions.ts`) - Core permission checking functions
2. **React Hooks** (`/hooks/usePermissions.ts`) - React hooks for permission checking
3. **Protected Components** (`/components/auth/ProtectedRoute.tsx`) - Components for protecting routes and UI elements
4. **Permission-based Sidebar** - Automatically shows/hides navigation items based on permissions

## Permission Structure

### Permission Codes

Permissions are defined as strings in the format: `module.action`

Examples:
- `dashboard.view_dashboard` - View dashboard
- `expenses.view_expenses` - View expenses
- `members.manage_students` - Manage students
- `admin.manage_salaries` - Manage salaries

### Permission Groups

Permissions are grouped by functionality:

- **EXPENSE_MANAGEMENT** - All expense-related permissions
- **FEES_MANAGEMENT** - All fee-related permissions  
- **MEMBERS_MANAGEMENT** - All member-related permissions
- **SALARY_MANAGEMENT** - All salary-related permissions
- **SYSTEM_ADMIN** - All system administration permissions

## Usage

### 1. In Components

#### Using React Hooks

```tsx
import { useHasPermission, useCanAccessSection } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function MyComponent() {
  const canViewExpenses = useHasPermission(PERMISSIONS.VIEW_EXPENSES);
  const canAccessExpenseSection = useCanAccessSection('EXPENSE_MANAGEMENT');

  if (!canViewExpenses) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {canAccessExpenseSection && <ExpenseSection />}
    </div>
  );
}
```

#### Using Protected Components

```tsx
import { RequirePermission, ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';

// Protect a specific component
<RequirePermission permission={PERMISSIONS.VIEW_EXPENSES}>
  <ExpenseList />
</RequirePermission>

// Protect a route with multiple permissions
<ProtectedRoute permissions={[PERMISSIONS.VIEW_EXPENSES, PERMISSIONS.CREATE_EXPENSES]}>
  <ExpensePage />
</ProtectedRoute>

// Require all permissions
<ProtectedRoute 
  permissions={[PERMISSIONS.VIEW_EXPENSES, PERMISSIONS.CREATE_EXPENSES]} 
  requireAll={true}
>
  <ExpensePage />
</ProtectedRoute>
```

### 2. In Pages

```tsx
// pages/expenses/index.tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PERMISSIONS } from '@/lib/permissions';

export default function ExpensesPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.VIEW_EXPENSES}>
      <div>
        <h1>Expenses</h1>
        <ExpenseList />
      </div>
    </ProtectedRoute>
  );
}
```

### 3. Conditional Rendering

```tsx
import { useHasPermission } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

function ExpenseActions() {
  const canCreate = useHasPermission(PERMISSIONS.CREATE_EXPENSES);
  const canEdit = useHasPermission(PERMISSIONS.EDIT_EXPENSES);
  const canDelete = useHasPermission(PERMISSIONS.DELETE_EXPENSES);

  return (
    <div>
      {canCreate && <button>Create Expense</button>}
      {canEdit && <button>Edit</button>}
      {canDelete && <button>Delete</button>}
    </div>
  );
}
```

## Sidebar Navigation

The sidebar automatically shows/hides sections and items based on user permissions:

- **Sections** are shown if the user has access to any item in that section
- **Items** are shown if the user has the specific permission for that item
- **Empty sections** are automatically hidden

### Adding New Navigation Items

To add a new navigation item with permission checking:

1. Add the permission to `PERMISSIONS` in `/lib/permissions.ts`
2. Add the permission to the appropriate group in `PERMISSION_GROUPS`
3. Add the item to the navigation array with the permission property:

```tsx
const newItems = [
  {
    title: "New Feature",
    url: "/new-feature",
    icon: NewIcon,
    permission: PERMISSIONS.VIEW_NEW_FEATURE,
  },
]
```

## Permission Checking Functions

### Core Functions

```tsx
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

// Check single permission
const canView = hasPermission(user, 'expenses.view_expenses');

// Check any of multiple permissions
const canAccess = hasAnyPermission(user, ['expenses.view_expenses', 'expenses.create_expenses']);

// Check all permissions
const canManage = hasAllPermissions(user, ['expenses.view_expenses', 'expenses.create_expenses']);
```

### Section Access

```tsx
import { canAccessSection } from '@/lib/permissions';

// Check if user can access expense management section
const canAccessExpenses = canAccessSection(user, 'EXPENSE_MANAGEMENT');
```

## User Permission Structure

The user object contains permission information:

```tsx
interface User {
  role?: {
    id: number;
    name: string;
    is_superadmin: boolean;
    permissions: Permission[];
  };
  user_permissions?: UserPermission[];
}
```

### Permission Sources

1. **Role-based permissions** - Inherited from the user's role
2. **User-specific permissions** - Directly assigned to the user
3. **Super admin** - Has all permissions automatically

## Best Practices

1. **Always check permissions** before rendering sensitive content
2. **Use permission groups** for section-level access control
3. **Provide fallback content** when permissions are denied
4. **Test with different user roles** to ensure proper access control
5. **Keep permission codes consistent** across the application

## Adding New Permissions

1. Add the permission code to `PERMISSIONS` in `/lib/permissions.ts`
2. Add it to the appropriate group in `PERMISSION_GROUPS`
3. Update the backend to include the permission in role assignments
4. Test the permission with different user roles

## Troubleshooting

### Common Issues

1. **Permission not working** - Check if the permission code matches between frontend and backend
2. **Sidebar items not showing** - Verify the permission is in the correct group
3. **Super admin not working** - Check if `user.role.is_superadmin` is set correctly

### Debugging

```tsx
import { useCurrentUser } from '@/hooks/usePermissions';

function DebugPermissions() {
  const user = useCurrentUser();
  
  console.log('User:', user);
  console.log('Role:', user?.role);
  console.log('Permissions:', user?.user_permissions);
  
  return <div>Check console for permission debug info</div>;
}
``` 