/**
 * Demo data for main domain (systemnextit.com)
 * This data is shown when no tenant subdomain is present
 * Static data - no API calls needed for fast loading
 */

import type { Product, WebsiteConfig, CarouselItem, Category, Brand } from '../types';

// Demo Carousel Items - using placeholder images
export const DEMO_CAROUSEL_ITEMS: CarouselItem[] = [
  {
    id: 'demo-1',
    name: 'SystemNext IT - Professional E-commerce Solutions',
    image: 'https://placehold.co/1200x400/6366F1/white?text=SystemNext+IT+-+E-commerce+Solutions',
    mobileImage: 'https://placehold.co/600x300/6366F1/white?text=SystemNext+IT',
    url: '#features',
    urlType: 'Internal',
    status: 'Publish',
    serial: 1,
  },
  {
    id: 'demo-2',
    name: 'Build Your Online Business with SystemNext IT',
    image: 'https://placehold.co/1200x400/7C3AED/white?text=Build+Your+Business',
    mobileImage: 'https://placehold.co/600x300/7C3AED/white?text=Build+Your+Business',
    url: '#pricing',
    urlType: 'Internal',
    status: 'Publish',
    serial: 2,
  },
  {
    id: 'demo-3',
    name: 'Launch Your Store in Minutes - SystemNext IT',
    image: 'https://placehold.co/1200x400/10B981/white?text=Launch+Your+Store',
    mobileImage: 'https://placehold.co/600x300/10B981/white?text=Launch+Your+Store',
    url: '#contact',
    urlType: 'Internal',
    status: 'Publish',
    serial: 3,
  },
];

// Demo Categories - using placeholder images
export const DEMO_CATEGORIES: Category[] = [
  { id: '1', name: 'Electronics', slug: 'electronics', image: 'https://placehold.co/100x100/3B82F6/white?text=📱', status: 'Active' },
  { id: '2', name: 'Fashion', slug: 'fashion', image: 'https://placehold.co/100x100/EC4899/white?text=👗', status: 'Active' },
  { id: '3', name: 'Home & Living', slug: 'home-living', image: 'https://placehold.co/100x100/F59E0B/white?text=🏠', status: 'Active' },
  { id: '4', name: 'Beauty', slug: 'beauty', image: 'https://placehold.co/100x100/8B5CF6/white?text=💄', status: 'Active' },
  { id: '5', name: 'Sports', slug: 'sports', image: 'https://placehold.co/100x100/10B981/white?text=⚽', status: 'Active' },
  { id: '6', name: 'Books', slug: 'books', image: 'https://placehold.co/100x100/6366F1/white?text=📚', status: 'Active' },
];

// Demo Brands - using placeholder images
export const DEMO_BRANDS: Brand[] = [
  { id: '1', name: 'SystemNext IT', logo: 'https://placehold.co/120x40/6366F1/white?text=SystemNext+IT', status: 'Active' },
  { id: '2', name: 'TechPro', logo: 'https://placehold.co/120x40/3B82F6/white?text=TechPro', status: 'Active' },
  { id: '3', name: 'StyleHub', logo: 'https://placehold.co/120x40/8B5CF6/white?text=StyleHub', status: 'Active' },
];

// Demo Products - using placeholder images
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Premium Wireless Headphones',
    slug: 'premium-wireless-headphones',
    price: 2999,
    originalPrice: 4999,
    description: 'High-quality wireless headphones with noise cancellation',
    image: 'https://placehold.co/400x400/3B82F6/white?text=Headphones',
    galleryImages: ['https://placehold.co/400x400/3B82F6/white?text=Headphones'],
    category: 'Electronics',
    brand: 'TechPro',
    stock: 50,
    status: 'Active',
    rating: 4.5,
    reviews: 128,
  },
  {
    id: 2,
    name: 'Smart Watch Pro',
    slug: 'smart-watch-pro',
    price: 5499,
    originalPrice: 7999,
    description: 'Advanced smartwatch with health monitoring',
    image: 'https://placehold.co/400x400/10B981/white?text=Smart+Watch',
    galleryImages: ['https://placehold.co/400x400/10B981/white?text=Smart+Watch'],
    category: 'Electronics',
    brand: 'TechPro',
    stock: 30,
    status: 'Active',
    rating: 4.8,
    reviews: 256,
  },
  {
    id: 3,
    name: 'Designer Backpack',
    slug: 'designer-backpack',
    price: 1299,
    originalPrice: 1999,
    description: 'Stylish and durable backpack for everyday use',
    image: 'https://placehold.co/400x400/EC4899/white?text=Backpack',
    galleryImages: ['https://placehold.co/400x400/EC4899/white?text=Backpack'],
    category: 'Fashion',
    brand: 'StyleHub',
    stock: 100,
    status: 'Active',
    rating: 4.3,
    reviews: 89,
  },
  {
    id: 4,
    name: 'Bluetooth Speaker',
    slug: 'bluetooth-speaker',
    price: 1499,
    originalPrice: 2499,
    description: 'Portable speaker with powerful bass',
    image: 'https://placehold.co/400x400/F59E0B/white?text=Speaker',
    galleryImages: ['https://placehold.co/400x400/F59E0B/white?text=Speaker'],
    category: 'Electronics',
    brand: 'TechPro',
    stock: 75,
    status: 'Active',
    rating: 4.6,
    reviews: 167,
  },
  {
    id: 5,
    name: 'Fitness Tracker Band',
    slug: 'fitness-tracker-band',
    price: 999,
    originalPrice: 1499,
    description: 'Track your fitness goals with precision',
    image: 'https://placehold.co/400x400/EF4444/white?text=Fitness+Band',
    galleryImages: ['https://placehold.co/400x400/EF4444/white?text=Fitness+Band'],
    category: 'Sports',
    brand: 'TechPro',
    stock: 200,
    status: 'Active',
    rating: 4.4,
    reviews: 312,
  },
  {
    id: 6,
    name: 'Organic Face Cream',
    slug: 'organic-face-cream',
    price: 599,
    originalPrice: 899,
    description: 'Natural ingredients for glowing skin',
    image: 'https://placehold.co/400x400/8B5CF6/white?text=Face+Cream',
    galleryImages: ['https://placehold.co/400x400/8B5CF6/white?text=Face+Cream'],
    category: 'Beauty',
    brand: 'StyleHub',
    stock: 150,
    status: 'Active',
    rating: 4.7,
    reviews: 445,
  },
  {
    id: 7,
    name: 'Laptop Stand',
    slug: 'laptop-stand',
    price: 799,
    originalPrice: 1199,
    description: 'Ergonomic aluminum laptop stand',
    image: 'https://placehold.co/400x400/6366F1/white?text=Laptop+Stand',
    galleryImages: ['https://placehold.co/400x400/6366F1/white?text=Laptop+Stand'],
    category: 'Electronics',
    brand: 'SystemNext IT',
    stock: 80,
    status: 'Active',
    rating: 4.5,
    reviews: 98,
  },
  {
    id: 8,
    name: 'Yoga Mat Premium',
    slug: 'yoga-mat-premium',
    price: 699,
    originalPrice: 999,
    description: 'Non-slip eco-friendly yoga mat',
    image: 'https://placehold.co/400x400/14B8A6/white?text=Yoga+Mat',
    galleryImages: ['https://placehold.co/400x400/14B8A6/white?text=Yoga+Mat'],
    category: 'Sports',
    brand: 'StyleHub',
    stock: 120,
    status: 'Active',
    rating: 4.6,
    reviews: 234,
  },
];

// Demo Website Config
export const DEMO_WEBSITE_CONFIG: Partial<WebsiteConfig> = {
  websiteName: 'SystemNext IT',
  shortDescription: 'Professional E-commerce & Software Solutions',
  headerLogo: 'https://hdnfltv.com/image/nitimages/04aad350-812e-4678-a009-7d576378b603.webp',
  carouselItems: DEMO_CAROUSEL_ITEMS,
  socialLinks: [
    { id: '1', platform: 'facebook', url: 'https://facebook.com/systemnextit' },
    { id: '2', platform: 'instagram', url: 'https://instagram.com/systemnextit' },
    { id: '3', platform: 'twitter', url: 'https://twitter.com/systemnextit' },
  ],
  emails: ['contact@systemnextit.com'],
  phones: ['+880 1700-000000'],
  addresses: ['Head Office: Dhaka, Bangladesh'],
  showFlashSaleCounter: true,
};

// Check if current domain is main domain (no tenant subdomain)
export function isMainDomain(): boolean {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const primaryDomain = import.meta.env.VITE_PRIMARY_DOMAIN || 'systemnextit.com';
  
  // Main domain or www subdomain
  if (hostname === primaryDomain || hostname === `www.${primaryDomain}`) {
    return true;
  }
  
  // Localhost without subdomain
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const parts = hostname.split('.');
    return parts.length <= 1;
  }
  
  return false;
}
