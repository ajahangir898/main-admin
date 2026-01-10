import React, { useRef } from 'react';
import {
  ImageIcon,
  Globe,
  Plus,
  Trash2,
  Eye
} from 'lucide-react';
import type { WebsiteConfig, FooterLink, SocialLink } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
type ImageField = 'logo' | 'headerLogo' | 'footerLogo' | 'favicon';
type ContactField = 'addresses' | 'emails' | 'phones';
type FooterLinkField =
  | 'footerAboutLinks'
  | 'footerAccountLinks'
  | 'footerHelpLinks'
  | 'footerCategoryLinks';

interface WebsiteInfoTabProps {
  websiteConfiguration: WebsiteConfig;
  logo: string;
  onUpdateConfig: (config: Partial<WebsiteConfig>) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>, field: ImageField) => Promise<void>;
  onRemoveImage: (field: ImageField) => void;
}

const SOCIAL_PLATFORM_OPTIONS = [
  'Facebook',
  'Instagram',
  'Twitter',
  'LinkedIn',
  'YouTube',
  'TikTok',
  'Pinterest',
  'WhatsApp'
];

const FOOTER_LINK_SECTIONS: Array<{
  field: FooterLinkField;
  title: string;
  helper: string;
}> = [
  { field: 'footerAboutLinks', title: 'About Links', helper: 'Company, team, careers...' },
  { field: 'footerAccountLinks', title: 'Account Links', helper: 'Login, cart, wishlist...' },
  { field: 'footerHelpLinks', title: 'Help Links', helper: 'Support, FAQs, returns...' },
  { field: 'footerCategoryLinks', title: 'Category Links', helper: 'Product categories...' }
];

export const WebsiteInfoTab: React.FC<WebsiteInfoTabProps> = ({
  websiteConfiguration,
  logo,
  onUpdateConfig,
  onImageUpload,
  onRemoveImage
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerLogoInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Contact field handlers
  const addContactItem = (field: ContactField): void => {
    onUpdateConfig({ [field]: [...websiteConfiguration[field], ''] });
  };

  const updateContactItem = (field: ContactField, index: number, value: string): void => {
    const updated = [...websiteConfiguration[field]];
    updated[index] = value;
    onUpdateConfig({ [field]: updated });
  };

  const removeContactItem = (field: ContactField, index: number): void => {
    const updated = websiteConfiguration[field].filter((_, i) => i !== index);
    onUpdateConfig({ [field]: updated });
  };

  // Social link handlers
  const addSocialLink = (): void => {
    const newLink: SocialLink = {
      id: Date.now().toString(),
      platform: 'Facebook',
      url: ''
    };
    onUpdateConfig({
      socialLinks: [...websiteConfiguration.socialLinks, newLink]
    });
  };

  const updateSocialLink = (
    index: number,
    field: keyof SocialLink,
    value: string
  ): void => {
    const updated = [...websiteConfiguration.socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    onUpdateConfig({ socialLinks: updated });
  };

  const removeSocialLink = (index: number): void => {
    const updated = websiteConfiguration.socialLinks.filter((_, i) => i !== index);
    onUpdateConfig({ socialLinks: updated });
  };

  // Footer link handlers
  const addFooterLink = (field: FooterLinkField): void => {
    const newLink: FooterLink = {
      id: Date.now().toString(),
      label: '',
      url: ''
    };
    const current = (websiteConfiguration[field] as FooterLink[]) || [];
    onUpdateConfig({ [field]: [...current, newLink] });
  };

  const updateFooterLink = (
    field: FooterLinkField,
    index: number,
    prop: keyof FooterLink,
    value: string
  ): void => {
    const current = (websiteConfiguration[field] as FooterLink[]) || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [prop]: value };
    onUpdateConfig({ [field]: updated });
  };

  const removeFooterLink = (field: FooterLinkField, index: number): void => {
    const current = (websiteConfiguration[field] as FooterLink[]) || [];
    const updated = current.filter((_, i) => i !== index);
    onUpdateConfig({ [field]: updated });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Logos & Basic Info */}
      <div className="space-y-6">
        {/* Logo Upload Sections */}
        {[
          { ref: logoInputRef, logoSrc: logo, field: 'logo' as const, name: 'Primary Store Logo (Fallback)' },
          {
            ref: headerLogoInputRef,
            logoSrc: websiteConfiguration.headerLogo,
            field: 'headerLogo' as const,
            name: 'Header Logo Override'
          },
          {
            ref: footerLogoInputRef,
            logoSrc: websiteConfiguration.footerLogo,
            field: 'footerLogo' as const,
            name: 'Footer Logo Override'
          }
        ].map((item) => (
          <div
            key={item.name}
            className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center"
          >
            <div className="flex flex-col items-center gap-3">
              <ImageIcon size={32} className="text-gray-400" />
              <p className="text-sm font-bold text-gray-700">{item.name}</p>
              {item.logoSrc ? (
                <img
                  src={normalizeImageUrl(item.logoSrc)}
                  alt={item.name}
                  className="h-12 max-w-[200px] object-contain my-2 border rounded p-1 bg-gray-50"
                />
              ) : (
                <p className="text-xs text-gray-400">No logo uploaded</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => item.ref.current?.click()}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold"
                >
                  Select Image
                </button>
                {item.logoSrc && (
                  <button
                    onClick={() => onRemoveImage(item.field)}
                    className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={item.ref}
                onChange={(e) => onImageUpload(e, item.field)}
                className="hidden"
                accept="image/*"
              />
            </div>
          </div>
        ))}

        {/* Favicon Upload */}
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Globe size={32} className="text-gray-400" />
            <p className="text-sm font-bold text-gray-700">Favicon (32x32px)</p>
            {websiteConfiguration.favicon && (
              <img
                src={websiteConfiguration.favicon}
                alt="Favicon"
                className="w-8 h-8 object-contain my-2"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => faviconInputRef.current?.click()}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold"
              >
                Select Image
              </button>
              {websiteConfiguration.favicon && (
                <button
                  onClick={() => onRemoveImage('favicon')}
                  className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-bold"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              type="file"
              ref={faviconInputRef}
              onChange={(e) => onImageUpload(e, 'favicon')}
              className="hidden"
              accept="image/*"
            />
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website Name*</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
              value={websiteConfiguration.websiteName}
              onChange={(e) => onUpdateConfig({ websiteName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Description
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
              value={websiteConfiguration.shortDescription}
              onChange={(e) => onUpdateConfig({ shortDescription: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Whatsapp Number
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
              value={websiteConfiguration.whatsappNumber}
              onChange={(e) => onUpdateConfig({ whatsappNumber: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Admin Notice Text
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
              placeholder="e.g., Easy return policy..."
              value={websiteConfiguration.adminNoticeText || ''}
              onChange={(e) => onUpdateConfig({ adminNoticeText: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">
              Scrolling ticker at top of store header.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Contact & Footer Links */}
      <div className="space-y-6">
        {/* Contact Information */}
        {(['addresses', 'emails', 'phones'] as const).map((field) => (
          <div key={field} className="space-y-2">
            <button
              onClick={() => addContactItem(field)}
              className="bg-green-600 text-white w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              Add New {field.slice(0, -1)}
            </button>
            {websiteConfiguration[field].map((value, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateContactItem(field, index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={() => removeContactItem(field, index)}
                  className="bg-red-500 text-white p-2 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Social Links */}
        <div className="space-y-2">
          <button
            onClick={addSocialLink}
            className="bg-green-600 text-white w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
          >
            <Plus size={16} />
            Add Social Link
          </button>
          {websiteConfiguration.socialLinks.map((link, index) => (
            <div key={link.id} className="bg-gray-50 border p-3 rounded-lg space-y-2 relative">
              <div className="flex gap-2">
                <select
                  value={link.platform}
                  onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                  className="w-1/3 text-sm border rounded px-2 py-1"
                >
                  {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                  className="flex-1 text-sm border rounded px-2 py-1"
                  placeholder="URL"
                />
              </div>
              <button
                onClick={() => removeSocialLink(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer Links */}
        <div className="space-y-4">
          {FOOTER_LINK_SECTIONS.map((section) => (
            <div
              key={section.field}
              className="border rounded-xl p-4 space-y-3 bg-white/60"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{section.title}</p>
                  <p className="text-xs text-gray-500">{section.helper}</p>
                </div>
                <button
                  onClick={() => addFooterLink(section.field)}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold flex items-center gap-1 self-start"
                >
                  <Plus size={14} />
                  Add Link
                </button>
              </div>
              {((websiteConfiguration[section.field] as FooterLink[]) || []).length === 0 && (
                <p className="text-xs text-gray-400">No links yet.</p>
              )}
              {((websiteConfiguration[section.field] as FooterLink[]) || []).map(
                (link, index) => (
                  <div
                    key={link.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2"
                  >
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) =>
                        updateFooterLink(section.field, index, 'label', e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg text-sm"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) =>
                        updateFooterLink(section.field, index, 'url', e.target.value)
                      }
                      className="px-3 py-2 border rounded-lg text-sm"
                      placeholder="https://"
                    />
                    <button
                      onClick={() => removeFooterLink(section.field, index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3 pt-4 border-t">
          {[
            { key: 'showMobileHeaderCategory', label: 'isShowMobileHeaderCategoryMenu' },
            { key: 'showNewsSlider', label: 'Is Show News Slider' },
            { key: 'hideCopyright', label: 'Hide Copyright Section' },
            { key: 'hideCopyrightText', label: 'Hide Copyright Text' },
            { key: 'showPoweredBy', label: 'Powered by SystemNext IT' }
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="w-5 h-5 text-green-600 rounded"
                checked={websiteConfiguration[item.key as keyof WebsiteConfig] as boolean}
                onChange={(e) => onUpdateConfig({ [item.key]: e.target.checked })}
              />
              <span className="text-sm font-medium">{item.label}</span>
            </label>
          ))}
          {websiteConfiguration.showNewsSlider && (
            <div className="ml-8 border rounded p-2 text-sm bg-gray-50">
              <p className="text-xs text-gray-500 mb-1">Header Slider Text</p>
              <textarea
                className="w-full bg-transparent outline-none resize-none"
                rows={2}
                value={websiteConfiguration.headerSliderText}
                onChange={(e) => onUpdateConfig({ headerSliderText: e.target.value })}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Flash Sale Counter</p>
              <p className="text-xs text-gray-500">Show countdown pill beside Flash Sales.</p>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateConfig({ showFlashSaleCounter: !websiteConfiguration.showFlashSaleCounter })
              }
              className={`relative inline-flex items-center rounded-full border px-1 py-0.5 text-xs font-bold ${
                websiteConfiguration.showFlashSaleCounter
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
                  : 'bg-gray-100 text-gray-500 border-gray-300'
              }`}
            >
              <span
                className={`px-3 py-1 rounded-full ${
                  websiteConfiguration.showFlashSaleCounter ? 'bg-white shadow' : 'opacity-50'
                }`}
              >
                {websiteConfiguration.showFlashSaleCounter ? 'On' : 'Off'}
              </span>
            </button>
          </div>
          <div className="pt-2">
            <label className="block text-xs text-gray-500 mb-1">Branding Text</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded text-sm"
              value={websiteConfiguration.brandingText}
              onChange={(e) => onUpdateConfig({ brandingText: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
