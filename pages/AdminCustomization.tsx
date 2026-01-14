import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Save,
  Trash2,
  Image as ImageIcon,
  Layout,
  Palette,
  Globe,
  Plus,
  Search,
  Eye,
  Edit,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  CheckCircle2,
  MessageCircle,
  CalendarDays,
  FolderOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  ThemeConfig,
  WebsiteConfig,
  SocialLink,
  CarouselItem,
  FooterLink,
  Popup,
  Campaign
} from '../types';
import {
  convertFileToWebP,
  convertCarouselImage,
  dataUrlToFile,
  CAROUSEL_WIDTH,
  CAROUSEL_HEIGHT,
  CAROUSEL_MOBILE_WIDTH,
  CAROUSEL_MOBILE_HEIGHT
} from '../services/imageUtils';
import { DataService } from '../services/DataService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import {
  uploadPreparedImageToServer,
  isBase64Image,
  convertBase64ToUploadedUrl
} from '../services/imageUploadService';
import { GalleryPicker } from '../components/GalleryPicker';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AdminCustomizationProps {
  tenantId: string;
  logo: string | null;
  onUpdateLogo: (logo: string | null) => void;
  themeConfig?: ThemeConfig;
  onUpdateTheme?: (config: ThemeConfig) => Promise<void>;
  websiteConfig?: WebsiteConfig;
  onUpdateWebsiteConfig?: (config: WebsiteConfig) => Promise<void>;
  initialTab?: string;
}

type ColorKey =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'font'
  | 'hover'
  | 'surface'
  | 'adminBg'
  | 'adminInputBg'
  | 'adminBorder'
  | 'adminFocus';

type FooterLinkField = 'footerQuickLinks' | 'footerUsefulLinks';

type ImageUploadType =
  | 'logo'
  | 'favicon'
  | 'carousel'
  | 'carouselMobile'
  | 'popup'
  | 'headerLogo'
  | 'footerLogo';

type CarouselFilterStatus = 'All' | 'Publish' | 'Draft' | 'Trash';
type PopupFilterStatus = 'All' | 'Publish' | 'Draft';
type CampaignFilterStatus = 'All' | 'Publish' | 'Draft';

// ============================================================================
// Constants & Default Values
// ============================================================================

const DEFAULT_COLORS: Record<ColorKey, string> = {
  primary: '#22c55e',
  secondary: '#ec4899',
  tertiary: '#9333ea',
  font: '#0f172a',
  hover: '#f97316',
  surface: '#e2e8f0',
  adminBg: '#030407',
  adminInputBg: '#0f172a',
  adminBorder: '#ffffff',
  adminFocus: '#f87171'
};

const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  websiteName: '',
  shortDescription: '',
  whatsappNumber: '',
  favicon: null,
  headerLogo: null,
  footerLogo: null,
  addresses: [],
  emails: [],
  phones: [],
  socialLinks: [],
  footerQuickLinks: [],
  footerUsefulLinks: [],
  showMobileHeaderCategory: true,
  showNewsSlider: true,
  headerSliderText: '',
  hideCopyright: false,
  hideCopyrightText: false,
  showPoweredBy: false,
  showFlashSaleCounter: true,
  brandingText: '',
  carouselItems: [],
  campaigns: [],
  popups: [],
  searchHints: '',
  orderLanguage: 'English',
  adminNoticeText: '',
  categorySectionStyle: 'style5'
};

// Demo images for style previews
const DEMO_IMAGES = {
  categorySectionStyle: {
    mobile1: '/demo-category-mobile1.jpg',
    mobile2: 'https://i.postimg.cc/YCHXKTXz/image.png' // User will provide actual URL
  }
};

const SOCIAL_PLATFORM_OPTIONS = [
  'Facebook',
  'Instagram',
  'YouTube',
  'Daraz',
  'Twitter',
  'LinkedIn'
];

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

const FOOTER_LINK_SECTIONS: Array<{
  field: FooterLinkField;
  title: string;
  helper: string;
}> = [
  {
    field: 'footerQuickLinks',
    title: 'Footer Quick Links',
    helper: 'Shown in the Quick Links column of Footer 3'
  },
  {
    field: 'footerUsefulLinks',
    title: 'Footer Useful Links',
    helper: 'Shown in the Useful Links column of Footer 3'
  }
];

const THEME_VIEW_SECTIONS = [
  { title: 'Header Section', key: 'headerStyle', count: 5 },
  { title: 'Showcase Section', key: 'showcaseSectionStyle', count: 5 },
  { title: 'Brand Section', key: 'brandSectionStyle', count: 5, hasNone: true },
  {
    title: 'Category Section',
    key: 'categorySectionStyle',
    count: 5,
    hasNone: true,
    hasMobile: true
  },
  { title: 'Product Section', key: 'productSectionStyle', count: 5 },
  { title: 'Product Card', key: 'productCardStyle', count: 5 },
  { title: 'Footer Section', key: 'footerStyle', count: 5 },
  { title: 'Bottom Nav', key: 'bottomNavStyle', count: 1 }
];

const WEBSITE_INFO_TOGGLES = [
  { key: 'showMobileHeaderCategory', label: 'isShowMobileHeaderCategoryMenu' },
  { key: 'showNewsSlider', label: 'Is Show News Slider' },
  { key: 'hideCopyright', label: 'Hide Copyright Section' },
  { key: 'hideCopyrightText', label: 'Hide Copyright Text' },
  { key: 'showPoweredBy', label: 'Powered by SystemNext IT' }
];

const LOGO_CONFIG = [
  { refKey: 'logo', configKey: 'logo', name: 'Primary Store Logo (Fallback)' },
  { refKey: 'headerLogo', configKey: 'headerLogo', name: 'Header Logo Override' },
  { refKey: 'footerLogo', configKey: 'footerLogo', name: 'Footer Logo Override' }
] as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes a hex color string to proper format
 * Supports 3-digit and 6-digit hex codes
 */
const normalizeHexColor = (value: string): string => {
  const sanitized = value.trim().replace(/[^0-9a-fA-F]/g, '');
  if (sanitized.length === 3) {
    return `#${sanitized
      .split('')
      .map((c) => `${c}${c}`)
      .join('')
      .toUpperCase()}`;
  }
  if (sanitized.length === 6) {
    return `#${sanitized.toUpperCase()}`;
  }
  return '';
};

// ============================================================================
// Main Component
// ============================================================================

const AdminCustomization: React.FC<AdminCustomizationProps> = ({
  tenantId,
  logo,
  onUpdateLogo,
  themeConfig,
  onUpdateTheme,
  websiteConfig,
  onUpdateWebsiteConfig,
  initialTab = 'website_info'
}) => {
  // ---------------------------------------------------------------------------
  // Tab State
  // ---------------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState(initialTab);

  // ---------------------------------------------------------------------------
  // Website Configuration State
  // ---------------------------------------------------------------------------
  const [websiteConfiguration, setWebsiteConfiguration] = useState<WebsiteConfig>(
    () => (websiteConfig ? { ...DEFAULT_WEBSITE_CONFIG, ...websiteConfig } : DEFAULT_WEBSITE_CONFIG)
  );

  // ---------------------------------------------------------------------------
  // Theme Colors State
  // ---------------------------------------------------------------------------
  const [themeColors, setThemeColors] = useState({ ...DEFAULT_COLORS });
  const [colorDrafts, setColorDrafts] = useState({ ...DEFAULT_COLORS });
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ---------------------------------------------------------------------------
  // Save State
  // ---------------------------------------------------------------------------
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // ---------------------------------------------------------------------------
  // Popup Management State
  // ---------------------------------------------------------------------------
  const [popupFilterStatus, setPopupFilterStatus] = useState<PopupFilterStatus>('All');
  const [popupSearchQuery, setPopupSearchQuery] = useState('');
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [popupFormData, setPopupFormData] = useState<Partial<Popup>>({
    name: '',
    image: '',
    url: '',
    urlType: 'Internal',
    priority: 0,
    status: 'Draft'
  });

  // ---------------------------------------------------------------------------
  // Carousel Management State
  // ---------------------------------------------------------------------------
  const [carouselFilterStatus, setCarouselFilterStatus] = useState<CarouselFilterStatus>('All');
  const [carouselSearchQuery, setCarouselSearchQuery] = useState('');
  const [isCarouselModalOpen, setIsCarouselModalOpen] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<CarouselItem | null>(null);
  const [carouselFormData, setCarouselFormData] = useState<Partial<CarouselItem>>({
    name: '',
    image: '',
    mobileImage: '',
    url: '',
    urlType: 'Internal',
    serial: 1,
    status: 'Publish'
  });
  const [isCarouselSaving, setIsCarouselSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Campaign Management State
  // ---------------------------------------------------------------------------
  const [campaignFilterStatus, setCampaignFilterStatus] = useState<CampaignFilterStatus>('All');
  const [campaignSearchQuery, setCampaignSearchQuery] = useState('');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignFormData, setCampaignFormData] = useState<Partial<Campaign>>({
    name: '',
    logo: '',
    startDate: '',
    endDate: '',
    url: '',
    status: 'Publish',
    serial: 1
  });

  // ---------------------------------------------------------------------------
  // File Input Refs
  // ---------------------------------------------------------------------------
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const headerLogoInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);
  const carouselDesktopInputRef = useRef<HTMLInputElement>(null);
  const carouselMobileInputRef = useRef<HTMLInputElement>(null);
  const popupImageInputRef = useRef<HTMLInputElement>(null);
  const campaignLogoInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Demo Modal State
  // ---------------------------------------------------------------------------
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoImage, setDemoImage] = useState<string>('');
  const [demoTitle, setDemoTitle] = useState<string>('');

  // ---------------------------------------------------------------------------
  // Gallery Picker State
  // ---------------------------------------------------------------------------
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<ImageUploadType | null>(null);

  const openGalleryPicker = (target: ImageUploadType) => {
    setGalleryPickerTarget(target);
    setIsGalleryPickerOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (!galleryPickerTarget) return;
    
    switch (galleryPickerTarget) {
      case 'carousel':
        setCarouselFormData(p => ({ ...p, image: imageUrl }));
        break;
      case 'carouselMobile':
        setCarouselFormData(p => ({ ...p, mobileImage: imageUrl }));
        break;
      case 'popup':
        setPopupFormData(p => ({ ...p, image: imageUrl }));
        break;
      case 'logo':
        setWebsiteConfiguration(p => ({ ...p, headerLogo: imageUrl }));
        break;
      case 'headerLogo':
        setWebsiteConfiguration(p => ({ ...p, headerLogo: imageUrl }));
        break;
      case 'footerLogo':
        setWebsiteConfiguration(p => ({ ...p, footerLogo: imageUrl }));
        break;
      case 'favicon':
        setWebsiteConfiguration(p => ({ ...p, favicon: imageUrl }));
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Sync active activeTab with initialTab prop
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Track previous tenantId to reset state on tenant change ONLY
  const prevTenantIdRef = useRef<string>(tenantId);
  const hasLoadedInitialConfig = useRef(false);
  const hasUnsavedChangesRef = useRef(false);
  const prevWebsiteConfigRef = useRef<WebsiteConfig | null>(null);
  
  // Expose unsaved changes flag getter function to prevent data refresh overwrites
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Return true if there are unsaved changes OR if we just saved (within protection window)
      (window as any).__getAdminCustomizationUnsavedChanges = () => {
        const timeSinceLastSave = Date.now() - lastSaveTimestampRef.current;
        const isWithinProtectionWindow = timeSinceLastSave < SAVE_PROTECTION_MS;
        if (isWithinProtectionWindow) {
          console.log('[AdminCustomization] Within save protection window, blocking refresh');
          return true;
        }
        return hasUnsavedChangesRef.current;
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__getAdminCustomizationUnsavedChanges;
      }
    };
  }, []);
  
  // Track if we're in the middle of saving to prevent loop
  const isSavingRef = useRef(false);
  
  // Track last save timestamp to prevent socket refresh from overwriting just-saved data
  const lastSaveTimestampRef = useRef<number>(0);
  const SAVE_PROTECTION_MS = 3000; // Protect for 3 seconds after save
  
  useEffect(() => {
    // Skip if we're currently saving - this prevents the loop
    if (isSavingRef.current) {
      return;
    }
    
    // On tenant change, reload config from prop
    if (prevTenantIdRef.current !== tenantId) {
      console.log('[AdminCustomization] Tenant changed, reloading config:', {
        oldTenant: prevTenantIdRef.current,
        newTenant: tenantId,
        carouselCount: websiteConfig?.carouselItems?.length || 0,
        socialLinksCount: websiteConfig?.socialLinks?.length || 0,
        addressesCount: websiteConfig?.addresses?.length || 0,
        socialLinks: websiteConfig?.socialLinks
      });
      prevTenantIdRef.current = tenantId;
      hasLoadedInitialConfig.current = false;
      hasUnsavedChangesRef.current = false; // Reset on tenant change
      
      if (websiteConfig) {
        setWebsiteConfiguration({
          ...DEFAULT_WEBSITE_CONFIG,
          ...websiteConfig,
          // Ensure all array fields are properly initialized
          addresses: websiteConfig.addresses || [],
          emails: websiteConfig.emails || [],
          phones: websiteConfig.phones || [],
          socialLinks: websiteConfig.socialLinks || [],
          footerQuickLinks: websiteConfig.footerQuickLinks || [],
          footerUsefulLinks: websiteConfig.footerUsefulLinks || [],
          showFlashSaleCounter: websiteConfig.showFlashSaleCounter ?? true,
          headerLogo: websiteConfig.headerLogo ?? null,
          footerLogo: websiteConfig.footerLogo ?? null,
          campaigns: websiteConfig.campaigns || [],
          carouselItems: websiteConfig.carouselItems || [],
          popups: websiteConfig.popups || [],
          categorySectionStyle: websiteConfig.categorySectionStyle || DEFAULT_WEBSITE_CONFIG.categorySectionStyle
        });
        hasLoadedInitialConfig.current = true;
      }
    } 
    // Initial load if not yet loaded
    else if (!hasLoadedInitialConfig.current && websiteConfig) {
      console.log('[AdminCustomization] Initial config load:', {
        tenantId,
        carouselCount: websiteConfig.carouselItems?.length || 0,
        socialLinksCount: websiteConfig.socialLinks?.length || 0,
        addressesCount: websiteConfig.addresses?.length || 0,
        emailsCount: websiteConfig.emails?.length || 0,
        phonesCount: websiteConfig.phones?.length || 0,
        socialLinks: websiteConfig.socialLinks
      });
      setWebsiteConfiguration({
        ...DEFAULT_WEBSITE_CONFIG,
        ...websiteConfig,
        // Ensure all array fields are properly initialized
        addresses: websiteConfig.addresses || [],
        emails: websiteConfig.emails || [],
        phones: websiteConfig.phones || [],
        socialLinks: websiteConfig.socialLinks || [],
        footerQuickLinks: websiteConfig.footerQuickLinks || [],
        footerUsefulLinks: websiteConfig.footerUsefulLinks || [],
        showFlashSaleCounter: websiteConfig.showFlashSaleCounter ?? true,
        headerLogo: websiteConfig.headerLogo ?? null,
        footerLogo: websiteConfig.footerLogo ?? null,
        campaigns: websiteConfig.campaigns || [],
        carouselItems: websiteConfig.carouselItems || [],
        popups: websiteConfig.popups || [],
        categorySectionStyle: websiteConfig.categorySectionStyle || DEFAULT_WEBSITE_CONFIG.categorySectionStyle
      });
      hasLoadedInitialConfig.current = true;
      hasUnsavedChangesRef.current = false; // Clear on initial load
    }
    // IMPORTANT: Do NOT sync from prop after initial load unless tenant changes
    // This prevents losing unsaved local changes when parent re-renders
  }, [tenantId, websiteConfig]); // Include websiteConfig to hydrate defaults once it loads

  // Track local changes to mark as unsaved
  useEffect(() => {
    // Only mark as unsaved if config has loaded AND config actually changed from previous value
    if (hasLoadedInitialConfig.current && prevWebsiteConfigRef.current) {
      const configChanged = JSON.stringify(websiteConfiguration) !== JSON.stringify(prevWebsiteConfigRef.current);
      if (configChanged) {
        hasUnsavedChangesRef.current = true;
        console.log('[AdminCustomization] Local changes detected:', {
          carouselCount: websiteConfiguration.carouselItems?.length,
          prevCarouselCount: prevWebsiteConfigRef.current.carouselItems?.length
        });
      }
    }
    // Always update prevWebsiteConfigRef to track latest state
    prevWebsiteConfigRef.current = websiteConfiguration;
  }, [websiteConfiguration]);

  // Auto-convert base64 branding images to uploaded URLs
  useEffect(() => {
    const convertBase64BrandingImages = async () => {
      const updates: Partial<WebsiteConfig> = {};
      let hasUpdates = false;

      // Check and convert headerLogo
      if (websiteConfiguration.headerLogo && isBase64Image(websiteConfiguration.headerLogo)) {
        try {
          console.log('[AdminCustomization] Converting base64 headerLogo to uploaded URL');
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.headerLogo, tenantId, 'branding');
          updates.headerLogo = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert headerLogo:', err);
        }
      }

      // Check and convert footerLogo
      if (websiteConfiguration.footerLogo && isBase64Image(websiteConfiguration.footerLogo)) {
        try {
          console.log('[AdminCustomization] Converting base64 footerLogo to uploaded URL');
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.footerLogo, tenantId, 'branding');
          updates.footerLogo = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert footerLogo:', err);
        }
      }

      // Check and convert favicon
      if (websiteConfiguration.favicon && isBase64Image(websiteConfiguration.favicon)) {
        try {
          console.log('[AdminCustomization] Converting base64 favicon to uploaded URL');
          const uploadedUrl = await convertBase64ToUploadedUrl(websiteConfiguration.favicon, tenantId, 'branding');
          updates.favicon = uploadedUrl;
          hasUpdates = true;
        } catch (err) {
          console.error('[AdminCustomization] Failed to convert favicon:', err);
        }
      }

      // Apply updates if any
      if (hasUpdates) {
        setWebsiteConfiguration(prev => ({ ...prev, ...updates }));
        console.log('[AdminCustomization] Base64 branding images converted to URLs:', updates);
      }
    };

    // Only run if config is loaded and there are potential base64 images
    if (hasLoadedInitialConfig.current) {
      convertBase64BrandingImages();
    }
  }, [tenantId]); // Only run on mount or tenant change, not on every config change

  // Sync theme colors with prop
  useEffect(() => {
    if (themeConfig) {
      setThemeColors({
        primary: themeConfig.primaryColor,
        secondary: themeConfig.secondaryColor,
        tertiary: themeConfig.tertiaryColor,
        font: themeConfig.fontColor || DEFAULT_COLORS.font,
        hover: themeConfig.hoverColor || DEFAULT_COLORS.hover,
        surface: themeConfig.surfaceColor || DEFAULT_COLORS.surface,
        adminBg: themeConfig.adminBgColor || DEFAULT_COLORS.adminBg,
        adminInputBg: themeConfig.adminInputBgColor || DEFAULT_COLORS.adminInputBg,
        adminBorder: themeConfig.adminBorderColor || DEFAULT_COLORS.adminBorder,
        adminFocus: themeConfig.adminFocusColor || DEFAULT_COLORS.adminFocus
      });
      setIsDarkMode(themeConfig.darkMode);
    }
  }, [themeConfig]);

  // Sync color colorDrafts with theme themeColors
  useEffect(() => {
    setColorDrafts(themeColors);
  }, [themeColors]);

  // ---------------------------------------------------------------------------
  // Theme Color Handlers
  // ---------------------------------------------------------------------------

  const updateThemeColor = (colorKey: ColorKey, value: string): void => {
    const normalized = normalizeHexColor(value);
    if (normalized) {
      setThemeColors((prev) => ({ ...prev, [colorKey]: normalized }));
    }
  };

  // ---------------------------------------------------------------------------
  // Image Upload Handlers
  // ---------------------------------------------------------------------------

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    imageType: ImageUploadType
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 2MB.');
      event.target.value = '';
      return;
    }

    try {
      let convertedImage: string;

      // Process image based on type
      if (imageType === 'carousel') {
        convertedImage = await convertCarouselImage(file, { quality: 0.85 });
      } else if (imageType === 'carouselMobile') {
        convertedImage = await convertCarouselImage(file, {
          width: CAROUSEL_MOBILE_WIDTH,
          height: CAROUSEL_MOBILE_HEIGHT,
          quality: 0.85
        });
      } else {
        convertedImage = await convertFileToWebP(file, {
          quality: imageType === 'favicon' ? 0.9 : 0.82,
          maxDimension: imageType === 'favicon' ? 512 : 2000
        });
      }

      // Handle the converted image based on type
      if (imageType === 'carousel' || imageType === 'carouselMobile') {
        const webpFile = dataUrlToFile(
          convertedImage,
          `${imageType === 'carouselMobile' ? 'carousel-mobile' : 'carousel'}-${Date.now()}.webp`
        );
        const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'carousel');
        setCarouselFormData((prev) =>
          imageType === 'carousel'
            ? { ...prev, image: uploadedUrl }
            : { ...prev, mobileImage: uploadedUrl }
        );
      } else if (imageType === 'logo' || imageType === 'favicon' || imageType === 'headerLogo' || imageType === 'footerLogo') {
        // Upload branding images to server instead of storing base64
        const filename = `${imageType}-${Date.now()}.webp`;
        const webpFile = dataUrlToFile(convertedImage, filename);
        const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'branding');
        
        if (imageType === 'logo') {
          onUpdateLogo(uploadedUrl);
        } else if (imageType === 'favicon') {
          setWebsiteConfiguration((prev) => ({ ...prev, favicon: uploadedUrl }));
        } else if (imageType === 'headerLogo') {
          setWebsiteConfiguration((prev) => ({ ...prev, headerLogo: uploadedUrl }));
        } else if (imageType === 'footerLogo') {
          setWebsiteConfiguration((prev) => ({ ...prev, footerLogo: uploadedUrl }));
        }
      } else if (imageType === 'popup') {
        setPopupFormData((prev) => ({ ...prev, image: convertedImage }));
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveImage = (imageType: 'logo' | 'favicon' | 'headerLogo' | 'footerLogo'): void => {
    if (imageType === 'logo') {
      onUpdateLogo(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    } else if (imageType === 'favicon') {
      setWebsiteConfiguration((prev) => ({ ...prev, favicon: null }));
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    } else if (imageType === 'headerLogo') {
      setWebsiteConfiguration((prev) => ({ ...prev, headerLogo: null }));
      if (headerLogoInputRef.current) headerLogoInputRef.current.value = '';
    } else {
      setWebsiteConfiguration((prev) => ({ ...prev, footerLogo: null }));
      if (footerLogoInputRef.current) footerLogoInputRef.current.value = '';
    }
  };

  // ---------------------------------------------------------------------------
  // Contact Information Handlers (addresses, emails, phones)
  // ---------------------------------------------------------------------------

  const addContactItem = (field: 'addresses' | 'emails' | 'phones'): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const updateContactItem = (
    field: 'addresses' | 'emails' | 'phones',
    index: number,
    value: string
  ): void => {
    setWebsiteConfiguration((prev) => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const removeContactItem = (field: 'addresses' | 'emails' | 'phones', index: number): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // ---------------------------------------------------------------------------
  // Social Links Handlers
  // ---------------------------------------------------------------------------

  const addSocialLink = (): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { id: Date.now().toString(), platform: 'Facebook', url: '' }
      ]
    }));
  };

  const updateSocialLink = (index: number, key: keyof SocialLink, value: string): void => {
    setWebsiteConfiguration((prev) => {
      const updated = [...prev.socialLinks];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, socialLinks: updated };
    });
  };

  const removeSocialLink = (index: number): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  // ---------------------------------------------------------------------------
  // Footer Links Handlers
  // ---------------------------------------------------------------------------

  const addFooterLink = (field: FooterLinkField): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: [
        ...((prev[field] as FooterLink[]) || []),
        { id: Date.now().toString(), label: '', url: '' }
      ]
    }));
  };

  const updateFooterLink = (
    field: FooterLinkField,
    index: number,
    key: keyof FooterLink,
    value: string
  ): void => {
    setWebsiteConfiguration((prev) => {
      const updated = [...((prev[field] as FooterLink[]) || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [field]: updated };
    });
  };

  const removeFooterLink = (field: FooterLinkField, index: number): void => {
    setWebsiteConfiguration((prev) => ({
      ...prev,
      [field]: ((prev[field] as FooterLink[]) || []).filter((_, i) => i !== index)
    }));
  };

  // ---------------------------------------------------------------------------
  // Demo Preview Handler
  // ---------------------------------------------------------------------------

  const handleShowDemo = (sectionKey: string, styleValue: string, sectionTitle: string): void => {
    // Map demo images based on section and style
    if (sectionKey === 'categorySectionStyle') {
      if (styleValue === 'mobile2') {
        setDemoImage('https://i.postimg.cc/YCHXKTXz/image.png'); // Replace with actual image URL
        setDemoTitle(`${sectionTitle} - Mobile Style 2 Demo`);
        setDemoModalOpen(true);
      } else if (styleValue === 'mobile1') {
        setDemoImage('https://i.ibb.co/example-mobile1.png'); // Replace with actual image URL
        setDemoTitle(`${sectionTitle} - Mobile Style 1 Demo`);
        setDemoModalOpen(true);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Save All Changes Handler
  // ---------------------------------------------------------------------------

  const handleSaveChanges = async (): Promise<void> => {
    if (isSaving) return;

    console.log('[AdminCustomization] ====== SAVE BUTTON CLICKED ======');
    console.log('[AdminCustomization] websiteConfiguration state:', {
      carouselCount: websiteConfiguration.carouselItems?.length || 0,
      campaignCount: websiteConfiguration.campaigns?.length || 0,
      socialLinksCount: websiteConfiguration.socialLinks?.length || 0,
      addressesCount: websiteConfiguration.addresses?.length || 0,
      emailsCount: websiteConfiguration.emails?.length || 0,
      phonesCount: websiteConfiguration.phones?.length || 0,
      hasCarouselItems: !!websiteConfiguration.carouselItems,
      socialLinks: websiteConfiguration.socialLinks
    });

    setIsSaving(true);
    isSavingRef.current = true; // Set ref to prevent prop sync during save
    setIsSaved(false);
    const loadingToast = toast.loading('Saving changes...');
    const startTime = Date.now();

    try {
      // Save website configuration
      if (onUpdateWebsiteConfig) {
        console.log('[AdminCustomization] Calling onUpdateWebsiteConfig with:', {
          carouselCount: websiteConfiguration.carouselItems?.length || 0,
          campaignCount: websiteConfiguration.campaigns?.length || 0,
          socialLinksCount: websiteConfiguration.socialLinks?.length || 0,
          addressesCount: websiteConfiguration.addresses?.length || 0,
          categorySectionStyle: websiteConfiguration.categorySectionStyle,
          websiteName: websiteConfiguration.websiteName
        });
        await onUpdateWebsiteConfig(websiteConfiguration);
        console.log('[AdminCustomization] onUpdateWebsiteConfig completed successfully');
      } else {
        console.warn('[AdminCustomization] onUpdateWebsiteConfig is not defined!');
      }

      // Save theme configuration
      if (onUpdateTheme) {
        const themePayload = {
          primaryColor: themeColors.primary,
          secondaryColor: themeColors.secondary,
          tertiaryColor: themeColors.tertiary,
          fontColor: themeColors.font,
          hoverColor: themeColors.hover,
          surfaceColor: themeColors.surface,
          darkMode: isDarkMode,
          adminBgColor: themeColors.adminBg,
          adminInputBgColor: themeColors.adminInputBg,
          adminBorderColor: themeColors.adminBorder,
          adminFocusColor: themeColors.adminFocus
        };
        console.log('[AdminCustomization] Saving theme config:', themePayload);
        await onUpdateTheme(themePayload);
        console.log('[AdminCustomization] Theme config saved successfully');
      } else {
        console.warn('[AdminCustomization] onUpdateTheme is not defined!');
      }

      // Ensure minimum 1 second loading time for better UX
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      setIsSaved(true);
      hasUnsavedChangesRef.current = false; // Clear unsaved changes flag after successful save
      prevWebsiteConfigRef.current = websiteConfiguration; // Sync prev ref to saved state
      lastSaveTimestampRef.current = Date.now(); // Set save protection timestamp
      console.log('[AdminCustomization] ====== SAVE COMPLETED SUCCESSFULLY ======');
      toast.success('Saved successfully!');
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error('[AdminCustomization] ====== SAVE FAILED ======', error);
      toast.dismiss(loadingToast);
      console.error('Save failed:', error);
      toast.error('Save failed. Please try again.');
    } finally {
      setIsSaving(false);
      // Clear saving ref after a delay to allow socket updates to settle
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2000);
    }
  };

  // ---------------------------------------------------------------------------
  // Carousel Handlers
  // ---------------------------------------------------------------------------

  const openCarouselModal = (carouselItem?: CarouselItem): void => {
    if (carouselItem) {
      setEditingCarousel(carouselItem);
      setCarouselFormData({ ...carouselItem });
    } else {
      setEditingCarousel(null);
      setCarouselFormData({
        name: '',
        image: '',
        mobileImage: '',
        url: '',
        urlType: 'Internal',
        serial: websiteConfiguration.carouselItems.length + 1,
        status: 'Publish'
      });
    }
    setIsCarouselModalOpen(true);
  };

  const handleSaveCarousel = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (isCarouselSaving || !carouselFormData.image) {
      if (!carouselFormData.image) {
        toast.error('Upload desktop banner.');
      }
      return;
    }

    setIsCarouselSaving(true);
    isSavingRef.current = true; // Prevent prop sync during save
    const startTime = Date.now();

    try {
      let desktopImage = carouselFormData.image || '';
      let mobileImage = carouselFormData.mobileImage || '';

      // Upload base64 images if needed
      if (isBase64Image(desktopImage)) {
        toast.loading('Uploading desktop image...', { id: 'carousel-handleImageUpload' });
        desktopImage = await convertBase64ToUploadedUrl(desktopImage, tenantId, 'carousel');
        toast.dismiss('carousel-handleImageUpload');
      }

      if (mobileImage && isBase64Image(mobileImage)) {
        toast.loading('Uploading mobile image...', { id: 'carousel-mobile-handleImageUpload' });
        mobileImage = await convertBase64ToUploadedUrl(mobileImage, tenantId, 'carousel');
        toast.dismiss('carousel-mobile-handleImageUpload');
      }

      const carouselItem: CarouselItem = {
        id: editingCarousel?.id || Date.now().toString(),
        name: carouselFormData.name || 'Untitled',
        image: desktopImage,
        mobileImage: mobileImage,
        url: carouselFormData.url || '#',
        urlType: (carouselFormData.urlType as 'Internal' | 'External') || 'Internal',
        serial: Number(carouselFormData.serial),
        status: (carouselFormData.status as 'Publish' | 'Draft') || 'Publish'
      };

      const updatedItems = editingCarousel
        ? websiteConfiguration.carouselItems.map((item) =>
            item.id === editingCarousel.id ? carouselItem : item
          )
        : [...websiteConfiguration.carouselItems, carouselItem];

      const updatedConfig = { ...websiteConfiguration, carouselItems: updatedItems };
      
      console.log('[Carousel Save] Saving carousel item:', {
        carouselId: carouselItem.id,
        carouselName: carouselItem.name,
        totalCarousels: updatedItems.length,
        isEdit: !!editingCarousel
      });
      
      toast.loading('Saving carousel...', { id: 'carousel-save' });
      
      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
        console.log('[Carousel Save] Successfully saved to backend');
      }

      // Update local state only after successful save
      setWebsiteConfiguration(updatedConfig);
      // Mark as saved - do NOT trigger unsaved changes
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      // Record save timestamp to prevent socket refresh from overwriting
      lastSaveTimestampRef.current = Date.now();
      console.log('[Carousel Save] Set save protection timestamp');

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss('carousel-save');
      toast.success(editingCarousel ? 'Carousel updated successfully!' : 'Carousel added successfully!');
      setIsCarouselModalOpen(false);
    } catch (error) {
      console.error('Carousel save failed:', error);
      toast.error('Failed to save carousel. Please try again.');
    } finally {
      setIsCarouselSaving(false);
      // Clear saving ref after a delay to allow prop updates to settle
      setTimeout(() => {
        isSavingRef.current = false;
      }, 2000);
    }
  };

  const handleDeleteCarousel = async (carouselId: string): Promise<void> => {
    if (confirm('Delete carousel?')) {
      const loadingToast = toast.loading('Deleting carousel...');
      const startTime = Date.now();
      isSavingRef.current = true; // Prevent prop sync during delete
      
      try {
        const updatedConfig = {
          ...websiteConfiguration,
          carouselItems: websiteConfiguration.carouselItems.filter((item) => item.id !== carouselId)
        };
        
        // Persist the deletion to the server
        if (onUpdateWebsiteConfig) {
          await onUpdateWebsiteConfig(updatedConfig);
        }

        // Update local state after successful save
        setWebsiteConfiguration(updatedConfig);
        // Mark as saved and set protection timestamp
        hasUnsavedChangesRef.current = false;
        prevWebsiteConfigRef.current = updatedConfig;
        lastSaveTimestampRef.current = Date.now();

        // Ensure minimum 1 second loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }

        toast.dismiss(loadingToast);
        toast.success('Carousel deleted successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Delete failed:', error);
        toast.error('Failed to delete carousel');
      } finally {
        // Clear saving ref after a delay to allow prop updates to settle
        setTimeout(() => {
          isSavingRef.current = false;
        }, 2000);
      }
    }
  };

  // Filter carousel items based on status and search
  const filteredCarouselItems = websiteConfiguration.carouselItems.filter(
    (item) =>
      (carouselFilterStatus === 'All' || item.status === carouselFilterStatus) &&
      item.name.toLowerCase().includes(carouselSearchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Campaign Handlers
  // ---------------------------------------------------------------------------

  const openCampaignModal = (campaign?: Campaign): void => {
    if (campaign) {
      setEditingCampaign(campaign);
      setCampaignFormData({ ...campaign });
    } else {
      setEditingCampaign(null);
      setCampaignFormData({
        name: '',
        logo: '',
        startDate: '',
        endDate: '',
        url: '',
        serial: (websiteConfiguration.campaigns?.length || 0) + 1,
        status: 'Publish'
      });
    }
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const loadingToast = toast.loading('Saving campaign...');
    const startTime = Date.now();

    try {
      const campaign: Campaign = {
        id: editingCampaign?.id || Date.now().toString(),
        name: campaignFormData.name || 'Untitled',
        logo: campaignFormData.logo || '',
        startDate: campaignFormData.startDate || new Date().toISOString(),
        endDate: campaignFormData.endDate || new Date().toISOString(),
        url: campaignFormData.url || '#',
        serial: Number(campaignFormData.serial),
        status: campaignFormData.status as 'Publish' | 'Draft'
      };

      const updatedConfig = {
        ...websiteConfiguration,
        campaigns: editingCampaign
          ? (websiteConfiguration.campaigns || []).map((item) =>
              item.id === editingCampaign.id ? campaign : item
            )
          : [...(websiteConfiguration.campaigns || []), campaign]
      };

      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
      }

      // Update local state after successful save
      setWebsiteConfiguration(updatedConfig);
      // Mark as saved and set protection timestamp
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      lastSaveTimestampRef.current = Date.now();

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success(editingCampaign ? 'Campaign updated!' : 'Campaign added!');
      setIsCampaignModalOpen(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Campaign save failed:', error);
      toast.error('Failed to save campaign.');
    }
  };

  const handleDeleteCampaign = async (campaignId: string): Promise<void> => {
    if (confirm('Delete campaign?')) {
      const loadingToast = toast.loading('Deleting campaign...');
      const startTime = Date.now();
      
      try {
        const updatedConfig = {
          ...websiteConfiguration,
          campaigns: (websiteConfiguration.campaigns || []).filter((item) => item.id !== campaignId)
        };

        if (onUpdateWebsiteConfig) {
          await onUpdateWebsiteConfig(updatedConfig);
        }

        // Update local state after successful save
        setWebsiteConfiguration(updatedConfig);
        // Mark as saved and set protection timestamp
        hasUnsavedChangesRef.current = false;
        prevWebsiteConfigRef.current = updatedConfig;
        lastSaveTimestampRef.current = Date.now();

        // Ensure minimum 1 second loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }

        toast.dismiss(loadingToast);
        toast.success('Campaign deleted successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Delete failed:', error);
        toast.error('Failed to delete campaign');
      }
    }
  };

  const handleCampaignLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const convertedImage = await convertFileToWebP(file, {
        quality: 0.85,
        maxDimension: 400
      });
      const webpFile = dataUrlToFile(convertedImage, `campaign-${Date.now()}.webp`);
      const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'carousel');
      setCampaignFormData((prev) => ({ ...prev, logo: uploadedUrl }));
    } catch {
      toast.error('Upload failed.');
    }

    if (campaignLogoInputRef.current) {
      campaignLogoInputRef.current.value = '';
    }
  };

  // Filter campaigns based on status and search
  const filteredCampaigns = (websiteConfiguration.campaigns || []).filter(
    (campaign) =>
      (campaignFilterStatus === 'All' || campaign.status === campaignFilterStatus) &&
      campaign.name.toLowerCase().includes(campaignSearchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Popup Handlers
  // ---------------------------------------------------------------------------

  const openPopupModal = (popup?: Popup): void => {
    if (popup) {
      setEditingPopup(popup);
      setPopupFormData(popup);
    } else {
      setEditingPopup(null);
      setPopupFormData({
        name: '',
        image: '',
        url: '',
        urlType: 'Internal',
        priority: 0,
        status: 'Draft'
      });
    }
    setIsPopupModalOpen(true);
  };

  const handleSavePopup = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!popupFormData.name || !popupFormData.image) {
      toast.error('Please fill all required fields');
      return;
    }

    const loadingToast = toast.loading('Saving popup...');
    const startTime = Date.now();

    try {
      const popup: Popup = {
        id: editingPopup?.id || Date.now(),
        name: popupFormData.name,
        image: popupFormData.image,
        url: popupFormData.url || '',
        urlType: popupFormData.urlType as 'Internal' | 'External',
        priority: Number(popupFormData.priority),
        status: popupFormData.status as 'Draft' | 'Publish',
        createdAt: editingPopup?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPopups = editingPopup
        ? (websiteConfiguration.popups || []).map((item) =>
            item.id === editingPopup.id ? popup : item
          )
        : [...(websiteConfiguration.popups || []), popup];

      const updatedConfig = { ...websiteConfiguration, popups: updatedPopups };

      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
      }

      // Update local state after successful save
      setWebsiteConfiguration(updatedConfig);
      // Mark as saved and set protection timestamp
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      lastSaveTimestampRef.current = Date.now();

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success(editingPopup ? 'Popup updated successfully!' : 'Popup added successfully!');
      setIsPopupModalOpen(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Popup save failed:', error);
      toast.error('Failed to save popup');
    }
  };

  const handleDeletePopup = async (popupId: number): Promise<void> => {
    if (confirm('Delete popup?')) {
      const loadingToast = toast.loading('Deleting popup...');
      const startTime = Date.now();

      try {
        const updatedConfig = {
          ...websiteConfiguration,
          popups: (websiteConfiguration.popups || []).filter((item) => item.id !== popupId)
        };

        if (onUpdateWebsiteConfig) {
          await onUpdateWebsiteConfig(updatedConfig);
        }

        // Update local state after successful save
        setWebsiteConfiguration(updatedConfig);
        // Mark as saved and set protection timestamp
        hasUnsavedChangesRef.current = false;
        prevWebsiteConfigRef.current = updatedConfig;
        lastSaveTimestampRef.current = Date.now();

        // Ensure minimum 1 second loading time
        const elapsed = Date.now() - startTime;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }

        toast.dismiss(loadingToast);
        toast.success('Popup deleted successfully!');
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Delete failed:', error);
        toast.error('Failed to delete popup');
      }
    }
  };

  const handleTogglePopupStatus = async (popup: Popup): Promise<void> => {
    const loadingToast = toast.loading('Updating status...');
    const startTime = Date.now();

    try {
      const updatedPopups = (websiteConfiguration.popups || []).map((item) =>
        item.id === popup.id
          ? {
              ...item,
              status: item.status === 'Draft' ? 'Publish' : 'Draft',
              updatedAt: new Date().toISOString()
            }
          : item
      );

      const updatedConfig = { ...websiteConfiguration, popups: updatedPopups };

      if (onUpdateWebsiteConfig) {
        await onUpdateWebsiteConfig(updatedConfig);
      }

      // Update local state after successful save
      setWebsiteConfiguration(updatedConfig);
      // Mark as saved and set protection timestamp
      hasUnsavedChangesRef.current = false;
      prevWebsiteConfigRef.current = updatedConfig;
      lastSaveTimestampRef.current = Date.now();

      // Ensure minimum 1 second loading time
      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success('Status updated!');
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Status update failed:', error);
      toast.error('Failed to update status');
    }
  };

  // Filter popups based on status and search
  const filteredPopups = (websiteConfiguration.popups || []).filter(
    (popup) =>
      (popupFilterStatus === 'All' || popup.status === popupFilterStatus) &&
      popup.name.toLowerCase().includes(popupSearchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Sub-components for better organization
  // ---------------------------------------------------------------------------

  const TabButton: React.FC<{
    id: string;
    label: string;
    icon?: React.ReactNode;
  }> = ({ id, label, icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
        activeTab === id
          ? 'border-green-600 text-green-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon} {label}
    </button>
  );

  const ActionButton: React.FC<
    React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }
  > = ({ children, variant = '', className = '', ...props }) => (
    <button
      className={`px-4 py-2 rounded-lg text-sm font-bold ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-gray-50 z-30 pt-4 pb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Customization</h2>
          <p className="text-sm text-gray-500">Manage appearance and content</p>
        </div>
        <button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all shadow-lg min-w-[160px] justify-center ${
            isSaved
              ? 'bg-emerald-500 text-white'
              : isSaving
              ? 'bg-green-500 text-white cursor-wait'
              : 'bg-green-600 text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8]'
          }`}
        >
          {isSaved ? (
            <>
              <CheckCircle2 size={18} className="animate-bounce" />
              Saved!
            </>
          ) : isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
      </div>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide bg-white rounded-t-xl">
        <TabButton id="carousel" label="Carousel" icon={<ImageIcon size={18} />} />
        <TabButton id="campaigns" label="Campaigns" icon={<CalendarDays size={18} />} />
        <TabButton id="popup" label="Popup" icon={<Layers size={18} />} />
        <TabButton id="website_info" label="Website Information" icon={<Globe size={18} />} />
        <TabButton id="chat_settings" label="Chat Settings" icon={<MessageCircle size={18} />} />
        <TabButton id="theme_view" label="Theme View" icon={<Layout size={18} />} />
        <TabButton id="theme_colors" label="Theme Colors" icon={<Palette size={18} />} />
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl border border-t-0 border-gray-200 shadow-sm p-6 min-h-[500px]">
        {/* ================================================================== */}
        {/* Carousel Tab */}
        {/* ================================================================== */}
        {activeTab === 'carousel' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['All', 'Publish', 'Draft', 'Trash'] as CarouselFilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setCarouselFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                      carouselFilterStatus === status
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {status === 'All' ? 'All Data' : status}
                    {status === 'All' && (
                      <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">
                        {websiteConfiguration.carouselItems.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
                    value={carouselSearchQuery}
                    onChange={(e) => setCarouselSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                </div>
                <ActionButton
                  onClick={() => openCarouselModal()}
                  variant="bg-green-600 text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8] flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Carousel
                </ActionButton>
              </div>
            </div>

            {/* Carousel Table */}
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-green-50 text-gray-700 font-semibold text-xs uppercase border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" className="rounded" />
                    </th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Url</th>
                    <th className="px-4 py-3">Url Type</th>
                    <th className="px-4 py-3">Serial</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCarouselItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-16 h-10 bg-gray-100 rounded border overflow-hidden">
                          {item.image ? (
                            <img
                              src={normalizeImageUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.url}</td>
                      <td className="px-4 py-3 text-gray-500">{item.urlType}</td>
                      <td className="px-4 py-3 font-mono">{item.serial}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.status === 'Publish'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => openCarouselModal(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCarousel(item.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCarouselItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-gray-400">
                        <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
                        No carousel items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-end items-center gap-2">
              <span className="text-sm text-gray-600">1 of 1</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button disabled className="px-2 py-1 bg-gray-50 text-gray-400 border-r">
                  <ChevronLeft size={16} />
                </button>
                <button disabled className="px-2 py-1 bg-gray-50 text-gray-400">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* Campaigns Tab */}
        {/* ================================================================== */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                {(['All', 'Publish', 'Draft'] as CampaignFilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setCampaignFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                      campaignFilterStatus === status
                        ? 'bg-white text-green-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {status === 'All' ? 'All Campaigns' : status}
                    {status === 'All' && (
                      <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">
                        {(websiteConfiguration.campaigns || []).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={campaignSearchQuery}
                    onChange={(e) => setCampaignSearchQuery(e.target.value)}
                    placeholder="Search campaigns..."
                    className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <ActionButton
                  onClick={() => openCampaignModal()}
                  variant="bg-green-600 text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8] flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Campaign
                </ActionButton>
              </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white border rounded-xl overflow-hidden hover:shadow-lg group"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {campaign.logo ? (
                        <img
                          src={normalizeImageUrl(campaign.logo)}
                          alt={campaign.name}
                          className="w-16 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <CalendarDays className="text-gray-400" size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 truncate">{campaign.name}</h4>
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                            campaign.status === 'Publish'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Starts: {new Date(campaign.startDate).toLocaleDateString()}</p>
                      <p>Ends: {new Date(campaign.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex border-t divide-x">
                    <button
                      onClick={() => openCampaignModal(campaign)}
                      className="flex-1 px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium flex items-center justify-center gap-1"
                    >
                      <Edit size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center justify-center gap-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredCampaigns.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
                  <p>No campaigns found.</p>
                </div>
              )}
            </div>
          </div>
        )}
        {isCampaignModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsCampaignModalOpen(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b sticky top-0 bg-white z-10"><h3 className="text-xl font-bold">{editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}</h3></div>
              <form onSubmit={handleSaveCampaign} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label><input type="text" value={campaignFormData.name || ''} onChange={e => setCampaignFormData(p => ({ ...p, name: e.target.value }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" required/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Campaign Logo</label><div className="flex items-center gap-4">{campaignFormData.logo ? <img src={normalizeImageUrl(campaignFormData.logo)} alt="Logo" className="w-20 h-12 object-contain border rounded"/> : <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center"><ImageIcon className="text-gray-400" size={24}/></div>}<input type="file" ref={campaignLogoInputRef} accept="image/*" onChange={handleCampaignLogoUpload} className="hidden"/><button type="button" onClick={() => campaignLogoInputRef.current?.click()} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Upload Logo</button>{campaignFormData.logo && <button type="button" onClick={() => setCampaignFormData(p => ({ ...p, logo: '' }))} className="text-red-500 hover:text-red-700"><X size={20}/></button>}</div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label><input type="datetime-local" value={campaignFormData.startDate?.slice(0, 16) || ''} onChange={e => setCampaignFormData(p => ({ ...p, startDate: new Date(e.target.value).toISOString() }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label><input type="datetime-local" value={campaignFormData.endDate?.slice(0, 16) || ''} onChange={e => setCampaignFormData(p => ({ ...p, endDate: new Date(e.target.value).toISOString() }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" required/></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label><input type="text" value={campaignFormData.url || ''} onChange={e => setCampaignFormData(p => ({ ...p, url: e.target.value }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="https://..."/></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Order</label><input type="number" value={campaignFormData.serial || 1} onChange={e => setCampaignFormData(p => ({ ...p, serial: parseInt(e.target.value) }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" min={1}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={campaignFormData.status || 'Publish'} onChange={e => setCampaignFormData(p => ({ ...p, status: e.target.value as 'Publish' | 'Draft' }))} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"><option value="Publish">Publish</option><option value="Draft">Draft</option></select></div></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setIsCampaignModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button><button type="submit" className="flex-1 px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] font-medium">{editingCampaign ? 'Update' : 'Create'} Campaign</button></div>
              </form>
            </div>
          </div>
        )}
        {activeTab === 'popup' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">{['All', 'Publish', 'Draft'].map(s => <button key={s} onClick={() => setPopupFilterStatus(s as any)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${popupFilterStatus === s ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{s === 'All' ? 'All Data' : s}{s === 'All' && <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{(websiteConfiguration.popups || []).length}</span>}</button>)}</div>
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64"><input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={popupSearchQuery} onChange={e => setPopupSearchQuery(e.target.value)}/><Search className="absolute left-3 top-2.5 text-gray-400" size={16}/></div>
                <ActionButton onClick={() => openPopupModal()} variant="bg-green-600 text-white hover:from-[#2BAEE8] hover:to-[#1A7FE8] flex items-center gap-2"><Plus size={16}/>Add Popup</ActionButton>
              </div>
            </div>
            <div className="overflow-x-auto border rounded-lg shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b"><tr><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Image</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">URL</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th><th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th><th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th></tr></thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPopups.length === 0 ? <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No popups found</td></tr> : filteredPopups.map(p => <tr key={p.id} className="hover:bg-gray-50"><td className="px-4 py-3"><img src={p.image} alt={p.name} className="h-12 w-16 object-cover rounded border"/></td><td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td><td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">{p.url || '-'}</td><td className="px-4 py-3 text-sm text-gray-800">{p.priority || 0}</td><td className="px-4 py-3"><button onClick={() => handleTogglePopupStatus(p)} className={`px-3 py-1 rounded-full text-xs font-semibold ${p.status === 'Publish' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{p.status}</button></td><td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => openPopupModal(p)} className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Edit size={16}/></button><button onClick={() => handleDeletePopup(p.id)} className="p-1.5 hover:bg-red-50 rounded text-red-600"><Trash2 size={16}/></button></div></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'website_info' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {[{ r: logoInputRef, l: logo, t: 'logo' as const, n: 'Primary Store Logo (Fallback)' }, { r: headerLogoInputRef, l: websiteConfiguration.headerLogo, t: 'headerLogo' as const, n: 'Header Logo Override' }, { r: footerLogoInputRef, l: websiteConfiguration.footerLogo, t: 'footerLogo' as const, n: 'Footer Logo Override' }].map(x => (
                <div key={x.n} className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <div className="flex flex-col items-center gap-3"><ImageIcon size={32} className="text-gray-400"/><p className="text-sm font-bold text-gray-700">{x.n}</p>{x.l ? <img src={normalizeImageUrl(x.l)} alt="" className="h-12 max-w-[200px] object-contain my-2 border rounded p-1 bg-gray-50"/> : <p className="text-xs text-gray-400">No logo uploaded</p>}<div className="flex gap-2"><button onClick={() => x.r.current?.click()} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold">Select Image</button>{x.l && <button onClick={() => handleRemoveImage(x.t)} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-bold">Remove</button>}</div><input type="file" ref={x.r} onChange={e => handleImageUpload(e, x.t)} className="hidden" accept="image/*"/></div>
                </div>
              ))}
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 text-center"><div className="flex flex-col items-center gap-3"><Globe size={32} className="text-gray-400"/><p className="text-sm font-bold text-gray-700">Favicon (32x32px)</p>{websiteConfiguration.favicon && <img src={websiteConfiguration.favicon} alt="Favicon" className="w-8 h-8 object-contain my-2"/>}<div className="flex gap-2"><button onClick={() => faviconInputRef.current?.click()} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold">Select Image</button>{websiteConfiguration.favicon && <button onClick={() => handleRemoveImage('favicon')} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded font-bold">Remove</button>}</div><input type="file" ref={faviconInputRef} onChange={e => handleImageUpload(e, 'favicon')} className="hidden" accept="image/*"/></div></div>
              <div className="space-y-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Website Name*</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={websiteConfiguration.websiteName} onChange={e => setWebsiteConfiguration(p => ({ ...p, websiteName: e.target.value }))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={websiteConfiguration.shortDescription} onChange={e => setWebsiteConfiguration(p => ({ ...p, shortDescription: e.target.value }))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Whatsapp Number</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={websiteConfiguration.whatsappNumber} onChange={e => setWebsiteConfiguration(p => ({ ...p, whatsappNumber: e.target.value }))}/></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Admin Notice Text</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" placeholder="e.g., Easy return policy..." value={websiteConfiguration.adminNoticeText || ''} onChange={e => setWebsiteConfiguration(p => ({ ...p, adminNoticeText: e.target.value }))}/><p className="text-xs text-gray-500 mt-1">Scrolling ticker at top of store header.</p></div>
              </div>
            </div>
            <div className="space-y-6">
              {(['addresses', 'emails', 'phones'] as const).map(f => <div key={f} className="space-y-2"><ActionButton onClick={() => addContactItem(f)} variant="bg-green-600 text-white w-full flex items-center justify-center gap-2"><Plus size={16}/>Add New {f.slice(0, -1)}</ActionButton>{websiteConfiguration[f].map((v, i) => <div key={i} className="flex gap-2"><input type="text" value={v} onChange={e => updateContactItem(f, i, e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm"/><button onClick={() => removeContactItem(f, i)} className="bg-red-500 text-white p-2 rounded-lg"><Trash2 size={16}/></button></div>)}</div>)}
              <div className="space-y-2"><ActionButton onClick={addSocialLink} variant="bg-green-600 text-white w-full flex items-center justify-center gap-2"><Plus size={16}/>Add Social Link</ActionButton>{websiteConfiguration.socialLinks.map((l, i) => <div key={l.id} className="bg-gray-50 border p-3 rounded-lg space-y-2 relative"><div className="flex gap-2"><select value={l.platform} onChange={e => updateSocialLink(i, 'platform', e.target.value)} className="w-1/3 text-sm border rounded px-2 py-1">{SOCIAL_PLATFORM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}</select><input type="text" value={l.url} onChange={e => updateSocialLink(i, 'url', e.target.value)} className="flex-1 text-sm border rounded px-2 py-1" placeholder="URL"/></div><button onClick={() => removeSocialLink(i)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow"><Trash2 size={12}/></button></div>)}</div>
              <div className="space-y-4">{FOOTER_LINK_SECTIONS.map(s => <div key={s.field} className="border rounded-xl p-4 space-y-3 bg-white/60"><div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><p className="text-sm font-semibold text-gray-800">{s.title}</p><p className="text-xs text-gray-500">{s.helper}</p></div><button onClick={() => addFooterLink(s.field)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded font-bold flex items-center gap-1 self-start"><Plus size={14}/>Add Link</button></div>{((websiteConfiguration[s.field] as FooterLink[]) || []).length === 0 && <p className="text-xs text-gray-400">No links yet.</p>}{((websiteConfiguration[s.field] as FooterLink[]) || []).map((l, i) => <div key={l.id} className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2"><input type="text" value={l.label} onChange={e => updateFooterLink(s.field, i, 'label', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" placeholder="Label"/><input type="text" value={l.url} onChange={e => updateFooterLink(s.field, i, 'url', e.target.value)} className="px-3 py-2 border rounded-lg text-sm" placeholder="https://"/><button onClick={() => removeFooterLink(s.field, i)} className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-bold">Remove</button></div>)}</div>)}</div>
              <div className="space-y-3 pt-4 border-t">
                {[{ k: 'showMobileHeaderCategory', l: 'isShowMobileHeaderCategoryMenu' }, { k: 'showNewsSlider', l: 'Is Show News Slider' }, { k: 'hideCopyright', l: 'Hide Copyright Section' }, { k: 'hideCopyrightText', l: 'Hide Copyright Text' }, { k: 'showPoweredBy', l: 'Powered by SystemNext IT' }].map(x => <label key={x.k} className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 text-green-600 rounded" checked={websiteConfiguration[x.k as keyof WebsiteConfig] as boolean} onChange={e => setWebsiteConfiguration(p => ({ ...p, [x.k]: e.target.checked }))}/><span className="text-sm font-medium">{x.l}</span></label>)}
                {websiteConfiguration.showNewsSlider && <div className="ml-8 border rounded p-2 text-sm bg-gray-50"><p className="text-xs text-gray-500 mb-1">Header Slider Text</p><textarea className="w-full bg-transparent outline-none resize-none" rows={2} value={websiteConfiguration.headerSliderText} onChange={e => setWebsiteConfiguration(p => ({ ...p, headerSliderText: e.target.value }))}/></div>}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3"><div><p className="text-sm font-semibold text-gray-800">Flash Sale Counter</p><p className="text-xs text-gray-500">Show countdown pill beside Flash Sales.</p></div><button type="button" onClick={() => setWebsiteConfiguration(p => ({ ...p, showFlashSaleCounter: !p.showFlashSaleCounter }))} className={`relative inline-flex items-center rounded-full border px-1 py-0.5 text-xs font-bold ${websiteConfiguration.showFlashSaleCounter ? 'bg-emerald-500/10 text-emerald-700 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}><span className={`px-3 py-1 rounded-full ${websiteConfiguration.showFlashSaleCounter ? 'bg-white shadow' : 'opacity-50'}`}>{websiteConfiguration.showFlashSaleCounter ? 'On' : 'Off'}</span></button></div>
                <div className="pt-2"><label className="block text-xs text-gray-500 mb-1">Branding Text</label><input type="text" className="w-full px-3 py-2 border rounded text-sm" value={websiteConfiguration.brandingText} onChange={e => setWebsiteConfiguration(p => ({ ...p, brandingText: e.target.value }))}/></div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'chat_settings' && (
          <div className="space-y-6 max-w-2xl">
            <div><h3 className="font-bold text-xl mb-2">Chat Settings</h3><p className="text-gray-500 text-sm mb-6">Configure live chat for your store</p></div>
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50"><div><p className="font-semibold text-gray-800">Enable Live Chat</p><p className="text-sm text-gray-500">Allow customers to chat with you</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={websiteConfiguration.chatEnabled ?? false} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatEnabled: e.target.checked }))} className="sr-only peer"/><div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" placeholder="Hi! How can we help?" value={websiteConfiguration.chatGreeting || ''} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatGreeting: e.target.value }))}/><p className="text-xs text-gray-500 mt-1">Appears when chat opens</p></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Offline Message</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" placeholder="We're offline. Leave a message!" value={websiteConfiguration.chatOfflineMessage || ''} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatOfflineMessage: e.target.value }))}/></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Support Hours From</label><input type="time" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={websiteConfiguration.chatSupportHours?.from || '09:00'} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatSupportHours: { ...(p.chatSupportHours || {}), from: e.target.value } }))}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Support Hours To</label><input type="time" className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-green-500" value={websiteConfiguration.chatSupportHours?.to || '18:00'} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatSupportHours: { ...(p.chatSupportHours || {}), to: e.target.value } }))}/></div></div>
            <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50"><div><p className="font-semibold text-gray-800">WhatsApp Fallback</p><p className="text-sm text-gray-500">Redirect to WhatsApp when chat disabled</p></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={websiteConfiguration.chatWhatsAppFallback ?? false} onChange={e => setWebsiteConfiguration(p => ({ ...p, chatWhatsAppFallback: e.target.checked }))} className="sr-only peer"/><div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div></label></div>
          </div>
        )}
        {activeTab === 'theme_view' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {THEME_VIEW_SECTIONS.map(s => (
              <div key={s.title} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-4">{s.title}</h3>
                <div className="space-y-2">
                  {s.hasNone && (
                    <div className={`border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white transition-themeColors cursor-pointer ${!websiteConfiguration[s.key as keyof WebsiteConfig] ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-300 bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name={s.title} className="w-5 h-5 text-green-600 cursor-pointer" checked={!websiteConfiguration[s.key as keyof WebsiteConfig]} onChange={() => setWebsiteConfiguration(p => ({ ...p, [s.key]: '' }))}/>
                        <span className="font-semibold text-gray-700">None</span>
                      </div>
                      <button className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-themeColors">
                        <Eye size={14}/>View Site
                      </button>
                    </div>
                  )}
                  {Array.from({ length: s.count }).map((_, i) => { 
                    const v = `style${i + 1}`;
                    const cur = websiteConfiguration[s.key as keyof WebsiteConfig] || 'style1';
                    return (
                      <div key={i} className={`border rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-white transition-themeColors cursor-pointer ${cur === v ? 'border-green-500 bg-green-50 shadow-sm' : 'border-gray-300 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name={s.title} className="w-5 h-5 text-green-600 cursor-pointer" checked={cur === v} onChange={() => setWebsiteConfiguration(p => ({ ...p, [s.key]: v }))}/>
                          <span className="font-semibold text-gray-700">{s.title.split(' ')[0]} {i + 1}</span>
                        </div>
                        <button className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-bold flex items-center gap-1 hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-themeColors">
                          <Eye size={14}/>View demo
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'theme_colors' && (
          <div className="space-y-8 max-w-4xl">
            {/* Theme Colors Header */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">🎨 Theme Colors</h3>
              <p className="text-gray-500 text-sm">Customize your storefront and admin panel color palette to match your brand.</p>
            </div>

            {/* Colors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLOR_GUIDE_CONFIG.map(f => (
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
                        onChange={e => updateThemeColor(f.key, e.target.value)} 
                        className="w-16 h-16 rounded-xl border-2 border-gray-200 shadow-md cursor-pointer hover:scale-105 transition-transform duration-200"
                        style={{ backgroundColor: themeColors[f.key] }}
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
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md border border-gray-200" style={{ backgroundColor: themeColors[f.key] }}></div>
                    <input 
                      type="text" 
                      value={colorDrafts[f.key]} 
                      onChange={e => setColorDrafts(p => ({ ...p, [f.key]: e.target.value }))} 
                      onBlur={() => updateThemeColor(f.key, colorDrafts[f.key])} 
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm uppercase bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
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
                value={websiteConfiguration.searchHints || ''} 
                onChange={e => setWebsiteConfiguration(p => ({ ...p, searchHints: e.target.value }))} 
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
                  <p className="text-xs text-gray-500">Choose the language for order notifications and invoices</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {['English', 'Bangla'].map(l => (
                  <label 
                    key={l} 
                    className={`flex items-center gap-3 border-2 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                      websiteConfiguration.orderLanguage === l 
                        ? 'border-green-500 bg-green-50 shadow-sm' 
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="lang" 
                      className="w-5 h-5 text-green-600 focus:ring-green-500" 
                      checked={websiteConfiguration.orderLanguage === l} 
                      onChange={() => setWebsiteConfiguration(p => ({ ...p, orderLanguage: l }))}
                    />
                    <span className={`font-semibold ${websiteConfiguration.orderLanguage === l ? 'text-green-700' : 'text-gray-700'}`}>
                      {l === 'Bangla' ? '🇧🇩 ' : '🇬🇧 '}{l}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {isCarouselModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0"><h3 className="font-bold text-gray-800">{editingCarousel ? 'Edit Carousel' : 'Add New Carousel'}</h3><button onClick={() => setIsCarouselModalOpen(false)}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={handleSaveCarousel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desktop Banner*</label>
                <p className="text-xs text-gray-500 mb-2">{CAROUSEL_WIDTH}×{CAROUSEL_HEIGHT}px. Auto WebP.</p>
                <input type="file" ref={carouselDesktopInputRef} onChange={e => handleImageUpload(e, 'carousel')} className="hidden" accept="image/*"/>
                <div className="flex gap-2">
                  <div onClick={() => carouselDesktopInputRef.current?.click()} className="flex-1 border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 h-28">
                    {carouselFormData.image ? <img src={normalizeImageUrl(carouselFormData.image)} alt="" className="w-full h-full object-cover rounded"/> : <div className="text-gray-400 flex flex-col items-center justify-center h-full"><Upload size={32} className="mb-2"/><p className="text-sm">Upload</p></div>}
                  </div>
                  <button type="button" onClick={() => openGalleryPicker('carousel')} className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition">
                    <FolderOpen size={24} className="mb-1"/>
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Banner</label>
                <p className="text-xs text-gray-500 mb-2">{CAROUSEL_MOBILE_WIDTH}×{CAROUSEL_MOBILE_HEIGHT}px. Auto WebP.</p>
                <input type="file" ref={carouselMobileInputRef} onChange={e => handleImageUpload(e, 'carouselMobile')} className="hidden" accept="image/*"/>
                <div className="flex gap-2">
                  <div onClick={() => carouselMobileInputRef.current?.click()} className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-2 text-center cursor-pointer hover:bg-blue-50 h-28">
                    {carouselFormData.mobileImage ? <div className="relative w-full h-full"><img src={normalizeImageUrl(carouselFormData.mobileImage)} alt="" className="w-full h-full object-cover rounded"/><button type="button" onClick={e => { e.stopPropagation(); setCarouselFormData(p => ({ ...p, mobileImage: '' })); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={14}/></button></div> : <div className="text-blue-400 flex flex-col items-center justify-center h-full"><Upload size={32} className="mb-2"/><p className="text-sm">Upload</p></div>}
                  </div>
                  <button type="button" onClick={() => openGalleryPicker('carouselMobile')} className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition">
                    <FolderOpen size={24} className="mb-1"/>
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.name} onChange={e => setCarouselFormData({ ...carouselFormData, name: e.target.value })} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Serial</label><input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.serial} onChange={e => setCarouselFormData({ ...carouselFormData, serial: Number(e.target.value) })} required/></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Url</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.url} onChange={e => setCarouselFormData({ ...carouselFormData, url: e.target.value })}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Url Type</label><select className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.urlType} onChange={e => setCarouselFormData({ ...carouselFormData, urlType: e.target.value as any })}><option value="Internal">Internal</option><option value="External">External</option></select></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select className="w-full px-3 py-2 border rounded-lg text-sm" value={carouselFormData.status} onChange={e => setCarouselFormData({ ...carouselFormData, status: e.target.value as any })}><option value="Publish">Publish</option><option value="Draft">Draft</option></select></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsCarouselModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button type="submit" disabled={isCarouselSaving} className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg text-sm font-bold hover:from-[#2BAEE8] hover:to-[#1A7FE8] disabled:opacity-60 flex items-center gap-2">{isCarouselSaving ? <><Loader2 size={16} className="animate-spin"/>Saving...</> : 'Save Carousel'}</button></div>
            </form>
          </div>
        </div>
      )}
      {isPopupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800">{editingPopup ? 'Edit Popup' : 'Add New Popup'}</h3><button onClick={() => setIsPopupModalOpen(false)}><X size={20} className="text-gray-500"/></button></div>
            <form onSubmit={handleSavePopup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Image*</label>
                <input type="file" ref={popupImageInputRef} onChange={e => handleImageUpload(e, 'popup')} className="hidden" accept="image/*"/>
                <div className="flex gap-2">
                  <div onClick={() => popupImageInputRef.current?.click()} className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50">
                    {popupFormData.image ? <img src={normalizeImageUrl(popupFormData.image)} alt="" className="h-28 mx-auto object-contain"/> : <div className="text-gray-400"><Upload size={32} className="mx-auto mb-2"/><p className="text-sm">Upload</p></div>}
                  </div>
                  <button type="button" onClick={() => openGalleryPicker('popup')} className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition">
                    <FolderOpen size={24} className="mb-1"/>
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Name*</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={popupFormData.name} onChange={e => setPopupFormData({ ...popupFormData, name: e.target.value })} required/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Priority</label><input type="number" className="w-full px-3 py-2 border rounded-lg text-sm" value={popupFormData.priority} onChange={e => setPopupFormData({ ...popupFormData, priority: Number(e.target.value) })}/></div></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">URL</label><input type="text" className="w-full px-3 py-2 border rounded-lg text-sm" value={popupFormData.url} onChange={e => setPopupFormData({ ...popupFormData, url: e.target.value })}/></div><div><label className="block text-sm font-medium text-gray-700 mb-1">URL Type</label><select className="w-full px-3 py-2 border rounded-lg text-sm" value={popupFormData.urlType} onChange={e => setPopupFormData({ ...popupFormData, urlType: e.target.value as any })}><option value="Internal">Internal</option><option value="External">External</option></select></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select className="w-full px-3 py-2 border rounded-lg text-sm" value={popupFormData.status} onChange={e => setPopupFormData({ ...popupFormData, status: e.target.value as any })}><option value="Publish">Publish</option><option value="Draft">Draft</option></select></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={() => setIsPopupModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancel</button><button type="submit" className="px-4 py-2 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg text-sm font-bold hover:from-[#2BAEE8] hover:to-[#1A7FE8]">Save Popup</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Demo Preview Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setDemoModalOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">{demoTitle}</h3>
              <button onClick={() => setDemoModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[80vh] overflow-y-auto">
              {demoImage ? (
                <img 
                  src={demoImage} 
                  alt={demoTitle} 
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <ImageIcon size={64} className="mx-auto mb-4 opacity-50" />
                  <p>No demo image available</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button 
                onClick={() => setDemoModalOpen(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal */}
      <GalleryPicker
        isOpen={isGalleryPickerOpen}
        onClose={() => {
          setIsGalleryPickerOpen(false);
          setGalleryPickerTarget(null);
        }}
        onSelect={handleGallerySelect}
        title={`Choose ${galleryPickerTarget === 'carousel' ? 'Desktop Banner' : galleryPickerTarget === 'carouselMobile' ? 'Mobile Banner' : galleryPickerTarget === 'popup' ? 'Popup Image' : 'Image'} from Gallery`}
      />
    </div>
  );
};

export default AdminCustomization;
