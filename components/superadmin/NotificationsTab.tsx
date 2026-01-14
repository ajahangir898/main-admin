import React, { useState } from 'react';
import { 
  Bell, Send, Plus, Trash2, Users, Building2, 
  AlertTriangle, Info, CheckCircle, XCircle,
  Clock, Search, Filter, MoreVertical, Loader2
} from 'lucide-react';
import { AdminNotification } from './types';

interface NotificationsTabProps {
  notifications: AdminNotification[];
  onSendNotification: (notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  tenants: { id: string; name: string }[];
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  notifications,
  onSendNotification,
  onDeleteNotification,
  tenants
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'info' | 'warning' | 'success' | 'error'>('all');

  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info' as AdminNotification['type'],
    priority: 'medium' as AdminNotification['priority'],
    targetTenants: 'all' as string[] | 'all',
    expiresAt: ''
  });

  const handleSend = async () => {
    if (!newNotification.title || !newNotification.message) return;
    
    setIsSending(true);
    try {
      await onSendNotification({
        ...newNotification,
        expiresAt: newNotification.expiresAt || undefined
      });
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        targetTenants: 'all',
        expiresAt: ''
      });
      setIsCreating(false);
    } finally {
      setIsSending(false);
    }
  };

  const getTypeIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTypeBadge = (type: AdminNotification['type']) => {
    const styles = {
      info: 'bg-blue-100 text-blue-700',
      warning: 'bg-amber-100 text-amber-700',
      success: 'bg-emerald-100 text-emerald-700',
      error: 'bg-red-100 text-red-700'
    };
    return styles[type];
  };

  const getPriorityBadge = (priority: AdminNotification['priority']) => {
    const styles = {
      low: 'bg-slate-100 text-slate-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-red-100 text-red-600'
    };
    return styles[priority];
  };

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Push Notifications</h2>
          <p className="text-slate-500 mt-1">Send notifications to tenant admins</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Notification
        </button>
      </div>

      {/* Create Notification Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Create Notification</h3>
              <p className="text-sm text-slate-500">Send a notification to tenant admins</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value as AdminNotification['type'] }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification(prev => ({ ...prev, priority: e.target.value as AdminNotification['priority'] }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Tenants</label>
                <select
                  value={newNotification.targetTenants === 'all' ? 'all' : 'selected'}
                  onChange={(e) => setNewNotification(prev => ({ 
                    ...prev, 
                    targetTenants: e.target.value === 'all' ? 'all' : [] 
                  }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                >
                  <option value="all">All Tenants</option>
                  <option value="selected">Select Specific Tenants</option>
                </select>
              </div>

              {newNotification.targetTenants !== 'all' && (
                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2">
                  {tenants.map(tenant => (
                    <label key={tenant.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Array.isArray(newNotification.targetTenants) && newNotification.targetTenants.includes(tenant.id)}
                        onChange={(e) => {
                          const current = Array.isArray(newNotification.targetTenants) ? newNotification.targetTenants : [];
                          setNewNotification(prev => ({
                            ...prev,
                            targetTenants: e.target.checked 
                              ? [...current, tenant.id]
                              : current.filter(id => id !== tenant.id)
                          }));
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700">{tenant.name}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={newNotification.expiresAt}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSending || !newNotification.title || !newNotification.message}
                className="px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Types</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No notifications</h3>
            <p className="text-slate-500">Create your first notification to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeBadge(notification.type).replace('text-', 'bg-').split(' ')[0]}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-slate-900">{notification.title}</h4>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                      <button
                        onClick={() => onDeleteNotification(notification.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(notification.type)}`}>
                        {notification.type}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {notification.targetTenants === 'all' ? (
                          <>
                            <Users className="w-3 h-3" />
                            All Tenants
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3 h-3" />
                            {notification.targetTenants.length} Tenants
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {notification.createdAt}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsTab;
