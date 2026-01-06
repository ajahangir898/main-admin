import { ReactNode, ComponentType } from 'react';
import { useAuth, ResourceType, ActionType } from '../context/AuthContext';
import { Lock, AlertTriangle, LogIn } from 'lucide-react';

interface AccessDeniedProps { reason?: string; onLogin?: () => void; isAuthRequired?: boolean; }

export const AccessDenied = ({ reason = "You don't have permission to access this page.", onLogin, isAuthRequired = false }: AccessDeniedProps) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
    <div className="bg-gradient-to-br from-[#1a0b0f]/80 via-[#0f0810]/90 to-[#0a0f14]/80 backdrop-blur-xl rounded-3xl border border-red-500/20 p-12 max-w-lg text-center shadow-2xl">
      <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-900/30">
        {isAuthRequired ? <LogIn className="text-red-400" size={40}/> : <Lock className="text-red-400" size={40}/>}
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">{isAuthRequired ? 'Authentication Required' : 'Access Denied'}</h2>
      <p className="text-slate-400 mb-6">{reason}</p>
      {isAuthRequired && onLogin && <button onClick={onLogin} className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-900/30">Sign In</button>}
      {!isAuthRequired && <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-4"><AlertTriangle size={16}/><span>Contact your administrator for access</span></div>}
    </div>
  </div>
);

interface ProtectedRouteProps { children: ReactNode; resource: ResourceType; action?: ActionType; fallback?: ReactNode; showAccessDenied?: boolean; }

export const ProtectedRoute = ({ children, resource, action = 'read', fallback, showAccessDenied = true }: ProtectedRouteProps) => {
  const { hasPermission, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/30 border-t-emerald-500"/></div>;
  if (!isAuthenticated) return fallback ? <>{fallback}</> : showAccessDenied ? <AccessDenied reason="You must be logged in to access this page." isAuthRequired/> : null;
  if (!hasPermission(resource, action)) return fallback ? <>{fallback}</> : showAccessDenied ? <AccessDenied reason={`You don't have ${action} permission for ${resource.replace(/_/g, ' ')}.`}/> : null;
  return <>{children}</>;
};

interface ProtectedElementProps { children: ReactNode; resource: ResourceType; action: ActionType; fallback?: ReactNode; }

export const ProtectedElement = ({ children, resource, action, fallback = null }: ProtectedElementProps) => {
  const { hasPermission, isAuthenticated } = useAuth();
  if (!isAuthenticated || !hasPermission(resource, action)) return <>{fallback}</>;
  return <>{children}</>;
};

export function withPermission<P extends object>(C: ComponentType<P>, resource: ResourceType, action: ActionType = 'read') {
  const W = (props: P) => <ProtectedRoute resource={resource} action={action}><C {...props}/></ProtectedRoute>;
  W.displayName = `withPermission(${C.displayName || C.name || 'Component'})`;
  return W;
}

interface RequireRoleProps { children: ReactNode; roles: Array<'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff'>; fallback?: ReactNode; }

export const RequireRole = ({ children, roles, fallback = null }: RequireRoleProps) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
};

const checkReadOnly = (resource: ResourceType, auth: { canRead: (r: ResourceType) => boolean; canWrite: (r: ResourceType) => boolean; canEdit: (r: ResourceType) => boolean; canDelete: (r: ResourceType) => boolean; isAuthenticated: boolean }) =>
  !auth.isAuthenticated || (auth.canRead(resource) && !auth.canWrite(resource) && !auth.canEdit(resource) && !auth.canDelete(resource));

interface ReadOnlyWrapperProps { children: ReactNode; resource: ResourceType; showBadge?: boolean; disableInteraction?: boolean; }

export const ReadOnlyWrapper = ({ children, resource, showBadge = true, disableInteraction = true }: ReadOnlyWrapperProps) => {
  const auth = useAuth();
  const readOnly = checkReadOnly(resource, auth);
  if (!readOnly) return <>{children}</>;
  return (
    <div className="relative">
      {showBadge && <div className="absolute top-0 right-0 z-10 px-3 py-1 text-xs font-semibold text-amber-300 bg-amber-500/20 rounded-bl-lg border-l border-b border-amber-500/30">Read Only</div>}
      <div className={disableInteraction ? 'pointer-events-none select-none opacity-90' : ''} style={disableInteraction ? { cursor: 'not-allowed' } : undefined}>{children}</div>
    </div>
  );
};

export const useReadOnly = (resource: ResourceType) => checkReadOnly(resource, useAuth());

export default ProtectedRoute;
