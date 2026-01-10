import React from 'react';
import { Palette, Layers, Search, Globe } from 'lucide-react';

type ColorKey = 'primary' | 'secondary' | 'tertiary' | 'font';

interface ThemeColorsTabProps {
  themeColors: Record<ColorKey, string>;
  colorDrafts: Record<ColorKey, string>;
  searchHints: string;
  orderLanguage: string;
  onUpdateColor: (key: ColorKey, value: string) => void;
  onSetColorDraft: (key: ColorKey, value: string) => void;
  onUpdateSearchHints: (value: string) => void;
  onUpdateOrderLanguage: (value: string) => void;
}

const COLOR_GUIDE_CONFIG: Array<{
  key: ColorKey;
  label: string;
  helper: string;
}> = [
  {
    key: 'primary',
    label: 'Primary Accent',
    helper: 'Sidebar active state, admin CTAs, storefront hero buttons'
  },
  {
    key: 'secondary',
    label: 'Secondary Accent',
    helper: 'Warning chips, checkout highlights, floating badges'
  },
  {
    key: 'tertiary',
    label: 'Depth Accent',
    helper: 'Charts, outlines, subtle gradients'
  },
  {
    key: 'font',
    label: 'Global Font Color',
    helper: 'Header links, footer text, storefront typography'
  }
];

export const ThemeColorsTab: React.FC<ThemeColorsTabProps> = ({
  themeColors,
  colorDrafts,
  searchHints,
  orderLanguage,
  onUpdateColor,
  onSetColorDraft,
  onUpdateSearchHints,
  onUpdateOrderLanguage
}) => {
  return (
    <div className="space-y-8 max-w-4xl">
      {/* Theme Colors Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="font-bold text-2xl text-gray-800 mb-2">🎨 Theme Colors</h3>
        <p className="text-gray-500 text-sm">
          Customize your storefront and admin panel color palette to match your brand.
        </p>
      </div>

      {/* Colors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COLOR_GUIDE_CONFIG.map((f) => (
          <div
            key={f.key}
            className="group relative bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-300"
          >
            {/* Color Preview Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <input
                  type="color"
                  value={themeColors[f.key]}
                  onChange={(e) => onUpdateColor(f.key, e.target.value)}
                  className="w-16 h-16 rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
                  style={{ backgroundColor: themeColors[f.key] }}
                />
                {/* Gradient Preview Overlay */}
                <div
                  className="absolute inset-0 w-16 h-16 rounded-xl border-2 border-gray-200 shadow-md pointer-events-none"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors[f.key]} 0%, ${themeColors[f.key]}dd 50%, ${themeColors[f.key]}aa 100%)`,
                    mixBlendMode: 'multiply',
                    opacity: 0.3
                  }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 shadow flex items-center justify-center"
                  style={{ backgroundColor: themeColors[f.key] }}
                >
                  <Palette size={12} className="text-white drop-shadow" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-base">{f.label}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{f.helper}</p>
              </div>
            </div>

            {/* Hex Input */}
            <div className="relative mb-3">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-gray-200"
                style={{ backgroundColor: themeColors[f.key] }}
              ></div>
              <input
                type="text"
                value={colorDrafts[f.key]}
                onChange={(e) => onSetColorDraft(f.key, e.target.value)}
                onBlur={() => onUpdateColor(f.key, colorDrafts[f.key])}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm uppercase bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                placeholder="#000000"
              />
            </div>

            {/* Gradient Preview Samples */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 mb-2">Gradient Previews:</p>
              <div className="grid grid-cols-3 gap-2">
                <div
                  className="h-8 rounded-lg border border-gray-200"
                  style={{
                    background: `linear-gradient(to right, ${themeColors[f.key]}, ${themeColors[f.key]}dd)`
                  }}
                  title="Linear gradient"
                />
                <div
                  className="h-8 rounded-lg border border-gray-200"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors[f.key]}, ${themeColors.secondary || '#ec4899'})`
                  }}
                  title="Diagonal gradient"
                />
                <div
                  className="h-8 rounded-lg border border-gray-200"
                  style={{
                    background: `radial-gradient(circle, ${themeColors[f.key]}, ${themeColors[f.key]}88)`
                  }}
                  title="Radial gradient"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient Showcase Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mt-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
            <Layers size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Your Gradient Palette</h3>
            <p className="text-xs text-gray-500">
              Preview how your colors work together in various gradient combinations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary + Secondary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Primary + Secondary</p>
            <div
              className="h-24 rounded-xl shadow-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`
              }}
            >
              <p className="text-white font-semibold text-sm drop-shadow-lg">Hero Banner</p>
            </div>
          </div>

          {/* Primary + Tertiary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Primary + Tertiary</p>
            <div
              className="h-24 rounded-xl shadow-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.tertiary})`
              }}
            >
              <p className="text-white font-semibold text-sm drop-shadow-lg">CTA Button</p>
            </div>
          </div>

          {/* Secondary + Tertiary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Secondary + Tertiary</p>
            <div
              className="h-24 rounded-xl shadow-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(to right, ${themeColors.secondary}, ${themeColors.tertiary})`
              }}
            >
              <p className="text-white font-semibold text-sm drop-shadow-lg">Badge/Tag</p>
            </div>
          </div>

          {/* Radial Primary */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Radial Primary</p>
            <div
              className="h-24 rounded-xl shadow-lg flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at top left, ${themeColors.primary}, ${themeColors.primary}88)`
              }}
            >
              <p className="text-white font-semibold text-sm drop-shadow-lg">Card Background</p>
            </div>
          </div>

          {/* Multi-color Gradient */}
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs font-medium text-gray-600">Multi-color Brand Gradient</p>
            <div
              className="h-32 rounded-xl shadow-lg flex items-center justify-center"
              style={{
                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 50%, ${themeColors.tertiary} 100%)`
              }}
            >
              <p className="text-white font-bold text-lg drop-shadow-lg">Premium Feature Section</p>
            </div>
          </div>
        </div>

        {/* Gradient CSS Code Examples */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-3">💡 CSS Gradient Examples:</p>
          <div className="space-y-2 text-xs font-mono">
            <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
              <span className="text-gray-500">/* Linear: */</span> background: linear-gradient(135deg,{' '}
              {themeColors.primary}, {themeColors.secondary});
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
              <span className="text-gray-500">/* Radial: */</span> background: radial-gradient(circle,{' '}
              {themeColors.primary}, {themeColors.tertiary});
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
              <span className="text-gray-500">/* Multi: */</span> background: linear-gradient(to right,{' '}
              {themeColors.primary}, {themeColors.secondary}, {themeColors.tertiary});
            </div>
          </div>
        </div>
      </div>

      {/* Search Hints Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow">
            <Search size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Search Hints</h3>
            <p className="text-xs text-gray-500">Suggest keywords to help customers find products</p>
          </div>
        </div>
        <input
          type="text"
          value={searchHints}
          onChange={(e) => onUpdateSearchHints(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400 transition-all"
          placeholder="gadget, gift, toy, electronics..."
        />
      </div>

      {/* Order Language Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow">
            <Globe size={18} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-800">Order Language</h3>
            <p className="text-xs text-gray-500">
              Choose the language for order notifications and invoices
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['English', 'Bangla'].map((l) => (
            <label
              key={l}
              className={`flex items-center gap-3 border-2 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                orderLanguage === l
                  ? 'border-green-500 bg-green-50 shadow-sm'
                  : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
              }`}
            >
              <input
                type="radio"
                name="lang"
                className="w-5 h-5 text-green-600 focus:ring-green-500"
                checked={orderLanguage === l}
                onChange={() => onUpdateOrderLanguage(l)}
              />
              <span
                className={`font-semibold ${
                  orderLanguage === l ? 'text-green-700' : 'text-gray-700'
                }`}
              >
                {l === 'Bangla' ? '🇧🇩 ' : '🇬🇧 '}
                {l}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
