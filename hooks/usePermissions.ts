import { useCallback } from 'react';
import { useAuth, ResourceType, ActionType } from '../context/AuthContext';

export const usePermissions = (resource: ResourceType, action: ActionType): boolean => {
  const { hasPermission, isAuthenticated, user } = useAuth();
  return isAuthenticated && !!user && hasPermission(resource, action);
};

export const useResourceAccess = (resource: ResourceType) => {
  const { hasPermission, isAuthenticated, user, permissions } = useAuth();
  return { canRead: hasPermission(resource, 'read'), canWrite: hasPermission(resource, 'write'), canEdit: hasPermission(resource, 'edit'), canDelete: hasPermission(resource, 'delete'), isAuthenticated, userRole: user?.role, rawPermissions: permissions[resource] || [] };
};

export const useAdminAccess = () => {
  const { user, isAuthenticated } = useAuth();
  return { isAdmin: isAuthenticated && user && ['admin', 'tenant_admin', 'super_admin'].includes(user.role), isSuperAdmin: isAuthenticated && user?.role === 'super_admin', isTenantAdmin: isAuthenticated && user?.role === 'tenant_admin', userRole: user?.role, isAuthenticated };
};

export const useCanAccess = (resource: ResourceType) => {
  const { hasPermission, isAuthenticated, user } = useAuth();
  const canAccess = isAuthenticated && hasPermission(resource, 'read');
  return { canAccess, reason: !isAuthenticated ? 'You must be logged in to access this page.' : !canAccess ? "You don't have permission to access this section." : '', userRole: user?.role };
};

export const usePermissionCheck = (permissions: Array<{ resource: ResourceType; action: ActionType }>) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  return { hasAny: hasAnyPermission(permissions), hasAll: hasAllPermissions(permissions), checkSpecific: useCallback((r: ResourceType, a: ActionType) => hasPermission(r, a), [hasPermission]) };
};

export default usePermissions;
