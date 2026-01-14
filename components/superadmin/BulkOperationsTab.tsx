import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Trash2, Mail, CheckSquare, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BulkOperationsTabProps {
  tenants: Array<{
    id: string;
    name: string;
    subdomain: string;
    status: string;
    email?: string;
    plan?: string;
  }>;
  onBulkStatusChange?: (tenantIds: string[], status: string) => Promise<void>;
  onBulkDelete?: (tenantIds: string[]) => Promise<void>;
  onBulkEmail?: (tenantIds: string[], subject: string, message: string) => Promise<void>;
}

const BulkOperationsTab: React.FC<BulkOperationsTabProps> = ({
  tenants,
  onBulkStatusChange,
  onBulkDelete,
  onBulkEmail,
}) => {
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const filteredTenants = tenants.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPlan !== 'all' && t.plan !== filterPlan) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedTenants.length === filteredTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(filteredTenants.map(t => t.id));
    }
  };

  const handleToggleSelect = (tenantId: string) => {
    if (selectedTenants.includes(tenantId)) {
      setSelectedTenants(selectedTenants.filter(id => id !== tenantId));
    } else {
      setSelectedTenants([...selectedTenants, tenantId]);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTenants.length === 0) {
      toast.error('No tenants selected');
      return;
    }

    if (!window.confirm(`Change status to "${newStatus}" for ${selectedTenants.length} tenant(s)?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      if (onBulkStatusChange) {
        await onBulkStatusChange(selectedTenants, newStatus);
        toast.success(`Updated status for ${selectedTenants.length} tenant(s)`);
        setSelectedTenants([]);
      }
    } catch (error) {
      toast.error('Failed to update tenant status');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTenants.length === 0) {
      toast.error('No tenants selected');
      return;
    }

    if (!window.confirm(`⚠️ DELETE ${selectedTenants.length} tenant(s)? This action cannot be undone!`)) {
      return;
    }

    setIsProcessing(true);
    try {
      if (onBulkDelete) {
        await onBulkDelete(selectedTenants);
        toast.success(`Deleted ${selectedTenants.length} tenant(s)`);
        setSelectedTenants([]);
      }
    } catch (error) {
      toast.error('Failed to delete tenants');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedTenants.length === 0) {
      toast.error('No tenants selected');
      return;
    }

    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error('Please fill in subject and message');
      return;
    }

    setIsProcessing(true);
    try {
      if (onBulkEmail) {
        await onBulkEmail(selectedTenants, emailSubject, emailMessage);
        toast.success(`Email sent to ${selectedTenants.length} tenant(s)`);
        setEmailSubject('');
        setEmailMessage('');
        setShowEmailModal(false);
        setSelectedTenants([]);
      }
    } catch (error) {
      toast.error('Failed to send emails');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = () => {
    const selectedData = tenants.filter(t => selectedTenants.includes(t.id));
    const csv = [
      ['ID', 'Name', 'Subdomain', 'Email', 'Status', 'Plan'].join(','),
      ...selectedData.map(t => [
        t.id,
        t.name,
        t.subdomain,
        t.email || '',
        t.status,
        t.plan || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Bulk Operations</h1>
        <p className="text-slate-600 mt-1">Manage multiple tenants simultaneously</p>
      </div>

      {/* Filters and Selection Info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedTenants.length === filteredTenants.length && filteredTenants.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Select All ({selectedTenants.length} / {filteredTenants.length})
              </span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          {selectedTenants.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailModal(true)}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Mail size={16} />
                Send Email
              </button>
              <button
                onClick={handleExportData}
                className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors flex items-center gap-2 text-sm"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTenants.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckSquare size={20} />
              <span className="font-medium">{selectedTenants.length} tenant(s) selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkStatusChange('active')}
                disabled={isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors text-sm disabled:opacity-50"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkStatusChange('suspended')}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm disabled:opacity-50"
              >
                Suspend
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTenants.length === filteredTenants.length && filteredTenants.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Subdomain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No tenants found
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className={`hover:bg-slate-50 ${selectedTenants.includes(tenant.id) ? 'bg-emerald-50' : ''}`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={() => handleToggleSelect(tenant.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{tenant.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{tenant.subdomain}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{tenant.email || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        tenant.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                        tenant.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 capitalize">{tenant.plan || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Bulk Operations Guide</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Select multiple tenants using checkboxes to perform bulk actions</li>
              <li>• Export selected tenant data as CSV for reporting or backup</li>
              <li>• Send bulk emails to notify tenants about updates or promotions</li>
              <li>• Change status for multiple tenants at once (activate, suspend)</li>
              <li>• Use filters to narrow down tenant selection by status or plan</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Send Bulk Email</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Recipients: {selectedTenants.length} tenant(s)
                </label>
                <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                  {tenants.filter(t => selectedTenants.includes(t.id)).map(t => t.name).join(', ')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Enter email message..."
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={() => setShowEmailModal(false)}
                disabled={isProcessing}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulkEmail}
                disabled={isProcessing}
                className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Mail size={16} />
                {isProcessing ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsTab;
