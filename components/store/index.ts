// Lazy-loaded store components for better code splitting
// These components are loaded on-demand to reduce initial bundle size

import { lazy } from 'react';

// Lazy load heavy modals
export const StoreChatModal = lazy(() => import('./StoreChatModal').then(m => ({ default: m.StoreChatModal })));
export const LoginModal = lazy(() => import('./LoginModal').then(m => ({ default: m.LoginModal })));
export const MobileBottomNav = lazy(() => import('./MobileBottomNav').then(m => ({ default: m.MobileBottomNav })));
export const ProductCard = lazy(() => import('./ProductCard').then(m => ({ default: m.ProductCard })));
export const HeroSection = lazy(() => import('./HeroSection').then(m => ({ default: m.HeroSection })));
export const StoreFooter = lazy(() => import('./StoreFooter').then(m => ({ default: m.StoreFooter })));
export const ProductQuickViewModal = lazy(() => import('./ProductQuickViewModal').then(m => ({ default: m.ProductQuickViewModal })));
export const TrackOrderModal = lazy(() => import('./TrackOrderModal').then(m => ({ default: m.TrackOrderModal })));
export const AddToCartSuccessModal = lazy(() => import('./AddToCartSuccessModal').then(m => ({ default: m.AddToCartSuccessModal })));

// Store sections
export { FlashSalesSection } from './FlashSalesSection';
export { ProductGridSection } from './ProductGridSection';

export { CategoriesSection } from './CategoriesSection';
export { SearchResultsSection } from './SearchResultsSection';

// Helper components from HeroSection (not lazy, small)
export { CategoryCircle, CategoryPill, SectionHeader } from './HeroSection';

// Re-export types
export type { StoreChatModalProps } from './StoreChatModal';
export type { LoginModalProps } from './LoginModal';
export type { MobileBottomNavProps } from './MobileBottomNav';
export type { ProductCardProps } from './ProductCard';
export type { HeroSectionProps } from './HeroSection';
export type { StoreFooterProps } from './StoreFooter';
export type { ProductQuickViewModalProps } from './ProductQuickViewModal';
export type { TrackOrderModalProps } from './TrackOrderModal';
