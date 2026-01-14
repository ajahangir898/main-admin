import React, { useState } from 'react';
import {
  Megaphone, Mail, Bell, Send, Clock, Users, Filter,
  Plus, Edit2, Trash2, Eye, Calendar, CheckCircle2,
  AlertTriangle, Info, Rocket, Wrench, X, Search
} from 'lucide-react';
import { BulkAnnouncement } from './types';
import { Tenant } from '../../types';

interface BulkAnnouncementsTabProps {
  announcements: BulkAnnouncement[];
  tenants: Tenant[];
  onCreateAnnouncement: (announcement: Omit<BulkAnnouncement, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onUpdateAnnouncement: (id: string, updates: Partial<BulkAnnouncement>) => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  onSendAnnouncement: (id: string) => Promise<void>;
}

const announcementTemplates = [
  { id: 'maintenance', name: 'Scheduled Maintenance', icon: Wrench, type: 'maintenance' as const },
  { id: 'feature', name: 'New Feature Launch', icon: Rocket, type: 'feature' as const },
  { id: 'update', name: 'System Update', icon: Info, type: 'info' as const },
  { id: 'warning', name: 'Important Notice', icon: AlertTriangle, type: 'warning' as const },
];

const BulkAnnouncementsTab: React.FC<BulkAnnouncementsTabProps> = ({
  announcements,
  tenants,
  onCreateAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onSendAnnouncement
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<BulkAnnouncement | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info' as BulkAnnouncement['type'],
    channel: 'both' as BulkAnnouncement['channel'],
    targetAudience: 'all' as BulkAnnouncement['targetAudience'],
    targetTenantIds: [] as string[],
    scheduledAt: '',
    template: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      channel: 'both',
      targetAudience: 'all',
      targetTenantIds: [],
      scheduledAt: '',
      template: ''
    });
  };

  const handleCreateAnnouncement = async (sendImmediately: boolean = false) => {
    setIsSubmitting(true);
    try {
      await onCreateAnnouncement({
        ...formData,
        createdBy: 'Super Admin',
        targetTenantIds: formData.targetAudience === 'specific' ? formData.targetTenantIds : undefined,
        scheduledAt: formData.scheduledAt || undefined
      });
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create announcement:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSend = async (id: string) => {
    try {
      await onSendAnnouncement(id);
    } catch (error) {
      console.error('Failed to send announcement:', error);
    }
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesStatus = filterStatus === 'all' || ann.status === filterStatus;
    const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTypeIcon = (type: BulkAnnouncement['type']) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'feature': return <Rocket className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: BulkAnnouncement['type']) => {
    switch (type) {
      case 'maintenance': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'feature': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'success': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusBadge = (status: BulkAnnouncement['status']) => {
    switch (status) {
      case 'draft':
        return <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">Draft</span>;
      case 'scheduled':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'sent':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Sent</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">Cancelled</span>;
    }
  };

  const stats = {
    total: announcements.length,
    sent: announcements.filter(a => a.status === 'sent').length,
    scheduled: announcements.filter(a => a.status === 'scheduled').length,
    drafts: announcements.filter(a => a.status === 'draft').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-emerald-500" />
            Bulk Announcements
          </h2>
          <p className="text-slate-600 mt-1">Send system-wide notifications and emails to merchants</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Megaphone className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Sent</p>
              <p className="text-xl font-bold text-green-600">{stats.sent}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="text-xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Edit2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Drafts</p>
              <p className="text-xl font-bold text-amber-600">{stats.drafts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Templates</h3>
        <div className="flex flex-wrap gap-2">
          {announcementTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  type: template.type,
                  template: template.id,
                  title: template.name
                }));
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-sm text-slate-700"
            >
              <template.icon className="w-4 h-4" />
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No announcements yet</h3>
            <p className="text-slate-500 mb-4">Create your first announcement to communicate with merchants</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors"
            >
              Create Announcement
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAnnouncements.map(announcement => (
              <div key={announcement.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getTypeColor(announcement.type)}`}>
                        {getTypeIcon(announcement.type)}
                        {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                      </span>
                      {getStatusBadge(announcement.status)}
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        {announcement.channel === 'email' && <Mail className="w-3 h-3" />}
                        {announcement.channel === 'notification' && <Bell className="w-3 h-3" />}
                        {announcement.channel === 'both' && <><Mail className="w-3 h-3" /><Bell className="w-3 h-3" /></>}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-800 mb-1">{announcement.title}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{announcement.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {announcement.targetAudience === 'all' ? 'All Merchants' : 
                         announcement.targetAudience === 'specific' ? `${announcement.targetTenantIds?.length || 0} Selected` :
                         `${announcement.targetAudience.charAt(0).toUpperCase() + announcement.targetAudience.slice(1)} Merchants`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {announcement.sentAt || announcement.scheduledAt || announcement.createdAt}
                      </span>
                      {announcement.openRate !== undefined && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {announcement.openRate}% opened
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {announcement.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleSend(announcement.id)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Send Now"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedAnnouncement(announcement)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => onDeleteAnnouncement(announcement.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Create Announcement</h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Announcement Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['info', 'warning', 'success', 'maintenance', 'feature'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, type }))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        formData.type === type
                          ? getTypeColor(type)
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter announcement title..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your announcement message..."
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Delivery Channel</label>
                <div className="flex gap-2">
                  {([
                    { value: 'notification', label: 'In-App', icon: Bell },
                    { value: 'email', label: 'Email', icon: Mail },
                    { value: 'both', label: 'Both', icon: Megaphone }
                  ] as const).map(channel => (
                    <button
                      key={channel.value}
                      onClick={() => setFormData(prev => ({ ...prev, channel: channel.value }))}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        formData.channel === channel.value
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <channel.icon className="w-4 h-4" />
                      {channel.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value as BulkAnnouncement['targetAudience'] }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="all">All Merchants</option>
                  <option value="active">Active Merchants Only</option>
                  <option value="trialing">Trial Merchants Only</option>
                  <option value="suspended">Suspended Merchants</option>
                  <option value="specific">Select Specific Merchants</option>
                </select>

                {formData.targetAudience === 'specific' && (
                  <div className="mt-3 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
                    {tenants.map(tenant => (
                      <label key={tenant.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.targetTenantIds.includes(tenant.id)}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              targetTenantIds: e.target.checked
                                ? [...prev.targetTenantIds, tenant.id]
                                : prev.targetTenantIds.filter(id => id !== tenant.id)
                            }));
                          }}
                          className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span className="text-sm text-slate-700">{tenant.name}</span>
                        <span className="text-xs text-slate-400">({tenant.subdomain})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty to save as draft or send immediately</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCreateAnnouncement(false)}
                disabled={isSubmitting || !formData.title || !formData.message}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleCreateAnnouncement(true)}
                disabled={isSubmitting || !formData.title || !formData.message}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {formData.scheduledAt ? 'Schedule' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkAnnouncementsTab;
