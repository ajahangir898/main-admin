import React from 'react';
import type { WebsiteConfig } from '../../types';

interface ChatSettingsTabProps {
  websiteConfiguration: WebsiteConfig;
  onUpdateConfig: (config: Partial<WebsiteConfig>) => void;
}

export const ChatSettingsTab: React.FC<ChatSettingsTabProps> = ({
  websiteConfiguration,
  onUpdateConfig
}) => {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="font-bold text-xl mb-2">Chat Settings</h3>
        <p className="text-gray-500 text-sm mb-6">Configure live chat for your store</p>
      </div>

      {/* Enable Chat Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
        <div>
          <p className="font-semibold text-gray-800">Enable Live Chat</p>
          <p className="text-sm text-gray-500">Allow customers to chat with you</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={websiteConfiguration.chatEnabled ?? false}
            onChange={(e) => onUpdateConfig({ chatEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>

      {/* Welcome Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
          placeholder="Hi! How can we help?"
          value={websiteConfiguration.chatGreeting || ''}
          onChange={(e) => onUpdateConfig({ chatGreeting: e.target.value })}
        />
        <p className="text-xs text-gray-500 mt-1">Appears when chat opens</p>
      </div>

      {/* Offline Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Offline Message</label>
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
          placeholder="We're offline. Leave a message!"
          value={websiteConfiguration.chatOfflineMessage || ''}
          onChange={(e) => onUpdateConfig({ chatOfflineMessage: e.target.value })}
        />
      </div>

      {/* Support Hours */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Support Hours From
          </label>
          <input
            type="time"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
            value={websiteConfiguration.chatSupportHours?.from || '09:00'}
            onChange={(e) =>
              onUpdateConfig({
                chatSupportHours: {
                  ...(websiteConfiguration.chatSupportHours || {}),
                  from: e.target.value
                }
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Support Hours To
          </label>
          <input
            type="time"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
            value={websiteConfiguration.chatSupportHours?.to || '18:00'}
            onChange={(e) =>
              onUpdateConfig({
                chatSupportHours: {
                  ...(websiteConfiguration.chatSupportHours || {}),
                  to: e.target.value
                }
              })
            }
          />
        </div>
      </div>

      {/* WhatsApp Fallback Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50">
        <div>
          <p className="font-semibold text-gray-800">WhatsApp Fallback</p>
          <p className="text-sm text-gray-500">Redirect to WhatsApp when chat disabled</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={websiteConfiguration.chatWhatsAppFallback ?? false}
            onChange={(e) => onUpdateConfig({ chatWhatsAppFallback: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
        </label>
      </div>
    </div>
  );
};
