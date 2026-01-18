import React, { useState, useMemo } from 'react';
import { 
  Shield, Users, Edit, Trash2, Plus, Check, X, Search, 
  Eye, EyeOff, UserPlus, Mail, Phone, Lock, Save, Loader2, Key,
  MessageCircle, Star, UserCheck, Filter, Flag, CheckCircle, Send, Edit3,
  MoreVertical, ChevronLeft, ChevronRight
} from 'lucide-react';

// ==================== TYPES ====================
export type ResourceType = 
  | 'dashboard' | 'orders' | 'products' | 'customers' | 'inventory'
  | 'catalog' | 'landing_pages' | 'gallery' | 'reviews' | 'daily_target'
  | 'business_report' | 'expenses' | 'income' | 'due_book' | 'profit_loss'
  | 'notes' | 'customization' | 'settings' | 'admin_control' | 'tenants';

export type ActionType = 'read' | 'write' | 'edit' | 'delete';

export interface Permission {
  resource: ResourceType;
  actions: ActionType[];
}

export interface Role {
  _id?: string;
  id?: string;
  name: string;
  description: string;
  tenantId?: string;
  isSystem?: boolean;
  permissions: Permission[];
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: 'customer' | 'admin' | 'tenant_admin' | 'super_admin' | 'staff';
  roleId?: string;
  roleDetails?: Role;
  tenantId?: string;
  isActive?: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
}

// ==================== CONSTANTS ====================
const RESOURCES: { id: ResourceType; label: string; group: string }[] = [
  // General
  { id: 'dashboard', label: 'Dashboard', group: 'General' },
  // Sales
  { id: 'orders', label: 'Orders', group: 'Sales' },
  { id: 'products', label: 'Products', group: 'Sales' },
  { id: 'customers', label: 'Customers', group: 'Sales' },
  { id: 'inventory', label: 'Inventory', group: 'Sales' },
  // Content
  { id: 'catalog', label: 'Catalog', group: 'Content' },
  { id: 'landing_pages', label: 'Landing Pages', group: 'Content' },
  { id: 'gallery', label: 'Gallery', group: 'Content' },
  { id: 'reviews', label: 'Reviews', group: 'Content' },
  // Finance
  { id: 'expenses', label: 'Expenses', group: 'Finance' },
  { id: 'income', label: 'Income', group: 'Finance' },
  { id: 'due_book', label: 'Due Book', group: 'Finance' },
  { id: 'profit_loss', label: 'Profit/Loss', group: 'Finance' },
  { id: 'notes', label: 'Notes', group: 'Finance' },
  // Reports
  { id: 'business_report', label: 'Business Report', group: 'Reports' },
  // System
  { id: 'customization', label: 'Customization', group: 'System' },
  { id: 'settings', label: 'Settings', group: 'System' },
  { id: 'admin_control', label: 'Admin Control', group: 'System' },
  { id: 'tenants', label: 'Tenants', group: 'System' },
];

const ACTIONS: ActionType[] = ['read', 'write', 'edit', 'delete'];

// Permission map type
type PermissionMap = Record<string, string[]>;

// ==================== PROPS ====================
interface AdminControlProps {
  users: User[];
  roles: Role[];
  onAddUser?: (user: Omit<User, '_id' | 'id'>) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onAddRole: (role: Omit<Role, '_id' | 'id'>) => Promise<void>;
  onUpdateRole: (roleId: string, updates: Partial<Role>) => Promise<void>;
  onDeleteRole: (roleId: string) => Promise<void>;
  onUpdateUserRole: (userEmail: string, roleId: string) => Promise<void>;
  currentUser?: User | null;
  tenantId?: string;
  userPermissions?: PermissionMap;
}

// ==================== COMPONENT ====================
const AdminControl: React.FC<AdminControlProps> = ({
  users, roles = [], onAddUser, onUpdateUser, onDeleteUser,
  onAddRole, onUpdateRole, onDeleteRole, onUpdateUserRole,
  currentUser, tenantId, userPermissions = {}
}) => {
  const [tab, setTab] = useState<'users' | 'roles' | 'reviews' | 'customers'>('users');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pagination and filter state for Users
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [userItemsPerPage, setUserItemsPerPage] = useState(10);
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [userActionMenu, setUserActionMenu] = useState<string | null>(null);
  
  // Permission check helpers
  const hasAdminControlPermission = (action: ActionType): boolean => {
    // Super admin has full access to admin_control
    if (currentUser?.role === 'super_admin') return true;
    // Admin and tenant_admin have access to admin_control (tenants resource is restricted elsewhere)
    if (currentUser?.role === 'admin') return true;
    if (currentUser?.role === 'tenant_admin') return true;
    // Staff - check specific permissions from custom role
    if (userPermissions['admin_control']) {
      return userPermissions['admin_control'].includes(action);
    }
    return false;
  };
  
  // Check if current user can modify user roles
  const canModifyUsers = hasAdminControlPermission('write') || hasAdminControlPermission('edit');
  const canDeleteUsers = hasAdminControlPermission('delete');
  const canModifyRoles = hasAdminControlPermission('write') || hasAdminControlPermission('edit');
  const canDeleteRoles = hasAdminControlPermission('delete');
  
  // Check if current user can change a target user's role (hierarchical check)
  const canChangeUserRole = (targetUser: User): boolean => {
    if (!canModifyUsers) return false;
    
    // Super admin can change anyone's role
    if (currentUser?.role === 'super_admin') return true;
    
    // Users cannot change their own base role
    if (targetUser.email === currentUser?.email) return false;
    
    // Admin can only change staff roles
    if (currentUser?.role === 'admin') {
      return targetUser.role === 'staff';
    }
    
    // Tenant admin can only change staff roles within their tenant
    if (currentUser?.role === 'tenant_admin') {
      return targetUser.role === 'staff';
    }
    
    // Staff with permissions can only change other staff roles
    if (currentUser?.role === 'staff') {
      return targetUser.role === 'staff' && targetUser.email !== currentUser?.email;
    }
    
    return false;
  };
  
  // Check if current user can delete a specific user (combines permission and hierarchy checks)
  const canDeleteSpecificUser = (targetUser: User): boolean => {
    // Cannot delete yourself
    if (targetUser.email === currentUser?.email) return false;
    // Must have delete permission
    if (!canDeleteUsers) return false;
    // Must have hierarchical authority to modify this user
    return canChangeUserRole(targetUser);
  };
  
  // User Modal
  const [userModal, setUserModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', phone: '', role: 'staff' as User['role'], roleId: '', isActive: true });
  
  // Role Modal
  const [roleModal, setRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as Permission[] });

  // Reviews state
  type ReviewStatus = 'published' | 'pending' | 'flagged';
  type ReviewItem = {
    id: string;
    customer: string;
    avatar: string;
    rating: number;
    headline: string;
    message: string;
    product: string;
    date: string;
    status: ReviewStatus;
    reply?: string;
  };
  
  const SAMPLE_REVIEWS: ReviewItem[] = [
    {
      id: 'R-98211',
      customer: 'Anika Rahman',
      avatar: 'https://i.pravatar.cc/120?img=32',
      rating: 5,
      headline: 'Lightning fast delivery',
      message: 'Ordered at night and had the phone within 36 hours. Packaging was premium and seal was intact.',
      product: 'iPhone 14 Pro Max 1TB',
      date: 'Dec 01, 2025',
      status: 'published',
      reply: 'Thanks Anika! Glad the express courier met expectations.',
    },
    {
      id: 'R-98202',
      customer: 'Fahim Reza',
      avatar: 'https://i.pravatar.cc/120?img=15',
      rating: 3,
      headline: 'Good product, slow courier',
      message: 'Gadget works perfectly but delivery partner rescheduled twice. Please fix courier coordination.',
      product: 'Logitech G Pro X Headset',
      date: 'Nov 29, 2025',
      status: 'pending',
    },
    {
      id: 'R-98144',
      customer: 'Sadia Tanjin',
      avatar: 'https://i.pravatar.cc/120?img=8',
      rating: 2,
      headline: 'Box slightly damaged',
      message: 'Device ok but retail box arrived dented. Need better bubble-wrap next time.',
      product: 'Xiaomi Smart Air Purifier 4',
      date: 'Nov 25, 2025',
      status: 'flagged',
    },
  ];
  
  const [reviews, setReviews] = useState<ReviewItem[]>(SAMPLE_REVIEWS);
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewStatus>('all');
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(SAMPLE_REVIEWS[0]?.id || null);
  const [replyDraft, setReplyDraft] = useState('');

  // Filtered users (exclude customers)
  const filteredUsers = useMemo(() => 
    users.filter(u => u.role !== 'customer' && 
      (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) &&
      (userStatusFilter === 'all' || (userStatusFilter === 'active' ? u.isActive !== false : u.isActive === false))
    ), [users, search, userStatusFilter]);

  // User pagination calculations
  const userTotalPages = Math.ceil(filteredUsers.length / userItemsPerPage);
  const paginatedUsers = useMemo(() => 
    filteredUsers.slice((userCurrentPage - 1) * userItemsPerPage, userCurrentPage * userItemsPerPage)
  , [filteredUsers, userCurrentPage, userItemsPerPage]);

  // Filtered customers (only customers)
  const filteredCustomers = useMemo(() => 
    users.filter(u => u.role === 'customer' && 
      (u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    ), [users, search]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesFilter = reviewFilter === 'all' || review.status === reviewFilter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        review.customer.toLowerCase().includes(query) ||
        review.product.toLowerCase().includes(query) ||
        review.message.toLowerCase().includes(query)
      );
    });
  }, [reviews, search, reviewFilter]);

  const selectedReview = reviews.find((review) => review.id === selectedReviewId) || filteredReviews[0] || null;

  // Review stats
  const reviewStats = useMemo(() => {
    const published = reviews.filter((r) => r.status === 'published').length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const flagged = reviews.filter((r) => r.status === 'flagged').length;
    const avgRating = reviews.length
      ? (reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length).toFixed(1)
      : '0.0';
    return { published, pending, flagged, avgRating };
  }, [reviews]);

  // Review handlers
  const handleStatusChange = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, status } : review)));
  };

  const handleSaveReply = () => {
    if (!selectedReview) return;
    const trimmed = replyDraft.trim();
    if (!trimmed) return;
    setReviews((prev) => prev.map((review) => (review.id === selectedReview.id ? { ...review, reply: trimmed, status: 'published' } : review)));
    setReplyDraft('');
  };

  // Group resources by category
  const groupedResources = useMemo(() => 
    RESOURCES.reduce((acc, r) => ({ ...acc, [r.group]: [...(acc[r.group] || []), r] }), {} as Record<string, { id: ResourceType; label: string; group: string }[]>)
  , []);

  // ========== USER FUNCTIONS ==========
  const openUserModal = (user?: User) => {
    if (user) {
      setEditUser(user);
      setUserForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role, roleId: user.roleId || '', isActive: user.isActive !== false });
    } else {
      setEditUser(null);
      setUserForm({ name: '', email: '', password: '', phone: '', role: 'staff', roleId: '', isActive: true });
    }
    setShowPwd(false);
    setUserModal(true);
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return alert('Name and Email required');
    if (!editUser && !userForm.password) return alert('Password required');
    
    setLoading(true);
    try {
      const data = { ...userForm, roleId: userForm.roleId || undefined };
      if (editUser) {
        await onUpdateUser?.(editUser._id || editUser.id || '', data);
      } else {
        await onAddUser?.({ ...data, tenantId } as Omit<User, '_id' | 'id'>);
      }
      setUserModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (user: User) => {
    if (user.email === currentUser?.email) return alert("Can't delete yourself");
    if (!confirm(`Delete "${user.name}"?`)) return;
    
    setLoading(true);
    try {
      await onDeleteUser?.(user._id || user.id || '');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  // ========== ROLE FUNCTIONS ==========
  const openRoleModal = (role?: Role) => {
    if (role) {
      setEditRole(role);
      setRoleForm({ name: role.name, description: role.description, permissions: role.permissions || [] });
    } else {
      setEditRole(null);
      setRoleForm({ name: '', description: '', permissions: [] });
    }
    setRoleModal(true);
  };

  const togglePerm = (resource: ResourceType, action: ActionType) => {
    const perms = [...roleForm.permissions];
    const idx = perms.findIndex(p => p.resource === resource);
    
    if (idx >= 0) {
      const actions = perms[idx].actions;
      if (actions.includes(action)) {
        const newActions = actions.filter(a => a !== action);
        if (newActions.length === 0) perms.splice(idx, 1);
        else perms[idx] = { resource, actions: newActions };
      } else {
        perms[idx] = { resource, actions: [...actions, action] };
      }
    } else {
      perms.push({ resource, actions: [action] });
    }
    setRoleForm({ ...roleForm, permissions: perms });
  };

  const toggleAllPerms = (resource: ResourceType) => {
    const perms = [...roleForm.permissions];
    const idx = perms.findIndex(p => p.resource === resource);
    
    if (idx >= 0 && perms[idx].actions.length === 4) {
      perms.splice(idx, 1);
    } else if (idx >= 0) {
      perms[idx] = { resource, actions: [...ACTIONS] };
    } else {
      perms.push({ resource, actions: [...ACTIONS] });
    }
    setRoleForm({ ...roleForm, permissions: perms });
  };

  const hasPerm = (resource: ResourceType, action: ActionType) => 
    roleForm.permissions.find(p => p.resource === resource)?.actions.includes(action) ?? false;

  const saveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name) return alert('Role name required');
    
    setLoading(true);
    try {
      if (editRole) {
        await onUpdateRole(editRole._id || editRole.id || '', roleForm);
      } else {
        await onAddRole({ ...roleForm, tenantId } as Omit<Role, '_id' | 'id'>);
      }
      setRoleModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to save role');
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (role: Role) => {
    if (role.isSystem) return alert('Cannot delete system roles');
    const assigned = users.filter(u => u.roleId === (role._id || role.id)).length;
    if (assigned > 0) return alert(`Role assigned to ${assigned} user(s). Reassign first.`);
    if (!confirm(`Delete "${role.name}"?`)) return;
    
    setLoading(true);
    try {
      await onDeleteRole(role._id || role.id || '');
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  // ========== HELPERS ==========
  const getRoleLabel = (r?: User['role']) => ({ super_admin: 'Super Admin', tenant_admin: 'Tenant Admin', admin: 'Admin', staff: 'Staff' }[r || ''] || r || 'Unknown');
  const getRoleColor = (r?: User['role']) => ({ super_admin: 'text-purple-300 bg-purple-500/20', tenant_admin: 'text-blue-300 bg-blue-500/20', admin: 'text-emerald-300 bg-emerald-500/20', staff: 'text-amber-300 bg-amber-500/20' }[r || ''] || 'text-slate-300 bg-white/10');

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-emerald-400 w-5 h-5 sm:w-6 sm:h-6" /> Admin Control
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage users, roles & permissions</p>
        </div>
        
        {/* Show Create Role button only for roles tab (users tab has its own Add button) */}
        {tab === 'roles' && canModifyRoles && (
          <button 
            onClick={() => openRoleModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-xl font-medium transition hover:from-[#2BAEE8] hover:to-[#1A7FE8] min-h-[44px] text-sm sm:text-base"
          >
            <Plus size={18} /> Create Role
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit min-w-min">
          <button onClick={() => setTab('users')} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] ${tab === 'users' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Users size={16} className="flex-shrink-0" /> <span className="hidden xs:inline">Users</span>
          </button>
          <button onClick={() => setTab('roles')} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] ${tab === 'roles' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <Key size={16} className="flex-shrink-0" /> <span className="hidden xs:inline">Roles</span>
          </button>
          <button onClick={() => setTab('reviews')} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] ${tab === 'reviews' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <MessageCircle size={16} className="flex-shrink-0" /> <span className="hidden xs:inline">Reviews</span>
          </button>
          <button onClick={() => setTab('customers')} className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap min-h-[44px] ${tab === 'customers' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}>
            <UserCheck size={16} className="flex-shrink-0" /> <span className="hidden xs:inline">Customers</span>
          </button>
        </div>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* Header with Search, Filters, and Add Button */}
          <div className="flex flex-col gap-3 bg-white rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Category" 
                  value={search} 
                  onChange={e => { setSearch(e.target.value); setUserCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[44px]"
                />
              </div>
              <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition min-h-[44px]">
                Search
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value as any); setUserCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-h-[44px]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={userItemsPerPage}
                onChange={(e) => { setUserItemsPerPage(Number(e.target.value)); setUserCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-500 bg-white text-gray-700 min-h-[44px]"
              >
                <option value={10}>10 Admin</option>
                <option value={25}>25 Admin</option>
                <option value={50}>50 Admin</option>
                <option value={100}>100 Admin</option>
              </select>
              {canModifyUsers && (
                <button 
                  onClick={() => openUserModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg font-medium transition hover:from-[#2BAEE8] hover:to-[#1A7FE8] min-h-[44px] text-sm sm:text-base sm:flex-1 md:flex-initial"
                >
                  <Plus size={18} /> Add Admin
                </button>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#E0F7FA] text-gray-700 font-semibold text-xs uppercase border-b">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 w-10 hidden sm:table-cell">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-3 sm:px-4 py-3 hidden md:table-cell">SL</th>
                    <th className="px-3 sm:px-4 py-3 hidden sm:table-cell">Picture</th>
                    <th className="px-3 sm:px-4 py-3">Name</th>
                    <th className="px-3 sm:px-4 py-3 hidden lg:table-cell">Username</th>
                    <th className="px-3 sm:px-4 py-3">Role</th>
                    <th className="px-3 sm:px-4 py-3 hidden xl:table-cell">Last Login</th>
                    <th className="px-3 sm:px-4 py-3 hidden xl:table-cell">Registration At</th>
                    <th className="px-3 sm:px-4 py-3">Status</th>
                    <th className="px-3 sm:px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedUsers.map((user, index) => {
                    const rowNumber = (userCurrentPage - 1) * userItemsPerPage + index + 1;
                    const userId = user._id || user.id || user.email;
                    return (
                      <tr key={userId} className="hover:bg-gray-50 group">
                        <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-3 sm:px-4 py-3 font-medium text-gray-800 hidden md:table-cell">{rowNumber}</td>
                        <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-gray-500 font-bold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 font-medium text-gray-800">{user.name}</td>
                        <td className="px-3 sm:px-4 py-3 text-gray-600 hidden lg:table-cell">{user.email?.split('@')[0] || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 text-gray-600">
                          <span className="text-xs sm:text-sm">{getRoleLabel(user.role)}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-gray-500 hidden xl:table-cell">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="px-3 sm:px-4 py-3 text-gray-500 hidden xl:table-cell">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-bold ${user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {user.isActive !== false ? 'Publish' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right relative">
                          <button
                            onClick={() => setUserActionMenu(userActionMenu === userId ? null : userId)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <MoreVertical size={18} />
                          </button>
                          {userActionMenu === userId && (
                            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 min-w-[140px]">
                              {onUpdateUser && canChangeUserRole(user) && (
                                <button
                                  onClick={() => { openUserModal(user); setUserActionMenu(null); }}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-blue-600 min-h-[44px]"
                                >
                                  <Edit size={14} /> Edit
                                </button>
                              )}
                              {onDeleteUser && canDeleteSpecificUser(user) && (
                                <button
                                  onClick={() => { deleteUser(user); setUserActionMenu(null); }}
                                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 min-h-[44px]"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-4 py-3 border-t bg-gray-50 gap-3">
                <button
                  onClick={() => setUserCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={userCurrentPage === 1}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 min-h-[44px]"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                <div className="flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: Math.min(5, userTotalPages) }, (_, i) => {
                    let pageNum;
                    if (userTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (userCurrentPage <= 3) {
                      pageNum = i + 1;
                    } else if (userCurrentPage >= userTotalPages - 2) {
                      pageNum = userTotalPages - 4 + i;
                    } else {
                      pageNum = userCurrentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setUserCurrentPage(pageNum)}
                        className={`min-w-[44px] min-h-[44px] text-sm font-medium rounded-lg transition ${userCurrentPage === pageNum
                          ? 'bg-teal-500 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {userTotalPages > 5 && userCurrentPage < userTotalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-400">.....</span>
                      <button
                        onClick={() => setUserCurrentPage(userTotalPages)}
                        className="min-w-[44px] min-h-[44px] text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        {userTotalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setUserCurrentPage(prev => Math.min(userTotalPages, prev + 1))}
                  disabled={userCurrentPage === userTotalPages || userTotalPages === 0}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 min-h-[44px]"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {tab === 'roles' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.filter(r => r._id || r.id).map(role => {
            const id = role._id || role.id;
            const userCount = users.filter(u => u.roleId === id).length;
            const permCount = role.permissions?.reduce((a, p) => a + (p.actions?.length || 0), 0) || 0;
            
            return (
              <div key={id} className="bg-white/5 rounded-xl border border-white/10 p-4 sm:p-5 hover:border-emerald-500/30 transition group">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 text-sm sm:text-base">
                      <Key size={16} className="text-emerald-400 flex-shrink-0" />
                      {role.name}
                    </h3>
                    {role.isSystem && <span className="text-xs text-amber-400">System</span>}
                  </div>
                  {!role.isSystem && canModifyRoles && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={() => openRoleModal(role)} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center"><Edit size={14} /></button>
                      {canDeleteRoles && (
                        <button onClick={() => deleteRole(role)} className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"><Trash2 size={14} /></button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-xs sm:text-sm mb-4 line-clamp-2">{role.description || 'No description'}</p>
                <div className="flex gap-4 text-xs text-slate-500 pt-3 border-t border-white/10">
                  <span className="flex items-center gap-1"><Users size={12} />{userCount} users</span>
                  <span className="flex items-center gap-1"><Shield size={12} />{permCount} perms</span>
                </div>
              </div>
            );
          })}
          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500">No roles yet</div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div className="space-y-4 md:space-y-6">
          {/* Review Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
              <p className="text-xs uppercase text-slate-500">Published</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">{reviewStats.published}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
              <p className="text-xs uppercase text-slate-500">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-400">{reviewStats.pending}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
              <p className="text-xs uppercase text-slate-500">Flagged</p>
              <p className="text-xl sm:text-2xl font-bold text-red-400">{reviewStats.flagged}</p>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-3 sm:p-4">
              <p className="text-xs uppercase text-slate-500">Avg Rating</p>
              <div className="flex items-center gap-2">
                <p className="text-xl sm:text-2xl font-bold text-white">{reviewStats.avgRating}</p>
                <Star className="text-yellow-400 fill-yellow-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'published', 'pending', 'flagged'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setReviewFilter(item)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs font-medium transition min-h-[44px] ${
                  reviewFilter === item 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            {/* Reviews List */}
            <div className="xl:col-span-2 bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left">Customer</th>
                      <th className="px-3 sm:px-4 py-3 text-left hidden sm:table-cell">Product</th>
                      <th className="px-3 sm:px-4 py-3 text-left">Rating</th>
                      <th className="px-3 sm:px-4 py-3 text-left">Status</th>
                      <th className="px-3 sm:px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredReviews.map((review) => (
                      <tr 
                        key={review.id} 
                        className={`hover:bg-white/5 cursor-pointer ${selectedReview?.id === review.id ? 'bg-emerald-500/10' : ''}`}
                        onClick={() => { setSelectedReviewId(review.id); setReplyDraft(review.reply || ''); }}
                      >
                        <td className="px-3 sm:px-4 py-3">
                          <div className="font-medium text-white text-xs sm:text-sm">{review.customer}</div>
                          <div className="text-slate-500 text-xs">{review.date}</div>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm hidden sm:table-cell">{review.product}</td>
                        <td className="px-3 sm:px-4 py-3">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className={s <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
                            ))}
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            review.status === 'published' ? 'text-emerald-300 bg-emerald-500/20' :
                            review.status === 'pending' ? 'text-amber-300 bg-amber-500/20' :
                            'text-red-300 bg-red-500/20'
                          }`}>
                            {review.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(review.id, 'published'); }}
                              className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-emerald-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Publish"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStatusChange(review.id, 'flagged'); }}
                              className="p-2 hover:bg-white/10 rounded text-slate-400 hover:text-red-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Flag"
                            >
                              <Flag size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredReviews.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No reviews found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Selected Review Detail */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 sm:p-5">
              {selectedReview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={selectedReview.avatar} alt={selectedReview.customer} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover" />
                    <div>
                      <p className="font-semibold text-white text-sm sm:text-base">{selectedReview.customer}</p>
                      <p className="text-xs text-slate-500">{selectedReview.product}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm sm:text-base">{selectedReview.headline}</h4>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">{selectedReview.message}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 mb-1">Rating</p>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={16} className={s <= selectedReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-slate-500">Reply</p>
                    <textarea
                      className="w-full bg-white/5 border border-white/10 rounded-lg text-sm text-white p-3 h-24 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Write a reply..."
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleSaveReply}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition min-h-[44px]"
                      >
                        <Send size={14} /> Send Reply
                      </button>
                      <button
                        onClick={() => selectedReview && handleStatusChange(selectedReview.id, 'pending')}
                        className="px-4 py-2.5 text-xs font-medium rounded-lg border border-white/20 text-slate-400 hover:text-white min-h-[44px]"
                      >
                        Mark Pending
                      </button>
                    </div>
                    {selectedReview.reply && !replyDraft && (
                      <div className="p-3 text-xs rounded-lg bg-white/5 border border-white/10 text-slate-400 flex items-start gap-2">
                        <Edit3 size={12} className="mt-0.5 text-emerald-400 flex-shrink-0" />
                        <span>{selectedReview.reply}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-10">Select a review to manage</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customers Tab */}
      {tab === 'customers' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          {/* Search */}
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="relative max-w-full sm:max-w-sm">
              <Search size={16} className="absolute left-3 top-3 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search customers..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]"
              />
            </div>
          </div>
          
          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left">Customer</th>
                  <th className="px-3 sm:px-4 py-3 text-left">Email</th>
                  <th className="px-3 sm:px-4 py-3 text-left hidden sm:table-cell">Phone</th>
                  <th className="px-3 sm:px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.map(customer => (
                  <tr key={customer._id || customer.id || customer.email} className="hover:bg-white/5">
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs sm:text-sm flex-shrink-0">
                          {customer.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="font-medium text-white text-xs sm:text-sm">{customer.name || 'Unknown'}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm">{customer.email}</td>
                    <td className="px-3 sm:px-4 py-3 text-slate-400 text-xs sm:text-sm hidden sm:table-cell">{customer.phone || '-'}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${customer.isActive !== false ? 'text-emerald-300 bg-emerald-500/20' : 'text-red-300 bg-red-500/20'}`}>
                        {customer.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] border border-white/10 flex flex-col">
            <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <UserPlus className="text-emerald-400 w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {editUser ? 'Edit User' : 'Add User'}
              </h3>
              <button onClick={() => setUserModal(false)} className="text-slate-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={18} /></button>
            </div>
            
            <form id="userForm" onSubmit={saveUser} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="text-sm text-slate-400 block mb-1">Name *</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]" placeholder="John Doe" />
              </div>
              
              <div>
                <label className="text-sm text-slate-400 block mb-1">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type="email" required disabled={!!editUser} value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 min-h-[44px]" placeholder="john@example.com" />
                </div>
              </div>
              
              {!editUser && (
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Password *</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                    <input type={showPwd ? 'text' : 'password'} required minLength={6} value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                      className="w-full pl-9 pr-11 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]" placeholder="Min 6 chars" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-1 top-1 text-slate-500 hover:text-white w-10 h-10 flex items-center justify-center rounded">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <label className="text-sm text-slate-400 block mb-1">Phone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-3.5 text-slate-500" />
                  <input type="tel" value={userForm.phone} onChange={e => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]" placeholder="+880 1XXX" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Role</label>
                  <select 
                    value={userForm.role} 
                    onChange={e => setUserForm({...userForm, role: e.target.value as User['role']})}
                    disabled={currentUser?.role === 'staff' || currentUser?.role === 'tenant_admin'}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]">
                    <option value="staff" className="bg-slate-900">Staff</option>
                    {currentUser?.role === 'super_admin' && <>
                      <option value="admin" className="bg-slate-900">Admin</option>
                      <option value="tenant_admin" className="bg-slate-900">Tenant Admin</option>
                      <option value="super_admin" className="bg-slate-900">Super Admin</option>
                    </>}
                  </select>
                  {(currentUser?.role === 'staff' || currentUser?.role === 'tenant_admin') && (
                    <p className="text-xs text-slate-500 mt-1">Only super admin can change base role</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Custom Role</label>
                  <select value={userForm.roleId} onChange={e => setUserForm({...userForm, roleId: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]">
                    <option value="" className="bg-slate-900">None</option>
                    {roles.filter(r => r._id || r.id).map(r => (
                      <option key={r._id || r.id} value={r._id || r.id} className="bg-slate-900">{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {editUser && (
                <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer min-h-[44px]">
                  <input type="checkbox" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})}
                    className="w-5 h-5 rounded bg-white/10 border-white/20 text-emerald-500" />
                  Active (can login)
                </label>
              )}
            </form>
            
            <div className="flex gap-3 p-4 sm:p-5 border-t border-white/10 flex-shrink-0">
              <button type="button" onClick={() => setUserModal(false)} className="flex-1 py-2.5 border border-white/20 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 min-h-[44px]">Cancel</button>
              <button type="submit" form="userForm" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editUser ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {roleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-slate-900 rounded-2xl w-full max-w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-white/10 mx-3 sm:mx-0">
            <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Key className="text-emerald-400 w-[18px] h-[18px] sm:w-5 sm:h-5" />
                {editRole ? 'Edit Role' : 'Create Role'}
              </h3>
              <button onClick={() => setRoleModal(false)} className="text-slate-400 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"><X size={18} /></button>
            </div>
            
            <form id="roleForm" onSubmit={saveRole} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Name *</label>
                  <input type="text" required value={roleForm.name} onChange={e => setRoleForm({...roleForm, name: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]" placeholder="Order Manager" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Description</label>
                  <input type="text" value={roleForm.description} onChange={e => setRoleForm({...roleForm, description: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 min-h-[44px]" placeholder="Brief description..." />
                </div>
              </div>
              
              {/* Permissions */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <label className="text-sm text-slate-400">Permissions</label>
                  <div className="flex gap-2 text-xs text-slate-500">
                    {ACTIONS.map(a => <span key={a} className="px-2 py-1 bg-white/5 rounded">{a[0].toUpperCase()}</span>)}
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-xl border border-white/10 divide-y divide-white/10">
                  {Object.entries(groupedResources).map(([group, resources]: [string, { id: ResourceType; label: string; group: string }[]]) => (
                    <div key={group}>
                      <div className="px-3 sm:px-4 py-2 bg-white/5 text-xs font-semibold text-emerald-400 uppercase">{group}</div>
                      <div className="divide-y divide-white/5">
                        {resources.map(r => {
                          const perm = roleForm.permissions.find(p => p.resource === r.id);
                          const count = perm?.actions.length || 0;
                          return (
                            <div key={r.id} className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 hover:bg-white/5">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <button type="button" onClick={() => toggleAllPerms(r.id)}
                                  className={`w-6 h-6 sm:w-6 sm:h-6 rounded flex items-center justify-center text-xs border transition flex-shrink-0 ${count === 4 ? 'bg-emerald-500 border-emerald-500 text-white' : count > 0 ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/20 text-slate-500'}`}>
                                  {count === 4 ? <Check size={12} /> : count > 0 ? count : ''}
                                </button>
                                <span className="text-xs sm:text-sm text-white truncate">{r.label}</span>
                              </div>
                              <div className="flex gap-1 sm:gap-1 w-full sm:w-auto justify-start sm:justify-end">
                                {ACTIONS.map(a => (
                                  <button key={a} type="button" onClick={() => togglePerm(r.id, a)}
                                    className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded text-xs font-medium transition flex items-center justify-center ${
                                      hasPerm(r.id, a)
                                        ? a === 'read' ? 'bg-emerald-500/30 text-emerald-300' : a === 'write' ? 'bg-blue-500/30 text-blue-300' : a === 'edit' ? 'bg-amber-500/30 text-amber-300' : 'bg-red-500/30 text-red-300'
                                        : 'bg-white/5 text-slate-500 hover:bg-white/10'
                                    }`}>
                                    {a[0].toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
            
            <div className="p-4 sm:p-5 border-t border-white/10 flex gap-3 flex-shrink-0">
              <button type="button" onClick={() => setRoleModal(false)} className="flex-1 py-2.5 border border-white/20 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 min-h-[44px]">Cancel</button>
              <button type="submit" form="roleForm" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminControl;
