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
  ArrowRight,
  Heart,
  ShieldCheck,
  Truck,
  CreditCard,
  Headphones
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
    facebook: <Facebook size={18} />,
    instagram: <Instagram size={18} />,
    twitter: <Twitter size={18} />,
    youtube: <Youtube size={18} />,
    linkedin: <Linkedin size={18} />,
    whatsapp: <MessageCircle size={18} />,
    messenger: <MessageCircle size={18} />,
    fb: <Facebook size={18} />,
    ig: <Instagram size={18} />,
    x: <Twitter size={18} />,
    yt: <Youtube size={18} />,
  };

  const resolveSocialIcon = (platform?: string): React.ReactNode => {
    const key = platform?.toLowerCase() || '';
    return socialIconMap[key] || <Globe size={18} />;
  };

  const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
  const chatEnabled = websiteConfig?.chatEnabled ?? true;
  const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;
  const resolvedFooterLogo = websiteConfig?.footerLogo || websiteConfig?.favicon || logo || null;
  const currentYear = new Date().getFullYear();

  const floatingChatButton = (() => {
    const baseClasses =
      'hidden md:flex fixed bottom-8 right-8 w-14 h-14 items-center justify-center rounded-full transition-all duration-300 hover:-translate-y-1 hover:scale-105 z-40 shadow-lg';
    const chatIcon = <MessageCircle size={24} strokeWidth={2} className="text-white" />;

    if (chatEnabled && onOpenChat) {
      return (
        <button
          type="button"
          onClick={onOpenChat}
          aria-label="Open live chat"
          className={`${baseClasses} bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-xl hover:shadow-pink-500/30`}
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
          className={`${baseClasses} bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-xl hover:shadow-green-500/30`}
        >
          {chatIcon}
        </a>
      );
    }
    return null;
  })();

  // Feature badges data
  const features = [
    { icon: <Truck size={24} />, title: 'Free Delivery', desc: 'On orders over ৳999' },
    { icon: <ShieldCheck size={24} />, title: 'Secure Payment', desc: '100% secure checkout' },
    { icon: <CreditCard size={24} />, title: 'Easy Returns', desc: '7 days return policy' },
    { icon: <Headphones size={24} />, title: '24/7 Support', desc: 'Dedicated support' },
  ];

  return (
    <>
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 mt-auto">
        {/* Feature Badges */}
        <div className="border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{feature.title}</h4>
                    <p className="text-xs text-gray-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              {resolvedFooterLogo ? (
                <img
                  src={normalizeImageUrl(resolvedFooterLogo)}
                  alt={`${websiteConfig?.websiteName || 'Store'} logo`}
                  className="h-12 w-auto object-contain mb-4"
                />
              ) : (
                <h3 className="text-2xl font-bold text-white mb-4">
                  {websiteConfig?.websiteName || 'Our Store'}
                </h3>
              )}
              <p className="text-sm text-gray-400 mb-5 leading-relaxed">
                {websiteConfig?.description || 'Your trusted online shopping destination for quality products at the best prices.'}
              </p>
              
              {/* Social Links */}
              <div className="flex gap-2">
                {websiteConfig?.socialLinks?.slice(0, 5).map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-300"
                    aria-label={social.platform}
                  >
                    {resolveSocialIcon(social.platform)}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold mb-5 text-lg relative inline-block">
                Quick Links
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span>
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Shop', href: '/products' },
                  { label: 'About Us', href: '/about' },
                  { label: 'Contact', href: '/contact' },
                  { label: 'Privacy Policy', href: '/privacy' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center gap-2 group text-sm"
                    >
                      <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-pink-500" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Customer Area */}
            <div>
              <h4 className="text-white font-bold mb-5 text-lg relative inline-block">
                Customer Area
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span>
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'My Account', href: '/profile' },
                  { label: 'Order History', href: '/profile/orders' },
                  { label: 'Track Order', href: '/track' },
                  { label: 'Wishlist', href: '/wishlist' },
                  { label: 'Returns & Refunds', href: '/returns' },
                ].map((link, idx) => (
                  <li key={idx}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-white hover:pl-2 transition-all duration-200 flex items-center gap-2 group text-sm"
                    >
                      <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-pink-500" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="text-white font-bold mb-5 text-lg relative inline-block">
                Contact Us
                <span className="absolute -bottom-1 left-0 w-8 h-0.5 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full"></span>
              </h4>
              <ul className="space-y-4">
                {websiteConfig?.address && (
                  <li className="flex gap-3">
                    <MapPin size={18} className="text-pink-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-400">{websiteConfig.address}</span>
                  </li>
                )}
                {websiteConfig?.phone && (
                  <li className="flex gap-3">
                    <Phone size={18} className="text-pink-500 flex-shrink-0" />
                    <a href={`tel:${websiteConfig.phone}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {websiteConfig.phone}
                    </a>
                  </li>
                )}
                {websiteConfig?.email && (
                  <li className="flex gap-3">
                    <Mail size={18} className="text-pink-500 flex-shrink-0" />
                    <a href={`mailto:${websiteConfig.email}`} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {websiteConfig.email}
                    </a>
                  </li>
                )}
                {websiteConfig?.whatsappNumber && (
                  <li className="flex gap-3">
                    <MessageCircle size={18} className="text-green-500 flex-shrink-0" />
                    <a href={whatsappLink || '#'} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                      WhatsApp: {websiteConfig.whatsappNumber}
                    </a>
                  </li>
                )}
              </ul>
              
              {/* Newsletter */}
              <div className="mt-6">
                <p className="text-sm text-gray-400 mb-3">Subscribe to our newsletter</p>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-lg hover:shadow-lg hover:shadow-pink-500/25 transition-all">
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods & Copyright */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Copyright */}
              <p className="text-sm text-gray-500 text-center md:text-left">
                © {currentYear} <span className="text-white font-medium">{websiteConfig?.websiteName || 'Our Store'}</span>. All rights reserved.
              </p>
              
              {/* Payment Methods */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">We accept:</span>
                <div className="flex gap-2">
                  {['bKash', 'Nagad', 'Visa', 'Master'].map((method, idx) => (
                    <div key={idx} className="px-3 py-1.5 bg-gray-800 rounded text-xs font-medium text-gray-400">
                      {method}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Made with love */}
              <p className="text-xs text-gray-500 flex items-center gap-1">
                Made with <Heart size={12} className="text-pink-500 fill-pink-500" /> in Bangladesh
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Chat Button */}
      {floatingChatButton}
    </>
  );
};

export default StoreFooter;
