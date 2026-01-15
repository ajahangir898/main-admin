import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, Plus, Trash2, ExternalLink, RefreshCw, CheckCircle2, 
  AlertCircle, Mail, User, Globe, Shield, Sparkles, Loader2, 
  Eye, EyeOff, Copy, Check, X, Store, UserCheck, UserX, Ban, 
  PlayCircle, LogIn, Settings
} from 'lucide-react';
import { CreateTenantPayload, Tenant } from '../types';

// Reserved subdomains that cannot be used for tenants
const RESERVED_TENANT_SLUGS = [
  'www', 'admin', 'adminlogin', 'superadmin', 'login', 'app',
  'api', 'dashboard', 'tenant', 'support', 'cdn', 'static'
];

interface AdminTenantManagementProps {
  tenants: Tenant[];
  onCreateTenant: (payload: CreateTenantPayload, options?: { activate?: boolean }) => Promise<Tenant>;
  onDeleteTenant?: (tenantId: string) => Promise<void>;
  onRefreshTenants?: () => Promise<Tenant[] | void>;
  onUpdateTenantStatus?: (tenantId: string, status: Tenant['status'], reason?: string) => Promise<void>;
  onLoginAsMerchant?: (tenantId: string) => Promise<void>;
  onUpdateDomain?: (tenantId: string, domain: string, type: 'subdomain' | 'custom') => Promise<void>;
  isCreating?: boolean;
  deletingTenantId?: string | null;
}

type FormErrors = {
  name?: string;
  subdomain?: string;
  contactEmail?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminPasswordConfirm?: string;
};

const PLAN_OPTIONS = [
  { value: 'starter', label: 'Starter', description: 'For small stores' },
  { value: 'growth', label: 'Growth', description: 'For growing businesses' },
  { value: 'enterprise', label: 'Enterprise', description: 'For large operations' },
] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  trialing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  suspended: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
};

const sanitizeSubdomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const getPrimaryDomain = () => {
  const envDomain = import.meta.env.VITE_PRIMARY_DOMAIN;
  if (envDomain) {
    return envDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const parts = host.split('.');
    return parts.length > 2 ? parts.slice(1).join('.') : host;
  }
  return 'systemnextit.com';
};

const AdminTenantManagement: React.FC<AdminTenantManagementProps> = ({
  tenants,
  onCreateTenant,
  onDeleteTenant,
  onRefreshTenants,
  onUpdateTenantStatus,
  onLoginAsMerchant,
  onUpdateDomain,
  isCreating = false,
  deletingTenantId,
}) => {
  // Form state
  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    contactEmail: '',
    contactName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    plan: 'starter' as CreateTenantPayload['plan'],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [subdomainManuallyEdited, setSubdomainManuallyEdited] = useState(false);
  
  // UI state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<Tenant | null>(null);
  const [statusModal, setStatusModal] = useState<{ tenant: Tenant; action: 'approve' | 'reject' | 'suspend' | 'activate' } | null>(null);
  const [domainModal, setDomainModal] = useState<Tenant | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Tenant['status'] | 'all'>('all');
  const [actioningTenantId, setActioningTenantId] = useState<string | null>(null);

  const primaryDomain = getPrimaryDomain();
  const protocol = primaryDomain.includes('localhost') ? 'http' : 'https';

  // Auto-generate subdomain from name
  useEffect(() => {
    if (!subdomainManuallyEdited && form.name) {
      const generated = sanitizeSubdomain(form.name.replace(/\s+/g, '-'));
      setForm(prev => ({ ...prev, subdomain: generated }));
    }
  }, [form.name, subdomainManuallyEdited]);

  // Clear notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Validation
  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Store name is required';
    }

    if (!form.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (RESERVED_TENANT_SLUGS.includes(form.subdomain.toLowerCase())) {
      newErrors.subdomain = 'This subdomain is reserved';
    } else if (tenants.some(t => t.subdomain?.toLowerCase() === form.subdomain.toLowerCase())) {
      newErrors.subdomain = 'Subdomain already exists';
    } else if (form.subdomain.length < 3) {
      newErrors.subdomain = 'Subdomain must be at least 3 characters';
    }

    if (!form.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!isValidEmail(form.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    if (!form.adminEmail.trim()) {
      newErrors.adminEmail = 'Admin email is required';
    } else if (!isValidEmail(form.adminEmail)) {
      newErrors.adminEmail = 'Invalid email format';
    }

    if (!form.adminPassword.trim()) {
      newErrors.adminPassword = 'Password is required';
    } else if (form.adminPassword.length < 6) {
      newErrors.adminPassword = 'Password must be at least 6 characters';
    }

    if (!form.adminPasswordConfirm.trim()) {
      newErrors.adminPasswordConfirm = 'Please confirm password';
    } else if (form.adminPassword !== form.adminPasswordConfirm) {
      newErrors.adminPasswordConfirm = 'Passwords do not match';
    }

    return newErrors;
  }, [form, tenants]);

  useEffect(() => {
    if (Object.keys(touched).length > 0) {
      setErrors(validateForm());
    }
  }, [form, touched, validateForm]);

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'subdomain') {
      setSubdomainManuallyEdited(true);
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      subdomain: '',
      contactEmail: '',
      contactName: '',
      adminEmail: '',
      adminPassword: '',
      adminPasswordConfirm: '',
      plan: 'starter',
    });
    setErrors({});
    setTouched({});
    setSubdomainManuallyEdited(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      name: true,
      subdomain: true,
      contactEmail: true,
      adminEmail: true,
      adminPassword: true,
      adminPasswordConfirm: true,
    });

    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setNotification({ type: 'error', message: 'Please fix the errors in the form' });
      return;
    }

    try {
      const payload: CreateTenantPayload = {
        name: form.name.trim(),
        subdomain: form.subdomain.trim(),
        contactEmail: form.contactEmail.trim(),
        contactName: form.contactName.trim() || undefined,
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword.trim(),
        plan: form.plan,
      };

      await onCreateTenant(payload, { activate: true });
      
      setNotification({ 
        type: 'success', 
        message: `🎉 "${form.name}" created successfully! Store URL: ${protocol}://${form.subdomain}.${primaryDomain}` 
      });
      
      resetForm();
      setShowForm(false);
      
      // Refresh tenant list
      if (onRefreshTenants) {
        await onRefreshTenants();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tenant';
      setNotification({ type: 'error', message });
    }
  };

  const handleDelete = async () => {
    if (!deleteModal || !onDeleteTenant) return;
    
    try {
      await onDeleteTenant(deleteModal.id);
      setNotification({ type: 'success', message: `"${deleteModal.name}" has been deleted` });
      setDeleteModal(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete tenant';
      setNotification({ type: 'error', message });
    }
  };

  const handleRefresh = async () => {
    if (!onRefreshTenants || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshTenants();
      setNotification({ type: 'success', message: 'Tenant list refreshed' });
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to refresh tenants' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTenantUrl = (subdomain?: string) => {
    if (!subdomain) return null;
    return `${protocol}://${subdomain}.${primaryDomain}`;
  };

  // New handlers for status management
  const handleStatusAction = async () => {
    if (!statusModal || !onUpdateTenantStatus) return;
    
    const { tenant, action } = statusModal;
    let newStatus: Tenant['status'];
    
    switch (action) {
      case 'approve':
        newStatus = 'active';
        break;
      case 'reject':
        newStatus = 'inactive';
        break;
      case 'suspend':
        newStatus = 'suspended';
        break;
      case 'activate':
        newStatus = 'active';
        break;
      default:
        return;
    }
    
    setActioningTenantId(tenant.id);
    try {
      await onUpdateTenantStatus(tenant.id, newStatus, statusReason || undefined);
      setNotification({ 
        type: 'success', 
        message: `Tenant "${tenant.name}" ${action}d successfully` 
      });
      setStatusModal(null);
      setStatusReason('');
      
      if (onRefreshTenants) {
        await onRefreshTenants();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Failed to ${action} tenant`;
      setNotification({ type: 'error', message });
    } finally {
      setActioningTenantId(null);
    }
  };

  const handleLoginAsMerchant = async (tenant: Tenant) => {
    if (!onLoginAsMerchant) return;
    
    setActioningTenantId(tenant.id);
    try {
      await onLoginAsMerchant(tenant.id);
      setNotification({ 
        type: 'success', 
        message: `Logging in as ${tenant.name}...` 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to login as merchant';
      setNotification({ type: 'error', message });
    } finally {
      setActioningTenantId(null);
    }
  };

  const handleUpdateDomain = async () => {
    if (!domainModal || !onUpdateDomain || !customDomain.trim()) return;
    
    setActioningTenantId(domainModal.id);
    try {
      await onUpdateDomain(domainModal.id, customDomain.trim(), 'custom');
      setNotification({ 
        type: 'success', 
        message: `Custom domain "${customDomain}" added to ${domainModal.name}` 
      });
      setDomainModal(null);
      setCustomDomain('');
      
      if (onRefreshTenants) {
        await onRefreshTenants();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update domain';
      setNotification({ type: 'error', message });
    } finally {
      setActioningTenantId(null);
    }
  };

  // Filter and search tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = !searchQuery || 
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.subdomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const metrics = {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    trialing: tenants.filter(t => t.status === 'trialing').length,
    pending: tenants.filter(t => t.status === 'pending').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Notification */}
      {notification && (
        <div 
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 sm:max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 animate-in slide-in-from-right ${
            notification.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm flex-1">{notification.message}</p>
          <button onClick={() => setNotification(null)} className="text-current opacity-50 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 rounded-2xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-white/10 rounded-xl">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Store Lists</h1>
              <p className="text-white/70 text-xs sm:text-sm">Create and manage multi-tenant storefronts</p>
            </div>
          </div>
          
          {/* Metrics - scrollable on mobile */}
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 sm:gap-4 text-sm min-w-max">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold">{metrics.total}</p>
                <p className="text-white/60 text-xs">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">{metrics.active}</p>
                <p className="text-white/60 text-xs">Active</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{metrics.trialing}</p>
                <p className="text-white/60 text-xs">Trial</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-400">{metrics.pending}</p>
                <p className="text-white/60 text-xs">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-red-400">{metrics.suspended}</p>
                <p className="text-white/60 text-xs">Suspended</p>
              </div>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onRefreshTenants && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition text-sm sm:text-base"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span className="hidden xs:inline">{showForm ? 'Cancel' : 'Add Shop'}</span>
              <span className="xs:hidden">{showForm ? '' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl border shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by name, subdomain, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
            />
          </div>
          {/* Filter buttons - scrollable on mobile */}
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === 'all' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === 'pending' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === 'active' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('suspended')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  statusFilter === 'suspended' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Suspended
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-semibold">Create New Storefront</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            {/* Store Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  onBlur={() => handleBlur('name')}
                  placeholder="My Awesome Store"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.name && errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {touched.name && errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Subdomain */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.subdomain}
                  onChange={(e) => handleInputChange('subdomain', sanitizeSubdomain(e.target.value))}
                  onBlur={() => handleBlur('subdomain')}
                  placeholder="mystore"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.subdomain && errors.subdomain ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {form.subdomain && !errors.subdomain && (
                <p className="mt-1 text-sm text-emerald-600">
                  URL: {protocol}://{form.subdomain}.{primaryDomain}
                </p>
              )}
              {touched.subdomain && errors.subdomain && (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain}</p>
              )}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  onBlur={() => handleBlur('contactEmail')}
                  placeholder="contact@store.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.contactEmail && errors.contactEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {touched.contactEmail && errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Admin Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Login Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  onBlur={() => handleBlur('adminEmail')}
                  placeholder="admin@store.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.adminEmail && errors.adminEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
              {touched.adminEmail && errors.adminEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>
              )}
            </div>

            {/* Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={form.plan}
                onChange={(e) => handleInputChange('plan', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {PLAN_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.adminPassword}
                  onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                  onBlur={() => handleBlur('adminPassword')}
                  placeholder="Min 6 characters"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.adminPassword && errors.adminPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.adminPassword && errors.adminPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.adminPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.adminPasswordConfirm}
                  onChange={(e) => handleInputChange('adminPasswordConfirm', e.target.value)}
                  onBlur={() => handleBlur('adminPasswordConfirm')}
                  placeholder="Confirm password"
                  className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
                    touched.adminPasswordConfirm && errors.adminPasswordConfirm ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.adminPasswordConfirm && errors.adminPasswordConfirm && (
                <p className="mt-1 text-sm text-red-600">{errors.adminPasswordConfirm}</p>
              )}
              {form.adminPassword && form.adminPasswordConfirm && form.adminPassword === form.adminPasswordConfirm && (
                <p className="mt-1 text-sm text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center justify-center gap-2 px-6 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Tenant
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tenant List */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-800">All Tenants ({filteredTenants.length})</h2>
        </div>
        
        {filteredTenants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' 
                ? 'No tenants match your filters' 
                : 'No tenants yet. Create your first storefront!'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTenants.map((tenant) => {
              const url = getTenantUrl(tenant.subdomain);
              const statusStyle = STATUS_COLORS[tenant.status || 'inactive'] || STATUS_COLORS.inactive;
              
              return (
                <div 
                  key={tenant.id || tenant._id} 
                  className="p-3 sm:p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className="p-2 sm:p-2.5 bg-slate-100 rounded-lg flex-shrink-0">
                        <Store className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{tenant.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                            {tenant.status || 'inactive'}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                            {tenant.plan || 'starter'}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                          {url && (
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline truncate"
                            >
                              <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{tenant.subdomain}.{primaryDomain}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          )}
                          {tenant.adminEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate">{tenant.adminEmail}</span>
                            </span>
                          )}
                        </div>
                        
                        {tenant.createdAt && (
                          <p className="mt-1 text-xs text-gray-400">
                            Created: {new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons - scrollable on mobile */}
                    <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 -mb-1 pb-1 sm:mb-0 sm:pb-0">
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 min-w-max">
                        {/* Login as Merchant */}
                        {onLoginAsMerchant && tenant.status === 'active' && (
                          <button
                            onClick={() => handleLoginAsMerchant(tenant)}
                            disabled={actioningTenantId === tenant.id}
                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition disabled:opacity-50"
                            title="Login as merchant"
                          >
                            {actioningTenantId === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogIn className="w-4 h-4" />
                            )}
                          </button>
                        )}

                        {/* Domain Management */}
                        {onUpdateDomain && (
                          <button
                            onClick={() => setDomainModal(tenant)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Manage domains"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        )}

                        {/* Status Actions */}
                        {onUpdateTenantStatus && (
                          <>
                            {tenant.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => setStatusModal({ tenant, action: 'approve' })}
                                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="Approve tenant"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setStatusModal({ tenant, action: 'reject' })}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Reject tenant"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {tenant.status === 'active' && (
                              <button
                                onClick={() => setStatusModal({ tenant, action: 'suspend' })}
                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                                title="Suspend tenant"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {tenant.status === 'suspended' && (
                              <button
                                onClick={() => setStatusModal({ tenant, action: 'activate' })}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Activate tenant"
                              >
                                <PlayCircle className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        {url && (
                          <button
                            onClick={() => copyToClipboard(url, tenant.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Copy URL"
                          >
                            {copiedId === tenant.id ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Open store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        
                        {onDeleteTenant && (
                          <button
                            onClick={() => setDeleteModal(tenant)}
                            disabled={deletingTenantId === tenant.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete tenant"
                          >
                            {deletingTenantId === tenant.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6 animate-in zoom-in-95 safe-bottom">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Delete Tenant</h3>
            </div>
            
            <p className="text-gray-600 mb-2">
              Are you sure you want to delete <strong>{deleteModal.name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove the tenant, all its data, and the admin user account. This action cannot be undone.
            </p>
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={!!deletingTenantId}
                className="px-4 py-2.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingTenantId}
                className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {deletingTenantId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {statusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                statusModal.action === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                statusModal.action === 'reject' ? 'bg-red-100 text-red-600' :
                statusModal.action === 'suspend' ? 'bg-orange-100 text-orange-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {statusModal.action === 'approve' && <UserCheck className="w-5 h-5" />}
                {statusModal.action === 'reject' && <UserX className="w-5 h-5" />}
                {statusModal.action === 'suspend' && <Ban className="w-5 h-5" />}
                {statusModal.action === 'activate' && <PlayCircle className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-semibold capitalize">{statusModal.action} Tenant</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to {statusModal.action} <strong>{statusModal.tenant.name}</strong>?
            </p>
            
            {(statusModal.action === 'reject' || statusModal.action === 'suspend') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason {statusModal.action === 'reject' ? '(required)' : '(optional)'}
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={`Why are you ${statusModal.action}ing this tenant?`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setStatusModal(null);
                  setStatusReason('');
                }}
                disabled={!!actioningTenantId}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusAction}
                disabled={!!actioningTenantId || (statusModal.action === 'reject' && !statusReason.trim())}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 ${
                  statusModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  statusModal.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  statusModal.action === 'suspend' ? 'bg-orange-600 hover:bg-orange-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {actioningTenantId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain Management Modal */}
      {domainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold">Manage Custom Domain</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Add a custom domain for <strong>{domainModal.name}</strong>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Domains
              </label>
              <div className="space-y-2">
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm">
                  <span className="text-emerald-600 font-medium">Primary:</span> {domainModal.subdomain}.{primaryDomain}
                </div>
                {domainModal.customDomain && (
                  <div className="px-3 py-2 bg-blue-50 rounded-lg text-sm">
                    <span className="text-blue-600 font-medium">Custom:</span> {domainModal.customDomain}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Custom Domain
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the custom domain without http:// or https://
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDomainModal(null);
                  setCustomDomain('');
                }}
                disabled={!!actioningTenantId}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDomain}
                disabled={!!actioningTenantId || !customDomain.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {actioningTenantId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Add Domain
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTenantManagement;
