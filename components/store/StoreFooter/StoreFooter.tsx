import React from 'react';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Globe,
  ArrowRight
} from 'lucide-react';
import './StoreFooter.css';
import { WebsiteConfig } from '../../../types';
import { normalizeImageUrl } from '../../../utils/imageUrlHelper';

const buildWhatsAppLink = (rawNumber?: string | null) => {
  if (!rawNumber) return null;
  const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
  return sanitized ? `https://wa.me/${sanitized}` : null;
};

export interface StoreFooterProps {
  websiteConfig?: WebsiteConfig;
  logo?: string | null;
  onOpenChat?: () => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ websiteConfig, logo, onOpenChat }) => {
  const resolveSocialIcon = (platform?: string): React.ReactNode => {
    const key = platform?.toLowerCase() || '';
    if (key.includes('facebook') || key === 'fb') return <Facebook size={18} className="text-current" />;
    if (key.includes('instagram') || key === 'ig') return <Instagram size={18} className="text-current" />;
    if (key.includes('twitter') || key === 'x') return <Twitter size={18} className="text-current" />;
    if (key.includes('youtube') || key.includes('yt')) return <Youtube size={18} className="text-current" />;
    if (key.includes('linkedin')) return <Linkedin size={18} className="text-current" />;
    if (key.includes('whatsapp') || key.includes('messenger'))
      return <MessageCircle size={18} className="text-current" />;
    return <Globe size={18} className="text-current" />;
  };

  const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
  const chatEnabled = websiteConfig?.chatEnabled ?? true;
  const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;
  const resolvedFooterLogo = websiteConfig?.footerLogo || websiteConfig?.favicon || logo || null;

  const floatingChatButton = (() => {
    const baseClasses =
      'hidden md:flex fixed bottom-8 right-8 w-16 h-16 items-center justify-center rounded-full transition-transform duration-200 hover:-translate-y-1 hover:scale-105 z-40';
    const chatIcon = <MessageCircle size={28} strokeWidth={2} className="text-white" />;

    if (chatEnabled && onOpenChat) {
      return (
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Open live chat"
          className={`${baseClasses} store-footer-chat-gradient`}
        >
          {chatIcon}
        </button>
      );
    }
    if (chatFallbackLink) {
      return (
        <a
          href={chatFallbackLink}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className={`${baseClasses} store-footer-chat-gradient-whatsapp`}
        >
          {chatIcon}
        </a>
      );
    }
    return null;
  })();

  return (
    <>
      <footer className="store-footer store-footer-minheight surface-panel bg-white border-t border-gray-100 mt-auto">
        {/* Mobile Footer */}
        <div className="md:hidden px-4 py-8">
          {/* Logo & Description */}
          <div className="text-center mb-8">
            {resolvedFooterLogo ? (
              <img
                src={normalizeImageUrl(resolvedFooterLogo)}
                alt={`${websiteConfig?.websiteName || 'Store'} logo`}
                width={112}
                height={112}
                className="h-28 object-contain mx-auto mb-4"
              />
            ) : (
              <h3 className="text-2xl font-black text-gray-900 mb-3">
                {websiteConfig?.websiteName || 'YourShop'}
              </h3>
            )}
            {websiteConfig?.shortDescription && (
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                {websiteConfig.shortDescription}
              </p>
            )}
          </div>

          {/* Contact Cards - Horizontal Scroll */}
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-hide">
            {websiteConfig?.phones?.[0] && (
              <a
                href={`tel:${websiteConfig.phones[0]}`}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center">
                  <Phone size={18} className="text-theme-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Call Us</p>
                  <p className="text-sm font-bold text-gray-800">{websiteConfig.phones[0]}</p>
                </div>
              </a>
            )}
            {websiteConfig?.emails?.[0] && (
              <a
                href={`mailto:${websiteConfig.emails[0]}`}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Mail size={18} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Email</p>
                  <p className="text-sm font-bold text-gray-800 truncate max-w-[140px]">
                    {websiteConfig.emails[0]}
                  </p>
                </div>
              </a>
            )}
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3.5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <MessageCircle size={18} className="text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">WhatsApp</p>
                  <p className="text-sm font-bold text-green-700">Chat Now</p>
                </div>
              </a>
            )}
          </div>

          {/* Quick Links - Grid Style */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-theme-primary rounded-full"></span>
                Quick Links
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />Track Order
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-8 h-0.5 bg-theme-secondary rounded-full"></span>
                Policies
              </h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 transition-colors"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Refund
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Icons */}
          {websiteConfig?.socialLinks && websiteConfig.socialLinks.length > 0 && (
            <div className="flex justify-center gap-3 mb-8">
              {websiteConfig.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.platform}
                  className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-theme-primary hover:text-white hover:border-theme-primary hover:shadow-lg transition-all"
                >
                  {resolveSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          )}

          {/* Address */}
          {websiteConfig?.addresses?.[0] && (
            <div className="flex items-start justify-center gap-2.5 text-center mb-6 px-4 py-3 bg-gray-50 rounded-xl">
              <MapPin size={16} className="text-theme-primary mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600">{websiteConfig.addresses[0]}</p>
            </div>
          )}

          {/* Copyright */}
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} {websiteConfig?.websiteName || 'Store'}. All rights
              reserved.
            </p>
            {websiteConfig?.showPoweredBy && (
              <p className="text-[10px] text-gray-400 mt-2">Powered by SystemNext IT</p>
            )}
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden md:block max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-4 gap-10 mb-10">
            <div className="col-span-1">
              {resolvedFooterLogo ? (
                <img
                  src={normalizeImageUrl(resolvedFooterLogo)}
                  alt={`${websiteConfig?.websiteName || 'Store'} logo`}
                  width={112}
                  height={112}
                  className="h-28 object-contain mb-5"
                />
              ) : (
                <h3 className="text-2xl font-black text-gray-900 mb-5">
                  {websiteConfig?.websiteName || 'YourShop'}
                </h3>
              )}
              <p className="text-sm text-gray-500 leading-relaxed mb-6">
                {websiteConfig?.shortDescription}
              </p>
              <div className="flex gap-2.5">
                {websiteConfig?.socialLinks?.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.platform}
                    className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-theme-primary hover:text-white transition-all text-gray-600 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {resolveSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-theme-primary rounded-full"></span>
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Why Shop with us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Terms & Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-theme-secondary rounded-full"></span>
                Customer Area
              </h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />My Account
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Orders
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Tracking
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Returns
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-gradient-to-r from-theme-primary to-theme-secondary rounded-full"></span>
                Contact Us
              </h4>
              <ul className="space-y-4 text-sm">
                {websiteConfig?.addresses?.map((addr, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-500 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-colors">
                      <MapPin size={14} className="text-theme-primary" />
                    </div>
                    <span className="pt-1.5">{addr}</span>
                  </li>
                ))}
                {websiteConfig?.phones?.map((phone, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-500 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-colors">
                      <Phone size={14} className="text-theme-primary" />
                    </div>
                    <a href={`tel:${phone}`} className="hover:text-theme-primary transition-colors">
                      {phone}
                    </a>
                  </li>
                ))}
                {websiteConfig?.emails?.map((email, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-500 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-colors">
                      <Mail size={14} className="text-theme-primary" />
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-theme-primary transition-colors"
                    >
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!websiteConfig?.hideCopyright && (
            <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
              {!websiteConfig?.hideCopyrightText && (
                <p>
                  &copy; {new Date().getFullYear()} {websiteConfig?.websiteName}. All rights reserved.
                </p>
              )}
              {websiteConfig?.showPoweredBy && (
                <p className="text-gray-400">
                  Powered by <span className="text-theme-primary font-medium">SystemNext IT</span>
                </p>
              )}
            </div>
          )}
        </div>
      </footer>
      {floatingChatButton}
    </>
  );
};

export default StoreFooter;
