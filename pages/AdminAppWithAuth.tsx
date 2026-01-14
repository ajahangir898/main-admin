// AdminAppWithAuth.tsx - Wrapper component that integrates authentication with AdminApp
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';

import * as authService from '../services/authService';
import { User, Tenant, Order, Product, ThemeConfig, WebsiteConfig, DeliveryConfig, CourierConfig, FacebookPixelConfig, ChatMessage } from '../types';
import { Loader2 } from 'lucide-react';

const AdminApp = lazy(() => import('./AdminApp'));

// Permission map type
type PermissionMap = Record<string, string[]>;

interface AdminAppWithAuthProps {
  activeTenantId: string;
  tenants: Tenant[];
  orders: Order[];
  products: Product[];
  logo: string | null;
  themeConfig: ThemeConfig;
  websiteConfig?: WebsiteConfig;
  deliveryConfig: DeliveryConfig[];
  courierConfig: CourierConfig;
  facebookPixelConfig: FacebookPixelConfig;
  chatMessages: ChatMessage[];
  parentUser?: User | null; // User from parent App.tsx - syncs profile updates
  onLogout: () => void;
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => void;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkDeleteProducts: (ids: number[]) => void;
  onBulkUpdateProducts: (ids: number[], updates: Partial<Product>) => void;
  onUpdateLogo: (logo: string | null) => void;
  onUpdateTheme: (config: ThemeConfig) => Promise<void>;
  onUpdateWebsiteConfig: (config: WebsiteConfig) => Promise<void>;
  onUpdateDeliveryConfig: (configs: DeliveryConfig[]) => void;
  onUpdateCourierConfig: (config: CourierConfig) => void;
  onUpdateProfile: (user: User) => void;
  onTenantChange: (tenantId: string) => void;
  isTenantSwitching: boolean;
  onSwitchToStore: () => void;
  onOpenAdminChat: () => void;
  hasUnreadChat: boolean;
  // Landing pages
  landingPages: any[];
  onCreateLandingPage: (page: any) => void;
  onUpsertLandingPage: (page: any) => void;
  onToggleLandingPublish: (pageId: string, status: string) => void;
}

const AdminAppWithAuth: React.FC<AdminAppWithAuthProps> = (props) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionMap>({});
  const [isValidating, setIsValidating] = useState(true);

  // Sync user when parentUser changes (e.g., profile update from Settings)
  useEffect(() => {
    if (props.parentUser && props.parentUser.image !== user?.image) {
      setUser(props.parentUser);
    }
  }, [props.parentUser]);

  // Validate session on mount
  useEffect(() => {
    const validateSession = async () => {
      try {
        // First check stored user - prioritize this over token validation
        const storedUser = authService.getStoredUser();
        const storedPerms = authService.getStoredPermissions();
        
        if (storedUser) {
          setUser(storedUser as User);
          
          // Convert stored permissions
          if (Array.isArray(storedPerms)) {
            const permMap: PermissionMap = {};
            storedPerms.forEach((p: any) => {
              permMap[p.resource] = p.actions;
            });
            setUserPermissions(permMap);
          } else if (storedPerms && typeof storedPerms === 'object') {
            setUserPermissions(storedPerms as PermissionMap);
          }
          
          setIsAuthenticated(true);
          
          // Optionally refresh user data in background (non-blocking)
          authService.getCurrentUser().then(({ user: currentUser, permissions }) => {
            setUser(currentUser as User);
            if (Array.isArray(permissions)) {
              const permMap: PermissionMap = {};
              permissions.forEach((p: any) => {
                permMap[p.resource] = p.actions;
              });
              setUserPermissions(permMap);
            }
          }).catch(() => {
            // Silently fail - user is still logged in with stored data
            console.log('Background refresh failed, using stored session');
          });
        } else {
          // No stored user - not authenticated
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        // Don't logout - just mark as not authenticated
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateSession();
  }, []);

  // Handle successful login
  const handleLoginSuccess = useCallback(async () => {
    const storedUser = authService.getStoredUser();
    const storedPerms = authService.getStoredPermissions();
    
    setUser(storedUser as User);
    
    // Convert permissions
    if (Array.isArray(storedPerms)) {
      const permMap: PermissionMap = {};
      storedPerms.forEach((p: any) => {
        permMap[p.resource] = p.actions;
      });
      setUserPermissions(permMap);
    } else if (storedPerms && typeof storedPerms === 'object') {
      setUserPermissions(storedPerms as PermissionMap);
    }
    
    setIsAuthenticated(true);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    props.onLogout();
  }, [props.onLogout]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Show login if not authenticated
  // if (!isAuthenticated) {
  //   return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  // }

  // Show admin app with authenticated user
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      }
    >
      <AdminApp
        {...props}
        user={user}
        userPermissions={userPermissions}
        onLogout={handleLogout}
      />
    </Suspense>
  );
};

export default AdminAppWithAuth;
