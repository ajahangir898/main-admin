import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Trash2,
  Upload,
  User,
  X,
  Download,
  Settings,
  Image,
  FileText,
  Bell,
  MessageSquare,
  Database,
  LogIn,
  LogOut,
} from 'lucide-react';
const API_BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
  ? String(import.meta.env.VITE_API_BASE_URL)
  : '';

// Helper function to safely get token from localStorage (client-side only)
const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('admin_auth_token');
  } catch {
    return null;
  }
};

interface AuditLog {
  _id: string;
  tenantId?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  actionType: 'create' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete' | 'login' | 'logout' | 'export' | 'import' | 'other';
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface AdminActivityLogProps {
  tenantId?: string;
}

const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ tenantId }) => {
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, pages: 0 });

  // Get token on client side only
  useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);
  }, []);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  
  // Dropdown states
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);

  const resourceTypes = [
    { value: 'all', label: 'All Type' },
    { value: 'product', label: 'Product' },
    { value: 'order', label: 'Order' },
    { value: 'category', label: 'Category' },
    { value: 'user', label: 'User' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'popup', label: 'Popup' },
    { value: 'campaign', label: 'Campaign' },
    { value: 'expense', label: 'Expense' },
    { value: 'income', label: 'Income' },
    { value: 'due', label: 'Due' },
    { value: 'review', label: 'Review' },
    { value: 'settings', label: 'Settings' },
    { value: 'other', label: 'Other' },
  ];

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' },
    { value: 'bulk_create', label: 'Bulk Create' },
    { value: 'bulk_update', label: 'Bulk Update' },
    { value: 'bulk_delete', label: 'Bulk Delete' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'export', label: 'Export' },
    { value: 'import', label: 'Import' },
    { value: 'other', label: 'Other' },
  ];

  const itemsPerPageOptions = [5, 10, 20, 50, 100];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', itemsPerPage.toString());
      if (tenantId) params.append('tenantId', tenantId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (resourceTypeFilter !== 'all') params.append('resourceType', resourceTypeFilter);
      if (actionTypeFilter !== 'all') params.append('actionType', actionTypeFilter);

      const response = await fetch(`${API_BASE_URL}/api/audit-logs?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
      } else {
        console.error('Failed to fetch activity logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLogs();
    }
  }, [pagination.page, itemsPerPage, startDate, endDate, resourceTypeFilter, actionTypeFilter, token, tenantId]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setResourceTypeFilter('all');
    setActionTypeFilter('all');
    setItemsPerPage(10);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getActionIcon = (actionType: string, resourceType: string) => {
    const iconClass = "w-4 h-4";
    
    switch (actionType) {
      case 'create':
      case 'bulk_create':
        return <Plus className={`${iconClass} text-green-500`} />;
      case 'update':
      case 'bulk_update':
        return <Edit className={`${iconClass} text-blue-500`} />;
      case 'delete':
      case 'bulk_delete':
        return <Trash2 className={`${iconClass} text-red-500`} />;
      case 'login':
        return <LogIn className={`${iconClass} text-purple-500`} />;
      case 'logout':
        return <LogOut className={`${iconClass} text-orange-500`} />;
      case 'export':
        return <Download className={`${iconClass} text-cyan-500`} />;
      case 'import':
        return <Upload className={`${iconClass} text-indigo-500`} />;
      default:
        return <Activity className={`${iconClass} text-gray-500`} />;
    }
  };

  const getResourceIcon = (resourceType: string) => {
    const iconClass = "w-4 h-4 text-gray-400";
    
    switch (resourceType) {
      case 'product':
        return <Package className={iconClass} />;
      case 'order':
        return <ShoppingCart className={iconClass} />;
      case 'user':
        return <User className={iconClass} />;
      case 'category':
        return <Database className={iconClass} />;
      case 'gallery':
        return <Image className={iconClass} />;
      case 'settings':
        return <Settings className={iconClass} />;
      case 'notification':
        return <Bell className={iconClass} />;
      case 'support_ticket':
        return <MessageSquare className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-blue-100 text-blue-700';
      case 'delete':
        return 'bg-red-100 text-red-700';
      case 'bulk_create':
        return 'bg-green-100 text-green-700';
      case 'bulk_update':
        return 'bg-blue-100 text-blue-700';
      case 'bulk_delete':
        return 'bg-red-100 text-red-700';
      case 'login':
        return 'bg-purple-100 text-purple-700';
      case 'logout':
        return 'bg-orange-100 text-orange-700';
      case 'export':
        return 'bg-cyan-100 text-cyan-700';
      case 'import':
        return 'bg-indigo-100 text-indigo-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isBulkAction = (actionType: string) => {
    return actionType.startsWith('bulk_');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setShowTypeDropdown(false);
        setShowActionDropdown(false);
        setShowItemsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-500" />
              Activity Log
            </h1>
            <p className="text-gray-500 text-sm mt-1">Track all system activities and changes</p>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Start date"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-3 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Resource Type Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowTypeDropdown(!showTypeDropdown);
                  setShowActionDropdown(false);
                  setShowItemsDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4 text-gray-400" />
                <span>{resourceTypes.find(t => t.value === resourceTypeFilter)?.label || 'All Type'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showTypeDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {resourceTypes.map(type => (
                    <button
                      key={type.value}
                      onClick={() => {
                        setResourceTypeFilter(type.value);
                        setShowTypeDropdown(false);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${resourceTypeFilter === type.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Type Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowActionDropdown(!showActionDropdown);
                  setShowTypeDropdown(false);
                  setShowItemsDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                <Activity className="w-4 h-4 text-gray-400" />
                <span>{actionTypes.find(a => a.value === actionTypeFilter)?.label || 'All Actions'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showActionDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showActionDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {actionTypes.map(action => (
                    <button
                      key={action.value}
                      onClick={() => {
                        setActionTypeFilter(action.value);
                        setShowActionDropdown(false);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${actionTypeFilter === action.value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Items Per Page Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => {
                  setShowItemsDropdown(!showItemsDropdown);
                  setShowTypeDropdown(false);
                  setShowActionDropdown(false);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 transition-colors"
              >
                <span>{itemsPerPage} Admin</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showItemsDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showItemsDropdown && (
                <div className="absolute top-full right-0 mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {itemsPerPageOptions.map(option => (
                    <button
                      key={option}
                      onClick={() => {
                        setItemsPerPage(option);
                        setShowItemsDropdown(false);
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${itemsPerPage === option ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear Filter Button */}
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Clear filter
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchLogs}
              className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
            <p className="text-gray-500">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Activity Logs Found</h3>
            <p className="text-gray-500 text-sm">No logs match your current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">SL</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log, index) => (
                  <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                    {/* SL */}
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-600">{(pagination.page - 1) * itemsPerPage + index + 1}</span>
                    </td>
                    
                    {/* Action */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          {getActionIcon(log.actionType, log.resourceType)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1)}_{log.actionType}
                        </span>
                      </div>
                    </td>
                    
                    {/* Entity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resourceType)}
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {log.resourceName || `${log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1)} ${log.resourceId?.slice(-4) || ''}`}
                          </p>
                          <p className="text-xs text-gray-400">{log.resourceType.charAt(0).toUpperCase() + log.resourceType.slice(1)}</p>
                        </div>
                      </div>
                    </td>
                    
                    {/* Description */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 max-w-xs">
                        <p className="text-sm text-gray-600 truncate">{log.details}</p>
                        {isBulkAction(log.actionType) && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Bulk
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Vendor */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">{log.userName?.charAt(0).toUpperCase() || 'U'}</span>
                        </div>
                        <span className="text-sm text-gray-600">{log.userName}</span>
                      </div>
                    </td>
                    
                    {/* Date & Time */}
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-500">{formatDateTime(log.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50">
            <div className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * itemsPerPage + 1} to {Math.min(pagination.page * itemsPerPage, pagination.total)} of {pagination.total} entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        pagination.page === pageNum
                          ? 'bg-indigo-500 text-white'
                          : 'hover:bg-white text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, prev.pages) }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivityLog;
