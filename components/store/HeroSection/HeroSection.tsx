import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselItem, WebsiteConfig, Campaign } from '../../../types';
import { getOptimizedImageUrl, normalizeImageUrl } from '../../../utils/imageUrlHelper';
import { OptimizedImage } from '../../OptimizedImage';
import { useIsMobile } from '../../../utils/viewportHelpers';
import './HeroSection.css';

export interface HeroSectionProps {
    carouselItems?: CarouselItem[];
    websiteConfig?: WebsiteConfig;
}

const MAX_CAROUSEL_ITEMS = 10;
const normalizeStatus = (v: unknown): string => String(v ?? '').trim().toLowerCase();
const ensureProtocol = (url: string) => /^https?:\/\//i.test(url) ? url : `https://${url.replace(/^\/*/, '')}`;

const buildInternalHref = (url: string): string => {
    if (!url) return '#';
    const t = url.trim();
    if (t.startsWith('#') || t.startsWith('?')) return t;
    const n = t.replace(/^https?:\/\/[^/]+/i, '') || '/';
    return n.startsWith('/') ? n : `/${n.replace(/^\/*/, '')}`;
};

const getCarouselHref = (item: CarouselItem) => {
    const rawUrl = item.url?.trim() || '';
    if (!rawUrl) return { href: '#', isExternal: false };
    const isExternal = String((item as any).urlType ?? '').trim().toLowerCase() === 'external';
    return isExternal ? { href: ensureProtocol(rawUrl), isExternal: true } : { href: buildInternalHref(rawUrl), isExternal: false };
};

const useCountdown = (targetDate: string) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        const calc = () => {
            const diff = new Date(targetDate).getTime() - Date.now();
            if (diff <= 0) {
                setIsStarted(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            } else {
                setIsStarted(false);
                setTimeLeft({
                    days: Math.floor(diff / 86400000),
                    hours: Math.floor((diff % 86400000) / 3600000),
                    minutes: Math.floor((diff % 3600000) / 60000),
                    seconds: Math.floor((diff % 60000) / 1000)
                });
            }
        };
        calc();
        const timer = setInterval(calc, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    return { timeLeft, isStarted };
};

const CampaignCard: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
    const { timeLeft, isStarted } = useCountdown(campaign.startDate);
    return (
        <a href={campaign.url || '#'} className="campaign-card">
            <div className="campaign-logo">
                {campaign.logo ? (
                    <OptimizedImage src={normalizeImageUrl(campaign.logo)} alt={campaign.name} width={80} height={40} className="w-full h-10 object-contain" />
                ) : (
                    <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-600 truncate px-1">{campaign.name}</span>
                    </div>
                )}
                <p className="text-[10px] text-orange-500 font-medium mt-1">{isStarted ? 'Campaign live!' : 'Campaign starts in'}</p>
            </div>
            <div className="grid grid-cols-2 gap-1">
                {(['days', 'hours', 'minutes', 'seconds'] as const).map(unit => (
                    <div key={unit} className="campaign-countdown-unit">
                        <span className="text-sm font-bold">{timeLeft[unit]}{unit[0]}</span>
                    </div>
                ))}
            </div>
        </a>
    );
};

const UpcomingCampaigns: React.FC<{ campaigns?: Campaign[] }> = ({ campaigns }) => {
    const list = campaigns?.filter(c => normalizeStatus(c.status) === 'publish')
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3) || [];
    if (!list.length) return null;
    return (
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0">
            <div className="bg-gray-50 rounded-xl p-4 h-full">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Upcoming Campaigns</h3>
                <div className="space-y-3">{list.map(c => <CampaignCard key={c.id} campaign={c} />)}</div>
            </div>
        </div>
    );
};

export const HeroSection: React.FC<HeroSectionProps> = ({ carouselItems, websiteConfig }) => {
    const items = (carouselItems?.filter(i => normalizeStatus(i.status) === 'publish').sort((a, b) => Number(a.serial ?? 0) - Number(b.serial ?? 0)) || []).slice(0, MAX_CAROUSEL_ITEMS);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const isMobile = useIsMobile();

    const pickImage = (item: CarouselItem) => {
        const raw = isMobile ? (item.mobileImage || item.image || '') : (item.image || item.mobileImage || '');
        // Smaller targets for faster LCP on mobile and desktop
        const optimized = getOptimizedImageUrl(raw, isMobile ? 'small' : 'medium');
        return { raw, optimized };
    };

    useEffect(() => {
        if (items.length <= 1 || isPaused) return;
        const timer = setInterval(() => setCurrentIndex(p => (p + 1) % items.length), 2500);
        return () => clearInterval(timer);
    }, [items.length, isPaused]);

    useEffect(() => { setCurrentIndex(p => p >= items.length ? 0 : p); }, [items.length]);

    const navigate = (dir: number) => (e: React.MouseEvent) => { e.preventDefault(); setCurrentIndex(p => (p + dir + items.length) % items.length); };

    if (!items.length) return null;

    const hasCampaigns = websiteConfig?.campaigns?.some(c => normalizeStatus(c.status) === 'publish');
    const firstItem = items[0];
    const firstItemImages = firstItem ? pickImage(firstItem) : { raw: '', optimized: '' };
    const lcpImageUrl = firstItemImages.optimized || normalizeImageUrl(firstItemImages.raw);

    const getOrigin = (url: string): string | null => {
        if (!url) return null;
        try {
            const urlObj = new URL(url);
            return urlObj.origin;
        } catch (e) {
            return null;
        }
    };

    const lcpImageOrigin = getOrigin(lcpImageUrl);

    const preloadSrcSet = lcpImageUrl
        ? [
            getOptimizedImageUrl(firstItemImages.raw, 'large') && `${getOptimizedImageUrl(firstItemImages.raw, 'large')} 960w`,
            getOptimizedImageUrl(firstItemImages.raw, 'full') && `${getOptimizedImageUrl(firstItemImages.raw, 'full')} 1400w`
          ].filter(Boolean).join(', ')
        : '';

    return (
        <>
            <Helmet>
                {lcpImageOrigin && <link rel="preconnect" href={lcpImageOrigin} />}
                {lcpImageUrl && (
                    <link
                        rel="preload"
                        as="image"
                        href={lcpImageUrl}
                        imagesrcset={preloadSrcSet || undefined}
                        imagesizes={preloadSrcSet ? '(max-width: 768px) 100vw, 1400px' : undefined}
                        fetchpriority="high"
                    />
                )}
            </Helmet>
            <section className="hero-section w-full">
                <div className="flex gap-4 max-w-full" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
                    <div className="flex-1 min-w-0">
                    <div className={`hero-carousel group ${isMobile ? 'hero-carousel-mobile' : 'hero-carousel-desktop'}`}>
                        {items.map((item, i) => {
                            const isActive = i === currentIndex;
                            const isNearActive = Math.abs(i - currentIndex) <= 1 || 
                                                 (currentIndex === 0 && i === items.length - 1) ||
                                                 (currentIndex === items.length - 1 && i === 0);
                            const { href, isExternal } = getCarouselHref(item);
                            const { raw, optimized } = pickImage(item);
                            const imgSrc = optimized || normalizeImageUrl(raw);
                            
                            // Only load first image with priority, defer others
                            // Load adjacent slides for smooth transitions
                            const shouldLoad = i === 0 || isNearActive;
                            
                            return (
                                <a 
                                    key={item.id || i} 
                                    href={href} 
                                    target={isExternal ? '_blank' : undefined} 
                                    rel={isExternal ? 'noopener noreferrer' : undefined}
                                    className={`hero-slide ${isActive ? 'hero-slide-active' : 'hero-slide-inactive'}`}
                                >
                                    {shouldLoad ? (
                                        <OptimizedImage
                                            src={imgSrc}
                                            alt={item.name || 'Banner'}
                                            className="hero-slide-image"
                                            width={isMobile ? 400 : 1920}
                                            height={isMobile ? 120 : 600}
                                            style={{ aspectRatio: isMobile ? '400 / 120' : '16 / 5' }}
                                            priority={i === 0}
                                            eager={isNearActive && i !== 0}
                                            placeholder="blur"
                                        />
                                    ) : (
                                        <div className="hero-slide-image bg-gray-100" />
                                    )}
                                </a>
                            );
                        })}
                        <div className="hero-gradient-left" />
                        <div className="hero-gradient-right" />
                        {items.length > 1 && (
                            <>
                                <button onClick={navigate(-1)} aria-label="Previous slide" className="hero-nav-button hero-nav-prev">
                                    <ChevronLeft size={isMobile ? 18 : 22} strokeWidth={2.5} />
                                </button>
                                <button onClick={navigate(1)} aria-label="Next slide" className="hero-nav-button hero-nav-next">
                                    <ChevronRight size={isMobile ? 18 : 22} strokeWidth={2.5} />
                                </button>
                                 <div className="absolute bottom-3 md:bottom-4 left-0 right-0 flex justify-center gap-1.5 md:gap-2 z-20">
                                    {items.map((_, i) => (
                                        <button 
                                            key={i} 
                                            onClick={e => { e.preventDefault(); setCurrentIndex(i); }} 
                                            aria-label={`Go to slide ${i + 1}`}
                                            className={`hero-dot ${i === currentIndex ? 'hero-dot-active' : 'hero-dot-inactive'}`} 
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
                {hasCampaigns && <UpcomingCampaigns campaigns={websiteConfig?.campaigns} />}
            </div>
        </section>
    </>
    );
};

export const CategoryCircle: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
    <div className="category-circle group">
        <div className="category-circle-icon">{icon}</div>
        <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-primary-600 text-center transition-colors">{name}</span>
    </div>
);

export const CategoryPill: React.FC<{ name: string; icon: React.ReactNode }> = ({ name, icon }) => (
    <div className="category-pill group">
        <div className="category-pill-icon">{icon}</div>
        <span className="text-sm font-semibold text-gray-700 group-hover:text-primary-600 transition-colors">{name}</span>
    </div>
);

export const SectionHeader: React.FC<{ title: string; className?: string }> = ({ title, className }) => (
    <h2 className={`text-2xl font-bold tracking-tight text-gray-900 ${className ?? ''}`}>{title}</h2>
);
