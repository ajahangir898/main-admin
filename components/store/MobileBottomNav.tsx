import React, { useState, useRef, useEffect } from 'react';
import { Facebook, Phone, Home, MessageCircle, Menu } from 'lucide-react';
import { User as UserType, WebsiteConfig } from '../../types';

const buildWhatsAppLink = (rawNumber?: string | null) => {
    if (!rawNumber) return null;
    const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
};

// Gradient Chat Icon Component - Blue to Pink gradient with white chat bubble
const GradientChatIcon = ({ size = 44 }: { size?: number }) => (
    <div 
        className="rounded-full flex items-center justify-center shadow-lg"
        style={{
            width: size,
            height: size,
            background: 'linear-gradient(135deg, #4F8EF7 0%, #8B5CF6 50%, #EC4899 100%)',
        }}
    >
        <MessageCircle size={size * 0.5} strokeWidth={2} className="text-white" />
    </div>
);

export interface MobileBottomNavProps {
    onHomeClick: () => void;
    onCartClick: () => void;
    onAccountClick: () => void;
    onChatClick?: () => void;
    onMenuClick?: () => void;
    cartCount?: number;
    websiteConfig?: WebsiteConfig;
    activeTab?: string;
    user?: UserType | null;
    onLogoutClick?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ 
    onHomeClick, 
    onCartClick, 
    onAccountClick, 
    onChatClick,
    onMenuClick, 
    cartCount, 
    websiteConfig, 
    activeTab = 'home', 
    user, 
    onLogoutClick 
}) => {
    const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
    const accountSectionRef = useRef<HTMLDivElement>(null);
    const customerLabel = user?.name || user?.displayName || user?.email || 'Guest shopper';
    const customerInitial = (customerLabel?.charAt(0) || 'G').toUpperCase();
    
    useEffect(() => {
        if (!isAccountMenuOpen) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (!accountSectionRef.current?.contains(event.target as Node)) {
                setIsAccountMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [isAccountMenuOpen]);
    
    const handleAccountPrimaryAction = () => {
        setIsAccountMenuOpen(false);
        onAccountClick?.();
    };
    
    const handleAccountLogout = () => {
        if (!onLogoutClick) {
            setIsAccountMenuOpen(false);
            return;
        }
        setIsAccountMenuOpen(false);
        onLogoutClick();
    };
    
    const facebookLinkRaw = websiteConfig?.socialLinks?.find((link) => {
        const platformKey = (link.platform || '').toLowerCase();
        return platformKey.includes('facebook') || platformKey === 'fb';
    })?.url?.trim();
    
    const facebookLink = facebookLinkRaw
        ? (/^https?:\/\//i.test(facebookLinkRaw) ? facebookLinkRaw : `https://${facebookLinkRaw.replace(/^\/+/, '')}`)
        : null;
    
    const whatsappLink = buildWhatsAppLink(websiteConfig?.whatsappNumber);
    const chatEnabled = websiteConfig?.chatEnabled ?? true;
    const chatFallbackLink = !chatEnabled && websiteConfig?.chatWhatsAppFallback ? whatsappLink : null;

    // Default Style: 5 Columns - Clean Modern Design
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-2 px-1 flex justify-around items-center md:hidden z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-safe h-[60px]">
            {/* Chat */}
            {chatEnabled && onChatClick ? (
                <button onClick={onChatClick} className={`flex flex-col items-center gap-0.5 transition w-1/5 group ${activeTab === 'chat' ? 'scale-110' : 'hover:scale-110'}`}>
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-600">Chat</span>
                </button>
            ) : chatFallbackLink ? (
                <a href={chatFallbackLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-600">Chat</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5 opacity-50" type="button" disabled>
                    <GradientChatIcon size={48} />
                    <span className="text-[10px] font-medium text-gray-400">Chat</span>
                </button>
            )}

            {/* Call */}
            {whatsappLink ? (
                <a href={whatsappLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Phone size={24} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">Call</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5" type="button" disabled>
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                        <Phone size={24} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-300">Call</span>
                </button>
            )}

            {/* Home - Center Elevated */}
            <button onClick={onHomeClick} className={`flex flex-col items-center transition w-1/5 group ${activeTab === 'home' ? 'scale-110' : 'hover:scale-110'}`}>
                <div className="w-16 h-16 rounded-full bg-theme-primary flex items-center justify-center shadow-lg shadow-theme-primary/30 group-hover:shadow-theme-primary/50 group-active:scale-95 transition-all border-4 border-white transform -translate-y-2">
                    <Home size={28} strokeWidth={2.5} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-theme-primary mt-0.5">Home</span>
            </button>

            {/* Facebook Page */}
            {facebookLink ? (
                <a href={facebookLink} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-0.5 transition w-1/5 group hover:scale-110">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Facebook size={24} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">Page</span>
                </a>
            ) : (
                <button className="flex flex-col items-center gap-0.5 transition w-1/5" type="button" disabled>
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
                        <Facebook size={24} className="text-gray-300" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-300">Page</span>
                </button>
            )}

            {/* Menu */}
            <div ref={accountSectionRef} className="relative flex justify-center w-1/5">
                <button onClick={onMenuClick} className={`flex flex-col items-center gap-0.5 transition w-full group ${activeTab === 'menu' ? 'scale-110' : 'hover:scale-110'}`}>
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Menu size={24} className="text-gray-600" />
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">Menu</span>
                </button>
            </div>
        </div>
    );
};

export default MobileBottomNav;
