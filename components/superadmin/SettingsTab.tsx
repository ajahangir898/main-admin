import React from 'react';
import { Globe, Building2, Mail, BarChart3, Save, Loader2 } from 'lucide-react';
import { PlatformConfig } from './types';

interface SettingsTabProps {
  platformConfig: PlatformConfig;
  setPlatformConfig: React.Dispatch<React.SetStateAction<PlatformConfig>>;
  isSavingSettings: boolean;
  onSave: () => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  platformConfig,
  setPlatformConfig,
  isSavingSettings,
  onSave
}) => {
  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Platform Settings</h2>
        <p className="text-slate-500 mt-1">Configure global platform settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">General Settings</h3>
              <p className="text-sm text-slate-500">Basic platform information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform Name</label>
              <input
                type="text"
                value={platformConfig.platformName}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, platformName: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform URL</label>
              <input
                type="text"
                value={platformConfig.platformUrl}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, platformUrl: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                value={platformConfig.supportEmail}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Support Phone</label>
              <input
                type="tel"
                value={platformConfig.supportPhone}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, supportPhone: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tenant Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Tenant Settings</h3>
              <p className="text-sm text-slate-500">Default settings for new tenants</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
              <select
                value={platformConfig.defaultCurrency}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, defaultCurrency: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              >
                <option value="BDT">BDT - Bangladeshi Taka</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Trial Days</label>
              <input
                type="number"
                value={platformConfig.defaultTrialDays}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, defaultTrialDays: parseInt(e.target.value) || 14 }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Tenants Per User</label>
              <input
                type="number"
                value={platformConfig.maxTenantsPerUser}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, maxTenantsPerUser: parseInt(e.target.value) || 5 }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-700">Allow New Registrations</p>
                <p className="text-sm text-slate-500">Enable tenant registration</p>
              </div>
              <button
                onClick={() => setPlatformConfig(prev => ({ ...prev, allowNewRegistrations: !prev.allowNewRegistrations }))}
                className={`w-12 h-6 rounded-full transition-colors ${platformConfig.allowNewRegistrations ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${platformConfig.allowNewRegistrations ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Email Settings (SMTP)</h3>
              <p className="text-sm text-slate-500">Configure email server settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={platformConfig.smtpHost}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, smtpHost: e.target.value }))}
                  placeholder="smtp.example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="text"
                  value={platformConfig.smtpPort}
                  onChange={(e) => setPlatformConfig(prev => ({ ...prev, smtpPort: e.target.value }))}
                  placeholder="587"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Username</label>
              <input
                type="text"
                value={platformConfig.smtpUser}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, smtpUser: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SMTP Password</label>
              <input
                type="password"
                value={platformConfig.smtpPassword}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, smtpPassword: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Analytics & Tracking */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Analytics & Tracking</h3>
              <p className="text-sm text-slate-500">Platform-wide analytics settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Google Analytics ID</label>
              <input
                type="text"
                value={platformConfig.googleAnalyticsId}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                placeholder="UA-XXXXXXXXX-X or G-XXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Facebook Pixel ID</label>
              <input
                type="text"
                value={platformConfig.facebookPixelId}
                onChange={(e) => setPlatformConfig(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                placeholder="XXXXXXXXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 text-sm"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-700">Maintenance Mode</p>
                <p className="text-sm text-slate-500">Disable access for all tenants</p>
              </div>
              <button
                onClick={() => setPlatformConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                className={`w-12 h-6 rounded-full transition-colors ${platformConfig.maintenanceMode ? 'bg-red-500' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${platformConfig.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onSave}
          disabled={isSavingSettings}
          className="px-6 py-3 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] hover:from-[#2BAEE8] hover:to-[#1A7FE8] text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {isSavingSettings ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsTab;
