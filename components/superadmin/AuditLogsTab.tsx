import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, RefreshCw, Eye, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getAuthHeader } from '../../services/authService';
import { toast } from 'react-hot-toast';

interface AuditLog {
  _id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  details: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure' | 'warning';
  createdAt: string;
}

interface AuditLogStats {
  totalLogs: number;
  actionBreakdown: Array<{ action: string; count: number }>;
  resourceBreakdown: Array<{ resourceType: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
}

const AuditLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getApiUrl = (): string => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5001/api';
      }
      return 'https://systemnextit.com/api';
    }
    return 'https://systemnextit.com/api';
  };

  const API_URL = getApiUrl();

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (selectedResourceType !== 'all') {
        params.append('resourceType', selectedResourceType);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchQuery) {
        params.append('action', searchQuery);
      }

      const response = await fetch(`${API_URL}/audit-logs?${params}`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const result = await response.json();
        setLogs(result.data || []);
        setTotalPages(result.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_URL}/audit-logs/stats`, {
        headers: getAuthHeader(),
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load audit log stats:', error);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    loadStats();
  }, [page, selectedResourceType, selectedStatus]);

  const handleSearch = () => {
    setPage(1);
    loadAuditLogs();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-emerald-500" size={16} />;
      case 'failure':
        return <XCircle className="text-red-500" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-amber-500" size={16} />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-emerald-100 text-emerald-700',
      failure: 'bg-red-100 text-red-700',
      warning: 'bg-amber-100 text-amber-700',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="text-emerald-500" />
            Audit Logs
          </h1>
          <p className="text-slate-600 mt-1">Track all superadmin actions and system events</p>
        </div>
        <button
          onClick={() => { loadAuditLogs(); loadStats(); }}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
            <div className="text-sm text-slate-600 mb-1">Total Logs</div>
            <div className="text-2xl font-bold text-slate-800">{stats.totalLogs.toLocaleString()}</div>
          </div>
          {stats.statusBreakdown.map((item) => (
            <div key={item.status} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <div className="text-sm text-slate-600 mb-1 capitalize">{item.status}</div>
              <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                {getStatusIcon(item.status)}
                {item.count.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Search Action</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by action..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resource Type</label>
            <select
              value={selectedResourceType}
              onChange={(e) => { setSelectedResourceType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="tenant">Tenant</option>
              <option value="user">User</option>
              <option value="subscription">Subscription</option>
              <option value="order">Order</option>
              <option value="product">Product</option>
              <option value="settings">Settings</option>
              <option value="notification">Notification</option>
              <option value="support_ticket">Support Ticket</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="warning">Warning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No audit logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-600">{formatDate(log.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-800">{log.userName}</div>
                      <div className="text-xs text-slate-500">{log.userRole}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{log.action}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 capitalize">{log.resourceType}</div>
                      {log.resourceName && <div className="text-xs text-slate-500">{log.resourceName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm"
                      >
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border border-slate-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Audit Log Details</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Timestamp</label>
                  <div className="text-sm text-slate-800 mt-1">{formatDate(selectedLog.createdAt)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLog.status)}`}>
                      {getStatusIcon(selectedLog.status)}
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">User</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedLog.userName}</div>
                  <div className="text-xs text-slate-500">{selectedLog.userRole}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Action</label>
                  <div className="text-sm text-slate-800 mt-1">{selectedLog.action}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Resource Type</label>
                  <div className="text-sm text-slate-800 mt-1 capitalize">{selectedLog.resourceType}</div>
                </div>
                {selectedLog.resourceName && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">Resource Name</label>
                    <div className="text-sm text-slate-800 mt-1">{selectedLog.resourceName}</div>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <label className="text-sm font-medium text-slate-600">IP Address</label>
                    <div className="text-sm text-slate-800 mt-1">{selectedLog.ipAddress}</div>
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Details</label>
                <div className="text-sm text-slate-800 mt-1 bg-slate-50 rounded-lg p-3">
                  {selectedLog.details}
                </div>
              </div>
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Metadata</label>
                  <pre className="text-xs text-slate-800 mt-1 bg-slate-50 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsTab;
