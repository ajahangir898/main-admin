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
  const socialIconMap: { [key: string]: React.ReactNode } = {
    facebook: <Facebook size={18} className="text-current" />,
    instagram: <Instagram size={18} className="text-current" />,
    twitter: <Twitter size={18} className="text-current" />,
    youtube: <Youtube size={18} className="text-current" />,
    linkedin: <Linkedin size={18} className="text-current" />,
    whatsapp: <MessageCircle size={18} className="text-current" />,
    messenger: <MessageCircle size={18} className="text-current" />,
    fb: <Facebook size={18} className="text-current" />,
    ig: <Instagram size={18} className="text-current" />,
    x: <Twitter size={18} className="text-current" />,
    yt: <Youtube size={18} className="text-current" />,
  };

  const resolveSocialIcon = (platform?: string): React.ReactNode => {
    const key = platform?.toLowerCase() || '';
    return socialIconMap[key] || <Globe size={18} className="text-current" />;
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
      <footer className="store-footer store-footer-minheight store-footer-modern surface-panel bg-white border-t border-gray-100/60 mt-auto" style={{ contain: 'layout style' }}>
        {/* Mobile Footer */}
        <div className="md:hidden px-4 py-10">
          {/* Logo & Description */}
          <div className="text-center mb-10 footer-fade-up">
            {resolvedFooterLogo ? (
              <img
                src={normalizeImageUrl(resolvedFooterLogo)}
                alt={`${websiteConfig?.websiteName || 'Store'} logo`}
                width={112}
                height={112}
                className="h-24 object-contain mx-auto mb-5 transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <h3 className="text-2xl font-black text-gray-900 mb-4">
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
          <div className="flex gap-3 overflow-x-auto pb-4 mb-10 -mx-4 px-4 scrollbar-hide">
            {websiteConfig?.phones?.[0] && (
              <a
                href={`tel:${websiteConfig.phones[0]}`}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100/80 footer-contact-card"
              >
                <div className="w-11 h-11 rounded-xl bg-theme-primary/10 flex items-center justify-center gentle-breath">
                  <Phone size={18} strokeWidth={1.8} className="text-theme-primary" />
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
                className="flex-shrink-0 flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100/80 footer-contact-card"
              >
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center gentle-breath">
                  <Mail size={18} strokeWidth={1.8} className="text-blue-500" />
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
                className="flex-shrink-0 flex items-center gap-3 px-4 py-4 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100/80 footer-contact-card"
              >
                <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center gentle-breath">
                  <MessageCircle size={18} strokeWidth={1.8} className="text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">WhatsApp</p>
                  <p className="text-sm font-bold text-green-700">Chat Now</p>
                </div>
              </a>
            )}
          </div>

          {/* Quick Links - Grid Style */}
          <div className="grid grid-cols-2 gap-8 mb-10">
            <div className="footer-fade-up">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-5 footer-section-header">
                Quick Links
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />Track Order
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-primary/50" />Returns
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-fade-up">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-5 footer-section-header">
                Policies
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-sm text-gray-600 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={12} className="text-theme-secondary/50" />Refund
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Icons */}
          {websiteConfig?.socialLinks && websiteConfig.socialLinks.length > 0 && (
            <div className="flex justify-center gap-3 mb-10">
              {websiteConfig.socialLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.platform}
                  className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100/80 flex items-center justify-center text-gray-500 hover:bg-theme-primary hover:text-white hover:border-theme-primary transition-all duration-300 footer-social-icon"
                >
                  {resolveSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          )}

          {/* Address */}
          {websiteConfig?.addresses?.[0] && (
            <div className="flex items-start justify-center gap-3 text-center mb-8 px-5 py-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100/60">
              <MapPin size={16} strokeWidth={1.8} className="text-theme-primary mt-0.5 shrink-0" />
              <p className="text-sm text-gray-600 leading-relaxed">{websiteConfig.addresses[0]}</p>
            </div>
          )}

          {/* Copyright */}
          <div className="border-t border-gray-100/60 pt-8 text-center footer-copyright">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} {websiteConfig?.websiteName || 'Store'}. All rights
              reserved.
            </p>
            {websiteConfig?.showPoweredBy && (
              <p className="text-[10px] text-gray-400 mt-2.5">Powered by SystemNext IT</p>
            )}
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden md:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 footer-fade-up">
              {resolvedFooterLogo ? (
                <img
                  src={normalizeImageUrl(resolvedFooterLogo)}
                  alt={`${websiteConfig?.websiteName || 'Store'} logo`}
                  width={112}
                  height={112}
                  className="h-24 object-contain mb-6 transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <h3 className="text-2xl font-black text-gray-900 mb-6">
                  {websiteConfig?.websiteName || 'YourShop'}
                </h3>
              )}
              <p className="text-sm text-gray-500 leading-relaxed mb-7">
                {websiteConfig?.shortDescription}
              </p>
              <div className="flex gap-3">
                {websiteConfig?.socialLinks?.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={link.platform}
                    className="w-10 h-10 rounded-xl bg-gray-100/80 flex items-center justify-center hover:bg-theme-primary hover:text-white transition-all duration-300 text-gray-600 footer-social-icon"
                  >
                    {resolveSocialIcon(link.platform)}
                  </a>
                ))}
              </div>
            </div>
            <div className="footer-fade-up">
              <h4 className="font-bold text-gray-900 mb-6 footer-section-header">
                Quick Links
              </h4>
              <ul className="space-y-3.5 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Why Shop with us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Terms & Conditions
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-primary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Privacy Policy
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-fade-up">
              <h4 className="font-bold text-gray-900 mb-6 footer-section-header">
                Customer Area
              </h4>
              <ul className="space-y-3.5 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />My Account
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Orders
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Tracking
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-500 hover:text-theme-secondary flex items-center gap-2 footer-link-smooth"
                  >
                    <ArrowRight size={14} className="text-gray-300" />Returns
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer-fade-up">
              <h4 className="font-bold text-gray-900 mb-6 footer-section-header">
                Contact Us
              </h4>
              <ul className="space-y-4 text-sm">
                {websiteConfig?.addresses?.map((addr, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-500 group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-all duration-300">
                      <MapPin size={15} strokeWidth={1.8} className="text-theme-primary" />
                    </div>
                    <span className="pt-2 leading-relaxed">{addr}</span>
                  </li>
                ))}
                {websiteConfig?.phones?.map((phone, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-500 group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-all duration-300">
                      <Phone size={15} strokeWidth={1.8} className="text-theme-primary" />
                    </div>
                    <a href={`tel:${phone}`} className="hover:text-theme-primary transition-all duration-300">
                      {phone}
                    </a>
                  </li>
                ))}
                {websiteConfig?.emails?.map((email, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-500 group">
                    <div className="w-9 h-9 rounded-xl bg-gray-100/80 flex items-center justify-center shrink-0 group-hover:bg-theme-primary/10 transition-all duration-300">
                      <Mail size={15} strokeWidth={1.8} className="text-theme-primary" />
                    </div>
                    <a
                      href={`mailto:${email}`}
                      className="hover:text-theme-primary transition-all duration-300"
                    >
                      {email}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {!websiteConfig?.hideCopyright && (
            <div className="border-t border-gray-100/60 pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 footer-copyright">
              {!websiteConfig?.hideCopyrightText && (
                <p>
                  &copy; {new Date().getFullYear()} {websiteConfig?.websiteName}. All rights reserved.
                </p>
              )}
              {websiteConfig?.showPoweredBy && (
                <p className="text-gray-400">
                  Powered by <span className="text-theme-primary font-medium transition-colors duration-300 hover:text-theme-primary/80">SystemNext IT</span>
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
