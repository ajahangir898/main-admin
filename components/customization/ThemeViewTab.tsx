import React from 'react';
import { Eye } from 'lucide-react';
import type { WebsiteConfig } from '../../types';

interface ThemeViewTabProps {
  websiteConfiguration: WebsiteConfig;
  onUpdateConfig: (config: Partial<WebsiteConfig>) => void;
}

const THEME_VIEW_SECTIONS: Array<{
  key: string;
  title: string;
  count: number;
  hasNone?: boolean;
}> = [
  { key: 'headerStyle', title: 'Header Style', count: 4, hasNone: false },
  { key: 'footerStyle', title: 'Footer Style', count: 4, hasNone: false },
  { key: 'productCardStyle', title: 'Product Card Style', count: 4, hasNone: false },
  { key: 'productDetailStyle', title: 'Product Detail Style', count: 3, hasNone: false },
  { key: 'categoryPageStyle', title: 'Category Page Style', count: 3, hasNone: false },
  { key: 'checkoutPageStyle', title: 'Checkout Page Style', count: 3, hasNone: false }
];

export const ThemeViewTab: React.FC<ThemeViewTabProps> = ({
  websiteConfiguration,
  onUpdateConfig
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {THEME_VIEW_SECTIONS.map((section) => (
        <div
          key={section.title}
          className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200"
        >
          <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">{section.title}</h3>
          <div className="space-y-2">
            {/* Optional "None" option */}
            {section.hasNone && (
              <div
                className={`border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white transition-colors cursor-pointer ${
                  !websiteConfiguration[section.key as keyof WebsiteConfig]
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name={section.title}
                    className="w-5 h-5 text-green-600 cursor-pointer"
                    checked={!websiteConfiguration[section.key as keyof WebsiteConfig]}
                    onChange={() => onUpdateConfig({ [section.key]: '' })}
                  />
                  <span className="font-semibold text-gray-700">None</span>
                </div>
                <button className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 hover:bg-green-700 transition-colors">
                  <Eye size={14} />
                  View Site
                </button>
              </div>
            )}

            {/* Style options */}
            {Array.from({ length: section.count }).map((_, index) => {
              const styleValue = `style${index + 1}`;
              const currentValue =
                websiteConfiguration[section.key as keyof WebsiteConfig] || 'style1';

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white transition-colors cursor-pointer ${
                    currentValue === styleValue
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={section.title}
                      className="w-5 h-5 text-green-600 cursor-pointer"
                      checked={currentValue === styleValue}
                      onChange={() => onUpdateConfig({ [section.key]: styleValue })}
                    />
                    <span className="font-semibold text-gray-700">
                      {section.title.split(' ')[0]} {index + 1}
                    </span>
                  </div>
                  <button className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 hover:bg-green-700 transition-colors">
                    <Eye size={14} />
                    View demo
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
