import React, { useState } from 'react';
import { 
  Palette, Moon, Sun, Save, Loader2, RotateCcw, 
  Eye, Building2, Check
} from 'lucide-react';
import { TenantThemeConfig } from './types';

interface ThemeConfigTabProps {
  defaultTheme: TenantThemeConfig;
  onSaveTheme: (theme: TenantThemeConfig) => Promise<void>;
  tenants: { id: string; name: string; subdomain: string }[];
  onApplyToTenant: (tenantId: string, theme: TenantThemeConfig) => Promise<void>;
  onApplyToAll: (theme: TenantThemeConfig) => Promise<void>;
}

type ThemeColorKey = 'primaryColor' | 'secondaryColor' | 'tertiaryColor' | 'fontColor' | 'hoverColor' | 'surfaceColor' | 'adminBgColor' | 'adminInputBgColor' | 'adminBorderColor' | 'adminFocusColor';

const defaultThemeColors: TenantThemeConfig = {
  primaryColor: '#22c55e',
  secondaryColor: '#ec4899',
  tertiaryColor: '#9333ea',
  fontColor: '#0f172a',
  hoverColor: '#f97316',
  surfaceColor: '#e2e8f0',
  darkMode: false,
  adminBgColor: '#030407',
  adminInputBgColor: '#0f172a',
  adminBorderColor: '#ffffff',
  adminFocusColor: '#f87171'
};

const themeColorGuides: Array<{ key: ThemeColorKey; label: string; helper: string }> = [
  { key: 'primaryColor', label: 'Primary Accent', helper: 'Sidebar active state, admin CTAs, storefront hero buttons' },
  { key: 'secondaryColor', label: 'Secondary Accent', helper: 'Warning chips, checkout highlights, floating badges' },
  { key: 'tertiaryColor', label: 'Depth Accent', helper: 'Charts, outlines, subtle gradients' },
  { key: 'fontColor', label: 'Global Font Color', helper: 'Header links, footer text, storefront typography' },
  { key: 'hoverColor', label: 'Hover Accent', helper: 'Header & footer hover states, interactive link highlights' },
  { key: 'surfaceColor', label: 'Surface Glow', helper: 'Footer background wash, elevated cards, wishlist buttons' },
  { key: 'adminBgColor', label: 'Admin Background', helper: 'Admin panel main background color' },
  { key: 'adminInputBgColor', label: 'Admin Input Background', helper: 'Admin input fields, select boxes, text areas background' },
  { key: 'adminBorderColor', label: 'Admin Border Color', helper: 'Admin panel borders, dividers, outlines' },
  { key: 'adminFocusColor', label: 'Admin Focus Color', helper: 'Focus ring color for admin inputs' },
];

const ThemeConfigTab: React.FC<ThemeConfigTabProps> = ({
  defaultTheme,
  onSaveTheme,
  tenants,
  onApplyToTenant,
  onApplyToAll
}) => {
  const [theme, setTheme] = useState<TenantThemeConfig>(defaultTheme || defaultThemeColors);
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [showTenantSelector, setShowTenantSelector] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveTheme(theme);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToSelected = async () => {
    if (selectedTenants.length === 0) return;
    setIsApplying(true);
    try {
      for (const tenantId of selectedTenants) {
        await onApplyToTenant(tenantId, theme);
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
      await onApplyToAll(theme);
    } finally {
      setIsApplying(false);
    }
  };

  const handleReset = () => {
    setTheme(defaultThemeColors);
  };

  const updateColor = (key: ThemeColorKey, value: string) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Theme Configuration</h2>
          <p className="text-slate-500 mt-1">Configure default theme for all tenants</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Default Theme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Theme Colors */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Palette className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Theme Colors</h3>
                <p className="text-sm text-slate-500">Customize storefront and admin colors</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {themeColorGuides.map((field) => (
                <div key={field.key} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl">
                  <input
                    type="color"
                    value={theme[field.key] || defaultThemeColors[field.key]}
                    onChange={(e) => updateColor(field.key, e.target.value)}
                    className="w-12 h-12 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{field.label}</p>
                    <p className="text-xs text-slate-500 truncate">{field.helper}</p>
                    <input
                      type="text"
                      value={theme[field.key] || ''}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="mt-1 w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dark Mode Toggle */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme.darkMode ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <p className="font-medium text-slate-700">Dark Mode</p>
                    <p className="text-sm text-slate-500">Enable dark mode for admin panel</p>
                  </div>
                </div>
                <button
                  onClick={() => setTheme(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                  className={`w-12 h-6 rounded-full transition-colors ${theme.darkMode ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${theme.darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview & Apply */}
        <div className="space-y-4">
          {/* Preview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Preview</h3>
            </div>
            <div 
              className="rounded-xl p-4 space-y-3"
              style={{ backgroundColor: theme.surfaceColor }}
            >
              <div 
                className="h-10 rounded-lg flex items-center px-3 text-sm font-medium"
                style={{ backgroundColor: theme.primaryColor, color: '#fff' }}
              >
                Primary Button
              </div>
              <div 
                className="h-10 rounded-lg flex items-center px-3 text-sm font-medium"
                style={{ backgroundColor: theme.secondaryColor, color: '#fff' }}
              >
                Secondary Button
              </div>
              <div 
                className="h-10 rounded-lg flex items-center px-3 text-sm border"
                style={{ 
                  borderColor: theme.tertiaryColor, 
                  color: theme.fontColor,
                  backgroundColor: '#fff'
                }}
              >
                Outlined Element
              </div>
              <p className="text-sm" style={{ color: theme.fontColor }}>
                Sample text with font color
              </p>
              <p 
                className="text-sm cursor-pointer"
                style={{ color: theme.hoverColor }}
              >
                Hover accent text →
              </p>
            </div>
          </div>

          {/* Apply to Tenants */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-900">Apply Theme</h3>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleApplyToAll}
                disabled={isApplying}
                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
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
                <div className="mt-3 max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
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
        </div>
      </div>
    </div>
  );
};

export default ThemeConfigTab;
