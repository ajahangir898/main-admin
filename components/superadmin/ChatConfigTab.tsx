import React, { useState } from 'react';
import { 
  MessageCircle, Phone, Clock, Save, Loader2,
  ToggleLeft, ToggleRight, Building2, Check
} from 'lucide-react';
import { ChatConfig } from './types';

interface ChatConfigTabProps {
  chatConfig: ChatConfig;
  onSaveChatConfig: (config: ChatConfig) => Promise<void>;
  tenants: { id: string; name: string; subdomain: string }[];
  onApplyToTenant: (tenantId: string, config: ChatConfig) => Promise<void>;
  onApplyToAll: (config: ChatConfig) => Promise<void>;
}

const defaultChatConfig: ChatConfig = {
  enabled: true,
  whatsappNumber: '',
  messengerPageId: '',
  liveChatEnabled: false,
  supportHoursFrom: '09:00',
  supportHoursTo: '18:00',
  autoReplyMessage: 'Thanks for reaching out! We\'ll get back to you soon.',
  offlineMessage: 'We\'re currently offline. Please leave a message and we\'ll respond during business hours.'
};

const ChatConfigTab: React.FC<ChatConfigTabProps> = ({
  chatConfig,
  onSaveChatConfig,
  tenants,
  onApplyToTenant,
  onApplyToAll
}) => {
  const [config, setConfig] = useState<ChatConfig>(chatConfig || defaultChatConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [showTenantSelector, setShowTenantSelector] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveChatConfig(config);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToSelected = async () => {
    if (selectedTenants.length === 0) return;
    setIsApplying(true);
    try {
      for (const tenantId of selectedTenants) {
        await onApplyToTenant(tenantId, config);
      }
      setSelectedTenants([]);
      setShowTenantSelector(false);
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyToAll = async () => {
    setIsApplying(true);
    try {
      await onApplyToAll(config);
    } finally {
      setIsApplying(false);
    }
  };

  const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chat Configuration</h2>
          <p className="text-slate-500 mt-1">Configure chat settings for tenant storefronts</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Configuration
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Enable/Disable */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Chat Support</h3>
                  <p className="text-sm text-slate-500">Enable chat widget on storefronts</p>
                </div>
              </div>
              <Toggle 
                enabled={config.enabled} 
                onChange={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))} 
              />
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">WhatsApp Integration</h3>
                <p className="text-sm text-slate-500">Configure WhatsApp chat button</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp Number</label>
                <input
                  type="text"
                  value={config.whatsappNumber}
                  onChange={(e) => setConfig(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="+880 1XXXXXXXXX"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Include country code (e.g., +880 for Bangladesh)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Messenger Page ID</label>
                <input
                  type="text"
                  value={config.messengerPageId}
                  onChange={(e) => setConfig(prev => ({ ...prev, messengerPageId: e.target.value }))}
                  placeholder="Your Facebook Page ID"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Support Hours */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Support Hours</h3>
                <p className="text-sm text-slate-500">Set business hours for chat support</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                  <input
                    type="time"
                    value={config.supportHoursFrom}
                    onChange={(e) => setConfig(prev => ({ ...prev, supportHoursFrom: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                  <input
                    type="time"
                    value={config.supportHoursTo}
                    onChange={(e) => setConfig(prev => ({ ...prev, supportHoursTo: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-slate-700">Live Chat</p>
                  <p className="text-sm text-slate-500">Enable real-time live chat support</p>
                </div>
                <Toggle 
                  enabled={config.liveChatEnabled} 
                  onChange={() => setConfig(prev => ({ ...prev, liveChatEnabled: !prev.liveChatEnabled }))} 
                />
              </div>
            </div>
          </div>

          {/* Auto Messages */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Automated Messages</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Auto-Reply Message</label>
                <textarea
                  value={config.autoReplyMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, autoReplyMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Offline Message</label>
                <textarea
                  value={config.offlineMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, offlineMessage: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Apply to Tenants */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Apply Settings</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleApplyToAll}
                disabled={isApplying}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                Apply to All Tenants
              </button>
              
              <button
                onClick={() => setShowTenantSelector(!showTenantSelector)}
                className="w-full px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Select Specific Tenants
              </button>

              {showTenantSelector && (
                <div className="mt-3 max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  {tenants.map(tenant => (
                    <label 
                      key={tenant.id} 
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTenants.includes(tenant.id)}
                        onChange={(e) => {
                          setSelectedTenants(prev => 
                            e.target.checked 
                              ? [...prev, tenant.id]
                              : prev.filter(id => id !== tenant.id)
                          );
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{tenant.name}</p>
                        <p className="text-xs text-slate-500">{tenant.subdomain}.systemnextit.com</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedTenants.length > 0 && (
                <button
                  onClick={handleApplyToSelected}
                  disabled={isApplying}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  Apply to {selectedTenants.length} Tenant(s)
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Chat Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {config.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">WhatsApp</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.whatsappNumber ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {config.whatsappNumber ? 'Configured' : 'Not Set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Live Chat</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.liveChatEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                  {config.liveChatEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Hours</span>
                <span className="text-sm font-medium text-slate-700">
                  {config.supportHoursFrom} - {config.supportHoursTo}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatConfigTab;
