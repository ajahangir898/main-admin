// admin/pages/AdminApp.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Suspense, lazy } from 'react';
import { 
  Product, Order, User, ThemeConfig, WebsiteConfig, Role, Category, SubCategory, 
  ChildCategory, Brand, Tag, DeliveryConfig, CourierConfig, Tenant, 
  CreateTenantPayload, FacebookPixelConfig, ChatMessage 
} from '../types';
import { DataService } from '../services/DataService';
import * as authService from '../services/authService';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import {
  DashboardSkeleton,
  OrdersSkeleton,
  ProductsSkeleton,
  InventorySkeleton,
  CustomersSkeleton,
  ActivityLogSkeleton,
  PageSkeleton,
} from '../components/SkeletonLoaders';

// Lazy loaded admin pages with webpackChunkName for better caching
const AdminDashboard = lazy(() => import(/* webpackChunkName: "admin-dashboard" */ './AdminDashboard'));
const AdminOrders = lazy(() => import(/* webpackChunkName: "admin-orders" */ './AdminOrders'));
const AdminProducts = lazy(() => import(/* webpackChunkName: "admin-products" */ './AdminProducts'));
const AdminCustomization = lazy(() => import(/* webpackChunkName: "admin-customization" */ './AdminCustomization'));
const AdminSettings = lazy(() => import(/* webpackChunkName: "admin-settings" */ './AdminSettingsNew'));
const AdminManageShop = lazy(() => import(/* webpackChunkName: "admin-manage-shop" */ './AdminManageShop'));
const AdminControlNew = lazy(() => import(/* webpackChunkName: "admin-control-new" */ './AdminControlNew'));
const AdminCatalog = lazy(() => import(/* webpackChunkName: "admin-catalog" */ './AdminCatalog'));
const AdminBusinessReport = lazy(() => import(/* webpackChunkName: "admin-reports" */ './AdminBusinessReport'));
const AdminDeliverySettings = lazy(() => import(/* webpackChunkName: "admin-delivery" */ './AdminDeliverySettings'));
const AdminCourierSettings = lazy(() => import(/* webpackChunkName: "admin-courier" */ './AdminCourierSettings'));
const AdminInventory = lazy(() => import(/* webpackChunkName: "admin-inventory" */ './AdminInventory'));
const AdminReviews = lazy(() => import(/* webpackChunkName: "admin-reviews" */ './AdminReviews'));
const AdminCustomers = lazy(() => import(/* webpackChunkName: "admin-customers" */ './AdminCustomersReview'));
const AdminDailyTarget = lazy(() => import(/* webpackChunkName: "admin-target" */ './AdminDailyTarget'));
const AdminGallery = lazy(() => import(/* webpackChunkName: "admin-gallery" */ './AdminGallery'));
const AdminExpenses = lazy(() => import(/* webpackChunkName: "admin-expenses" */ './AdminExpenses'));
const AdminPopups = lazy(() => import(/* webpackChunkName: "admin-popups" */ './AdminPopups'));
const AdminProfitLoss = lazy(() => import(/* webpackChunkName: "admin-profitloss" */ './AdminProfitLoss'));
const AdminIncome = lazy(() => import(/* webpackChunkName: "admin-income" */ './AdminIncome'));
const AdminNote = lazy(() => import(/* webpackChunkName: "admin-note" */ './AdminNote'));
const AdminFacebookPixel = lazy(() => import(/* webpackChunkName: "admin-pixel" */ './AdminFacebookPixel'));
const AdminGTM = lazy(() => import(/* webpackChunkName: "admin-gtm" */ './AdminGTM'));
const AdminLandingPage = lazy(() => import(/* webpackChunkName: "admin-landing" */ './AdminLandingPage'));
const AdminTenantManagement = lazy(() => import(/* webpackChunkName: "admin-tenant" */ './AdminTenantManagement'));
const AdminDueList = lazy(() => import(/* webpackChunkName: "admin-duelist" */ './AdminDueList'));
const AdminSupport = lazy(() => import(/* webpackChunkName: "admin-support" */ './AdminSupport'));
const AdminFigmaIntegration = lazy(() => import(/* webpackChunkName: "admin-figma" */ './AdminFigmaIntegration'));
const AdminBilling = lazy(() => import(/* webpackChunkName: "admin-billing" */ './AdminBilling'));
const AdminTutorial = lazy(() => import(/* webpackChunkName: "admin-tutorial" */ './AdminTutorial'));
const AdminActivityLog = lazy(() => import(/* webpackChunkName: "admin-activity-log" */ './AdminActivityLog'));
const AdminProfile = lazy(() => import(/* webpackChunkName: "admin-profile" */ './AdminProfile'));
// Admin Components - directly imported for instant layout render
import { AdminSidebar, AdminHeader } from '../components/AdminComponents';

// Preload critical admin chunks on idle - only when admin view is triggered
let adminChunksPreloaded = false;
export const preloadAdminChunks = () => {
  if (adminChunksPreloaded) return;
  adminChunksPreloaded = true;
  // Preloading disabled to avoid long-pending chunk requests on initial load.
};

// Section-aware loading fallback for lazy-loaded sections
const PageLoadingFallback = ({ section }: { section?: string }) => {
  switch (section) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'orders':
      return <OrdersSkeleton />;
    case 'products':
      return <ProductsSkeleton />;
    case 'inventory':
      return <InventorySkeleton />;
    case 'customers_reviews':
      return <CustomersSkeleton />;
    case 'activity_log':
      return <ActivityLogSkeleton />;
    default:
      return <PageSkeleton />;
  }
};

// Permission map type
type PermissionMap = Record<string, string[]>;

interface AdminAppProps {
  user: User | null;
  userPermissions?: PermissionMap;
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
  // Tenant management props
  onCreateTenant: (payload: CreateTenantPayload, options?: { activate?: boolean }) => Promise<Tenant>;
  onDeleteTenant: (tenantId: string) => Promise<void>;
  onRefreshTenants: () => Promise<Tenant[]>;
  isTenantCreating: boolean;
  deletingTenantId: string | null;
  // Landing pages props
  landingPages: any[];
  onCreateLandingPage: (page: any) => void;
  onUpsertLandingPage: (page: any) => void;
  onToggleLandingPublish: (pageId: string, status: string) => void;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  onSwitchView: () => void;
  activePage: string;
  onNavigate: (page: string) => void;
  logo: string | null;
  user?: User | null;
  onLogout?: () => void;
  tenants?: Tenant[];
  activeTenantId?: string;
  onTenantChange?: (tenantId: string) => void;
  isTenantSwitching?: boolean;
  onOpenChatCenter?: () => void;
  hasUnreadChat?: boolean;
  userPermissions?: PermissionMap;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  onSwitchView, 
  activePage, 
  onNavigate,
  logo,
  user,
  onLogout,
  tenants,
  activeTenantId,
  onTenantChange,
  isTenantSwitching,
  onOpenChatCenter,
  hasUnreadChat,
  userPermissions = {}
}) => {
  const highlightPage = activePage.startsWith('settings') ? 'settings' : activePage;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-theme flex h-screen font-sans text-gray-900 bg-[#F8FAFC]">
      <AdminSidebar 
        activePage={highlightPage} 
        onNavigate={onNavigate} 
        logo={logo} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        userRole={user?.role}
        permissions={userPermissions}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F8FAFC]">
        <AdminHeader 
          onSwitchView={onSwitchView} 
          user={user} 
          onLogout={onLogout} 
          onNavigateToProfile={() => onNavigate('profile')}
          logo={logo}
          tenants={tenants}
          activeTenantId={activeTenantId}
          onTenantChange={onTenantChange}
          isTenantSwitching={isTenantSwitching}
          onOpenChatCenter={onOpenChatCenter}
          hasUnreadChat={hasUnreadChat}
          onMenuClick={() => setIsSidebarOpen(true)} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-0 md:p-0 bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
};

// Helper to check if user can access a page
const canAccessPage = (page: string, user?: User | null, permissions?: PermissionMap): boolean => {
  if (!user) return false;
  
  const role = user.role;
  
  // Super admin can access everything 
  if (role === 'super_admin') return true;
  
  // Admin can access everything except tenants
  if (role === 'admin' && page !== 'tenants') return true;
  
  // Tenant admin can access everything except tenants
  if (role === 'tenant_admin' && page !== 'tenants') return true;
  
  // Staff - check permissions
  if (role === 'staff') {
    // Dashboard is always accessible
    if (page === 'dashboard') return true;
    
    // Check permissions map
    if (permissions) {
      const pageResourceMap: Record<string, string> = {
        'orders': 'orders',
        'products': 'products',
        'landing_pages': 'landing_pages',
        'popups': 'landing_pages',
        'inventory': 'inventory',
        'customers': 'customers',
        'reviews': 'reviews',
        'daily_target': 'daily_target',
        'gallery': 'gallery',
        'catalog_categories': 'catalog',
        'catalog_subcategories': 'catalog',
        'catalog_childcategories': 'catalog',
        'catalog_brands': 'catalog',
        'catalog_tags': 'catalog',
        'business_report_expense': 'business_report',
        'business_report_income': 'business_report',
        'business_report_due_book': 'business_report',
        'business_report_profit_loss': 'business_report',
        'business_report_note': 'business_report',
        'due_list': 'due_book',
        'expenses': 'expenses',
        'settings': 'settings',
        'manage_shop': 'settings',
        'settings_delivery': 'settings',
        'settings_courier': 'settings',
        'settings_facebook_pixel': 'settings',
        'settings_gtm': 'settings',
        'admin': 'admin_control',
        'carousel': 'customization',
        'banner': 'customization',
        'popup': 'customization',
        'website_info': 'customization',
        'theme_view': 'customization',
        'theme_colors': 'customization',
        'tenants': 'tenants',
      };
      
      const resource = pageResourceMap[page];
      if (resource && permissions[resource]) {
        return permissions[resource].includes('read');
      }
    }
    
    return false;
  }
  
  return false;
};

const AdminApp: React.FC<AdminAppProps> = ({
  user,
  userPermissions = {},
  activeTenantId,
  tenants,
  orders,
  products,
  logo,
  themeConfig,
  websiteConfig,
  deliveryConfig,
  courierConfig,
  facebookPixelConfig,
  chatMessages,
  onLogout,
  onUpdateOrder,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onBulkUpdateProducts,
  onUpdateLogo,
  onUpdateTheme,
  onUpdateWebsiteConfig,
  onUpdateDeliveryConfig,
  onUpdateCourierConfig,
  onUpdateProfile,
  onTenantChange,
  isTenantSwitching,
  onSwitchToStore,
  onOpenAdminChat,
  hasUnreadChat,
  onCreateTenant,
  onDeleteTenant,
  onRefreshTenants,
  isTenantCreating,
  deletingTenantId,
  landingPages,
  onCreateLandingPage,
  onUpsertLandingPage,
  onToggleLandingPublish,
}) => {
  const [adminSection, setAdminSectionInternal] = useState('dashboard');
  
  // Wrapper that checks permission before navigating
  const setAdminSection = (page: string) => {
    if (canAccessPage(page, user, userPermissions)) {
      setAdminSectionInternal(page);
    } else {
      // Redirect to dashboard if no access
      toast.error('You do not have permission to access this page');
      setAdminSectionInternal('dashboard');
    }
  };
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hasLoadedAdminData, setHasLoadedAdminData] = useState(false);

  // Load admin-only data
  useEffect(() => {
    if (!activeTenantId || !user || hasLoadedAdminData) return;

    let isMounted = true;

    const fetchAdminData = async () => {
      try {
        const [
          usersData,
          rolesData,
          categoriesData,
          subCategoriesData,
          childCategoriesData,
          brandsData,
          tagsData,
        ] = await Promise.all([
          authService.getAdminUsers(),
          authService.getRoles(),
          DataService.getCatalog('categories', [], activeTenantId),
          DataService.getCatalog('subcategories', [], activeTenantId),
          DataService.getCatalog('childcategories', [], activeTenantId),
          DataService.getCatalog('brands', [], activeTenantId),
          DataService.getCatalog('tags', [], activeTenantId),
        ]);

        if (!isMounted) return;

        setUsers(usersData);
        setRoles(rolesData);
        setCategories(categoriesData);
        setSubCategories(subCategoriesData);
        setChildCategories(childCategoriesData);
        setBrands(brandsData);
        setTags(tagsData);
        setHasLoadedAdminData(true);
      } catch (error) {
        console.error('Failed to load admin data', error);
      }
    };

    fetchAdminData();
    return () => {
      isMounted = false;
    };
  }, [activeTenantId, user, hasLoadedAdminData]);

  const createCrudHandler = (setter: React.Dispatch<React.SetStateAction<any[]>>, storageKey: string) => ({
    add: (item: any) => {
      setter(prev => {
        const updated = [...prev, { ...item, tenantId: item?.tenantId || activeTenantId }];
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    },
    update: (item: any) => {
      setter(prev => {
        const updated = prev.map(i => i.id === item.id ? { ...item, tenantId: item?.tenantId || activeTenantId } : i);
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    },
    delete: (id: string) => {
      setter(prev => {
        const updated = prev.filter(i => i.id !== id);
        DataService.save(storageKey, updated, activeTenantId);
        return updated;
      });
    }
  });

  const catHandlers = createCrudHandler(setCategories, 'categories');
  const subCatHandlers = createCrudHandler(setSubCategories, 'subcategories');
  const childCatHandlers = createCrudHandler(setChildCategories, 'childcategories');
  const brandHandlers = createCrudHandler(setBrands, 'brands');
  const tagHandlers = createCrudHandler(setTags, 'tags');

  const platformOperator = user?.role === 'super_admin';
  const selectedTenantRecord = tenants.find(t => t.id === activeTenantId) || null;
  const headerTenants = platformOperator ? tenants : (selectedTenantRecord ? [selectedTenantRecord] : []);
  const tenantSwitcher = platformOperator ? onTenantChange : undefined;

  const handleAddRole = async (newRole: Omit<Role, '_id' | 'id'>) => {
    try {
      await authService.createRole({
        name: newRole.name,
        description: newRole.description || '',
        permissions: (newRole.permissions || []) as any,
        tenantId: newRole.tenantId || activeTenantId
      });
      // Refresh roles list from server
      const refreshedRoles = await authService.getRoles();
      setRoles(refreshedRoles as unknown as Role[]);
      toast.success('Role created successfully');
    } catch (error) {
      console.error('Failed to create role:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      await authService.updateRole(roleId, updates as any);
      // Refresh roles list from server to ensure consistency
      const refreshedRoles = await authService.getRoles();
      setRoles(refreshedRoles as unknown as Role[]);
      toast.success('Role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
      throw error;
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      await authService.deleteRole(roleId);
      // Refresh roles list from server to ensure consistency
      const refreshedRoles = await authService.getRoles();
      setRoles(refreshedRoles as unknown as Role[]);
      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete role');
      throw error;
    }
  };

  const handleUpdateUserRole = async (userEmail: string, roleId: string) => {
    try {
      await authService.updateUserRole(userEmail, roleId);
      // Refresh users list from server to ensure consistency
      const refreshedUsers = await authService.getAdminUsers();
      setUsers(refreshedUsers);
      toast.success('User role updated successfully');
    } catch (error) {
      console.error('Failed to update user role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user role');
    }
  };

  const handleAddUser = async (userData: Omit<User, '_id' | 'id'>) => {
    try {
      await authService.createUser({ ...userData, role: userData.role || 'staff' });
      // Refresh users list from server
      const refreshedUsers = await authService.getAdminUsers();
      setUsers(refreshedUsers);
      toast.success('User created successfully');
    } catch (error) {
      console.error('Failed to create user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await authService.updateUser(userId, updates);
      // Refresh users list from server to ensure consistency
      const refreshedUsers = await authService.getAdminUsers();
      setUsers(refreshedUsers);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUser(userId);
      // Refresh users list from server to ensure consistency
      const refreshedUsers = await authService.getAdminUsers();
      setUsers(refreshedUsers);
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
      throw error;
    }
  };

  const handlePreviewLandingPage = (page: any) => {
    // Open landing page in new tab using the URL slug
    const baseUrl = window.location.origin;
    const previewUrl = `${baseUrl}/${page.urlSlug}`;
    window.open(previewUrl, '_blank');
  };

  return (
    <AdminLayout
      onSwitchView={onSwitchToStore}
      activePage={adminSection}
      onNavigate={setAdminSection}
      logo={logo}
      user={user}
      onLogout={onLogout}
      tenants={headerTenants}
      activeTenantId={activeTenantId}
      onTenantChange={tenantSwitcher}
      isTenantSwitching={isTenantSwitching}
      onOpenChatCenter={onOpenAdminChat}
      hasUnreadChat={hasUnreadChat}
      userPermissions={userPermissions}
    >
      <Suspense fallback={<PageLoadingFallback section={adminSection} />}>
        {adminSection === 'dashboard' ? <AdminDashboard orders={orders} products={products} tenantId={activeTenantId} user={user} /> :
         adminSection === 'orders' ? <AdminOrders orders={orders} courierConfig={courierConfig} onUpdateOrder={onUpdateOrder} /> :
         adminSection === 'products' ? <AdminProducts products={products} categories={categories} subCategories={subCategories} childCategories={childCategories} brands={brands} tags={tags} onAddProduct={onAddProduct} onUpdateProduct={onUpdateProduct} onDeleteProduct={onDeleteProduct} onBulkDelete={onBulkDeleteProducts} onBulkUpdate={onBulkUpdateProducts} tenantId={activeTenantId} /> :
         adminSection === 'landing_pages' ? <AdminLandingPage products={products} landingPages={landingPages} onCreateLandingPage={onCreateLandingPage} onUpdateLandingPage={onUpsertLandingPage} onTogglePublish={onToggleLandingPublish} onPreviewLandingPage={handlePreviewLandingPage} /> :
         adminSection === 'due_list' ? <AdminDueList user={user} onLogout={onLogout} /> :
         adminSection === 'inventory' ? <AdminInventory products={products} tenantId={activeTenantId} /> :
         adminSection === 'expenses' ? <AdminExpenses /> :
         adminSection === 'popups' ? <AdminPopups onBack={() => setAdminSection('dashboard')} /> :
         adminSection === 'customers_reviews' ? <AdminCustomers orders={orders} products={products} /> :
         adminSection === 'daily_target' ? <AdminDailyTarget /> :
         adminSection === 'gallery' ? <AdminGallery /> :
         adminSection === 'figma' ? <AdminFigmaIntegration onBack={() => setAdminSection('gallery')} tenantId={activeTenantId} /> :
         adminSection === 'billing' ? <AdminBilling tenant={selectedTenantRecord} onUpgrade={() => setAdminSection('settings')} /> :
         adminSection === 'tutorial' ? <AdminTutorial /> :
         adminSection === 'activity_log' ? <AdminActivityLog tenantId={activeTenantId} /> :
         adminSection === 'profile' ? <AdminProfile user={user} onUpdateProfile={onUpdateProfile} activeTenant={selectedTenantRecord} /> :
         adminSection === 'manage_shop' ? <AdminManageShop onNavigate={setAdminSection} tenantId={activeTenantId} websiteConfig={websiteConfig} tenantSubdomain={selectedTenantRecord?.subdomain} /> :
         adminSection === 'settings' ? <AdminSettings courierConfig={courierConfig} onUpdateCourierConfig={onUpdateCourierConfig} onNavigate={setAdminSection} activeTenant={selectedTenantRecord} logo={logo} onUpdateLogo={onUpdateLogo} /> :
         adminSection === 'support' ? <AdminSupport user={user} activeTenant={selectedTenantRecord} /> :
         adminSection === 'settings_delivery' ? <AdminDeliverySettings configs={deliveryConfig} onSave={onUpdateDeliveryConfig} onBack={() => setAdminSection('settings')} /> :
         adminSection === 'settings_courier' ? <AdminCourierSettings config={courierConfig} onSave={onUpdateCourierConfig} onBack={() => setAdminSection('settings')} /> :
         adminSection === 'settings_facebook_pixel' ? <AdminFacebookPixel config={facebookPixelConfig} onSave={(cfg) => onUpdateCourierConfig(cfg)} onBack={() => setAdminSection('settings')} /> :
         adminSection === 'settings_gtm' ? <AdminGTM onBack={() => setAdminSection('settings')} tenantId={activeTenantId} /> :
         adminSection === 'admin' ? <AdminControlNew users={users} roles={roles} onAddUser={handleAddUser} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} onAddRole={handleAddRole} onUpdateRole={handleUpdateRole} onDeleteRole={handleDeleteRole} onUpdateUserRole={handleUpdateUserRole} currentUser={user} tenantId={activeTenantId} userPermissions={userPermissions} /> :
         adminSection.startsWith('catalog_') ? <AdminCatalog view={adminSection} onNavigate={setAdminSection} categories={categories} subCategories={subCategories} childCategories={childCategories} brands={brands} tags={tags} onAddCategory={catHandlers.add} onUpdateCategory={catHandlers.update} onDeleteCategory={catHandlers.delete} onAddSubCategory={subCatHandlers.add} onUpdateSubCategory={subCatHandlers.update} onDeleteSubCategory={subCatHandlers.delete} onAddChildCategory={childCatHandlers.add} onUpdateChildCategory={childCatHandlers.update} onDeleteChildCategory={childCatHandlers.delete} onAddBrand={brandHandlers.add} onUpdateBrand={brandHandlers.update} onDeleteBrand={brandHandlers.delete} onAddTag={tagHandlers.add} onUpdateTag={tagHandlers.update} onDeleteTag={tagHandlers.delete} /> :
         adminSection.startsWith('business_report_') ? <AdminBusinessReport initialTab={adminSection} orders={orders} products={products} user={user} onLogout={onLogout} tenantId={activeTenantId} /> :
         <AdminCustomization tenantId={activeTenantId} logo={logo} onUpdateLogo={onUpdateLogo} themeConfig={themeConfig} onUpdateTheme={onUpdateTheme} websiteConfig={websiteConfig} onUpdateWebsiteConfig={onUpdateWebsiteConfig} products={products} initialTab={adminSection === 'customization' ? 'website_info' : adminSection} />
        }
      </Suspense>
    </AdminLayout>
  );
};

export default AdminApp;