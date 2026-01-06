import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Code, ExternalLink } from 'lucide-react';
import { DataService } from '../services/DataService';

const dataService = DataService;

interface GTMConfig {
  containerId: string;
  isEnabled: boolean;
  enableDataLayer: boolean;
}

interface AdminGTMProps {
  onBack: () => void;
  tenantId?: string;
}

const AdminGTM: React.FC<AdminGTMProps> = ({ onBack, tenantId }) => {
  const [containerId, setContainerId] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [enableDataLayer, setEnableDataLayer] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await dataService.get<GTMConfig>('gtm_config', {
          containerId: '',
          isEnabled: false,
          enableDataLayer: true
        }, tenantId);
        
        if (config) {
          setContainerId(config.containerId || '');
          setIsEnabled(config.isEnabled || false);
          setEnableDataLayer(config.enableDataLayer ?? true);
        }
      } catch (error) {
        console.warn('Failed to load GTM config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [tenantId]);

  const handleSave = async () => {
    if (isEnabled && !containerId.trim()) {
      alert('GTM Container ID is required while tracking is enabled.');
      return;
    }
    
    // Validate GTM ID format (GTM-XXXXXXX)
    if (containerId.trim() && !containerId.trim().match(/^GTM-[A-Z0-9]+$/i)) {
      alert('Invalid GTM Container ID format. It should be like GTM-XXXXXXX');
      return;
    }

    setIsSaving(true);
    try {
      const payload: GTMConfig = {
        containerId: containerId.trim().toUpperCase(),
        isEnabled,
        enableDataLayer
      };
      await dataService.save('gtm_config', payload, tenantId);
      setStatusMessage('Google Tag Manager settings saved. Changes apply instantly on storefront.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (error) {
      console.error('Failed to save GTM config:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-2 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="h-24 bg-gray-200 rounded mb-6"></div>
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in p-2">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
          <ArrowLeft size={20} className="text-gray-600"/>
        </button>
        <h2 className="text-xl font-bold text-gray-900">Google Tag Manager</h2>
      </div>

      {/* Info Section */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 border-4 border-blue-100 shadow-sm ring-1 ring-blue-400">
          <Code size={24} className="text-white" />
        </div>
        <div className="pt-1 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-medium text-gray-900">Google Tag Manager</h3>
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isEnabled && containerId ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {isEnabled && containerId ? <><CheckCircle size={12} /> Live</> : <><AlertTriangle size={12} /> Inactive</>}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Connect Google Tag Manager to manage all your marketing tags, analytics, and tracking pixels in one place without editing code.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} /> {statusMessage}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-6 max-w-3xl pt-2">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div>
            <p className="font-semibold text-gray-800">Enable GTM</p>
            <p className="text-sm text-gray-500">Turn this off to pause GTM without losing your container ID.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={isEnabled} 
              onChange={(e) => setIsEnabled(e.target.checked)} 
            />
            <span className={`w-14 h-7 flex items-center rounded-full px-1 transition ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`bg-white w-6 h-6 rounded-full shadow transform transition ${isEnabled ? 'translate-x-7' : ''}`}></span>
            </span>
          </label>
        </div>

        {/* Container ID Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">GTM Container ID</label>
          <input
            type="text"
            placeholder="GTM-XXXXXXX"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-700 placeholder-gray-400 shadow-sm font-mono"
            value={containerId}
            onChange={(e) => setContainerId(e.target.value.toUpperCase())}
          />
          <p className="text-xs text-gray-500 mt-1">
            Find your Container ID in GTM dashboard → Admin → Container Settings
          </p>
        </div>

        {/* Data Layer Toggle */}
        <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
          <div>
            <p className="font-semibold text-gray-800">Enable Enhanced Data Layer</p>
            <p className="text-sm text-gray-500">Push e-commerce events (add to cart, purchase, etc.) to dataLayer for advanced tracking.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only" 
              checked={enableDataLayer} 
              onChange={(e) => setEnableDataLayer(e.target.checked)} 
            />
            <span className={`w-14 h-7 flex items-center rounded-full px-1 transition ${enableDataLayer ? 'bg-green-500' : 'bg-gray-300'}`}>
              <span className={`bg-white w-6 h-6 rounded-full shadow transform transition ${enableDataLayer ? 'translate-x-7' : ''}`}></span>
            </span>
          </label>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <Code size={16} /> What can you do with GTM?
          </h4>
          <ul className="text-sm text-blue-700 space-y-1.5">
            <li>• Add Google Analytics 4, Facebook Pixel, TikTok Pixel without code</li>
            <li>• Track custom events (button clicks, form submissions, scroll depth)</li>
            <li>• Set up conversion tracking for Google Ads, Meta Ads</li>
            <li>• A/B testing and personalization tools</li>
            <li>• Remarketing and audience building</li>
          </ul>
          <a 
            href="https://tagmanager.google.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Open Google Tag Manager <ExternalLink size={14} />
          </a>
        </div>

        {/* Available Events Info */}
        {enableDataLayer && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Available dataLayer Events</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <code className="bg-white px-2 py-1 rounded border text-gray-600">view_item</code>
              <code className="bg-white px-2 py-1 rounded border text-gray-600">add_to_cart</code>
              <code className="bg-white px-2 py-1 rounded border text-gray-600">remove_from_cart</code>
              <code className="bg-white px-2 py-1 rounded border text-gray-600">begin_checkout</code>
              <code className="bg-white px-2 py-1 rounded border text-gray-600">purchase</code>
              <code className="bg-white px-2 py-1 rounded border text-gray-600">search</code>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminGTM;
