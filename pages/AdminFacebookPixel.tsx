
import React, { useState, useEffect } from 'react';
import { Facebook, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { FacebookPixelConfig } from '../types';

interface AdminFacebookPixelProps {
    onBack: () => void;
    config: FacebookPixelConfig;
    onSave: (config: FacebookPixelConfig) => void;
}

const AdminFacebookPixel: React.FC<AdminFacebookPixelProps> = ({ onBack, config, onSave }) => {
    const [pixelId, setPixelId] = useState(config.pixelId);
    const [accessToken, setAccessToken] = useState(config.accessToken);
    const [enableTestEvent, setEnableTestEvent] = useState(config.enableTestEvent);
    const [isEnabled, setIsEnabled] = useState(config.isEnabled);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    useEffect(() => {
        setPixelId(config.pixelId);
        setAccessToken(config.accessToken);
        setEnableTestEvent(config.enableTestEvent);
        setIsEnabled(config.isEnabled);
    }, [config.pixelId, config.accessToken, config.enableTestEvent, config.isEnabled]);

    const handleSave = () => {
        if (isEnabled && !pixelId.trim()) {
            alert('Facebook Pixel ID is required while tracking is enabled.');
            return;
        }
        const payload: FacebookPixelConfig = {
            pixelId: pixelId.trim(),
            accessToken: accessToken.trim(),
            enableTestEvent,
            isEnabled,
        };
        onSave(payload);
        setStatusMessage('Facebook Pixel settings saved. Changes apply instantly on storefront.');
        setTimeout(() => setStatusMessage(null), 4000);
    };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in p-2">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full transition">
                <ArrowLeft size={20} className="text-gray-600"/>
            </button>
            <h2 className="text-xl font-bold text-gray-900">Facebook Pixel</h2>
        </div>

        {/* Info Section */}
        <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 border-4 border-blue-100 shadow-sm ring-1 ring-blue-500">
                <Facebook size={24} className="text-white" fill="white" />
            </div>
            <div className="pt-1 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">Facebook Pixel Tracking</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isEnabled && pixelId ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isEnabled && pixelId ? <><CheckCircle size={12} /> Live</> : <><AlertTriangle size={12} /> Inactive</>}
                    </span>
                </div>
                <p className="text-sm text-gray-500">Connect Meta Pixel + Conversions API so you can track checkout conversions and optimize ad spend.</p>
            </div>
        </div>

        {statusMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle size={18} /> {statusMessage}
            </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6 max-w-3xl pt-2">
            <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                <div>
                    <p className="font-semibold text-gray-800">Enable tracking</p>
                    <p className="text-sm text-gray-500">Turn this off to pause all pixel events without losing credentials.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} />
                    <span className={`w-14 h-7 flex items-center rounded-full px-1 transition ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <span className={`bg-white w-6 h-6 rounded-full shadow transform transition ${isEnabled ? 'translate-x-7' : ''}`}></span>
                    </span>
                </label>
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Facebook Pixel Id"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm text-gray-700 placeholder-gray-400 shadow-sm"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                />
            </div>

            <div>
                <textarea
                    placeholder="Facebook Pixel Access Token"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400 text-sm text-gray-700 placeholder-gray-400 shadow-sm min-h-[120px] resize-none align-top"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="testEvent"
                    className="w-5 h-5 border-2 border-gray-400 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={enableTestEvent}
                    onChange={(e) => setEnableTestEvent(e.target.checked)}
                />
                <label htmlFor="testEvent" className="text-sm text-gray-600 cursor-pointer select-none">
                    Enable Test Event
                </label>
            </div>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-800 mb-1">Need this info?</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Pixel ID can be found inside Meta Events Manager.</li>
                    <li>Access token is required if you plan to stream server-side events via Conversions API.</li>
                    <li>Use the Test Event toggle while verifying installation—remember to disable it afterwards.</li>
                </ul>
            </div>

            <button
                onClick={handleSave}
                className="w-full btn-search justify-center py-3 rounded-md font-semibold"
            >
                Save
            </button>
        </div>
    </div>
  );
};

export default AdminFacebookPixel;
