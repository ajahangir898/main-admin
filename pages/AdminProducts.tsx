
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';
import { Search, Plus, Edit, Trash2, X, Upload, Save, Image as ImageIcon, CheckCircle, AlertCircle, Grid, List, CheckSquare, Layers, Tag as TagIcon, Percent, Filter, RefreshCw, Palette, Ruler, ChevronDown, Maximize2, Square, Grip, Table, Loader2, FileEdit, Copy, MoreVertical, Eye, ExternalLink, FolderOpen, HelpCircle } from 'lucide-react';
import { convertFileToWebP, compressProductImage, convertProductImage } from '../services/imageUtils';
import { uploadImageToServer, deleteImageFromServer } from '../services/imageUploadService';
import { slugify } from '../services/slugify';
import { formatCurrency } from '../utils/format';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { RichTextEditor } from '../components/RichTextEditor';
import ProductPricingAndStock, { ProductPricingData } from '../components/ProductPricingAndStock';
import { GalleryPicker } from '../components/GalleryPicker';
import toast from 'react-hot-toast';
import { getDrafts, saveDraft, deleteDraft, generateDraftId, DraftProduct } from '../utils/draftManager';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: number) => void;
  onBulkDelete: (ids: number[]) => void;
  onBulkUpdate: (ids: number[], updates: Partial<Product>) => void;
  tenantId?: string;
}

type ViewMode = 'extraLargeIcons' | 'largeIcons' | 'mediumIcons' | 'smallIcons' | 'list' | 'details';

interface ViewOption {
  value: ViewMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    value: 'extraLargeIcons',
    label: 'Extra large icons',
    description: 'Edge-to-edge cards that spotlight imagery',
    icon: Maximize2
  },
  {
    value: 'largeIcons',
    label: 'Large icons',
    description: 'Balanced card layout (default)',
    icon: Square
  },
  {
    value: 'mediumIcons',
    label: 'Medium icons',
    description: 'Denser grid, faster scanning',
    icon: Grid
  },
  {
    value: 'smallIcons',
    label: 'Small icons',
    description: 'Tight tiles for inventory sweeps',
    icon: Grip
  },
  {
    value: 'list',
    label: 'List',
    description: 'Single column with quick stats',
    icon: List
  },
  {
    value: 'details',
    label: 'Details',
    description: 'List layout with rich metadata',
    icon: Table
  }
];

const VIEW_GRID_LAYOUTS: Record<ViewMode, string> = {
  extraLargeIcons: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8',
  largeIcons: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6',
  mediumIcons: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5',
  smallIcons: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4',
  list: 'grid-cols-1 gap-3',
  details: 'grid-cols-1 gap-2'
};

const VIEW_IMAGE_HEIGHT: Record<ViewMode, string> = {
  extraLargeIcons: 'h-64',
  largeIcons: 'h-52',
  mediumIcons: 'h-44',
  smallIcons: 'h-36',
  list: 'h-32',
  details: 'h-32'
};

const AdminProducts: React.FC<AdminProductsProps> = ({ 
  products,
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onBulkDelete,
  onBulkUpdate,
  tenantId
}) => {
  const activeTenantId = tenantId || 'default';
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingDraft, setEditingDraft] = useState<DraftProduct | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const shareOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://mydomain.com';

  // Draft products state
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);

  // Deep Search State
  const [isDeepSearchOpen, setIsDeepSearchOpen] = useState(false);
  const [deepSearchTerm, setDeepSearchTerm] = useState('');
  const [searchInFields, setSearchInFields] = useState({
    name: true,
    description: true,
    category: true,
    brand: true,
    tags: true,
    sku: false
  });
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockRange, setStockRange] = useState({ min: '', max: '' });

  // Filter State
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState<'category' | 'discount' | 'status' | null>(null);
  const [bulkValue, setBulkValue] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('largeIcons');
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [openActionDropdown, setOpenActionDropdown] = useState<number | string | null>(null);
  const [mobileTab, setMobileTab] = useState<'search' | 'filters' | 'view'>('search');
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(false);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);
  const [mobileViewExpanded, setMobileViewExpanded] = useState(false);
  const [showFirstTimeHelp, setShowFirstTimeHelp] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    originalPrice: 0,
    category: '',
    subCategory: '',
    childCategory: '',
    brand: '',
    description: '',
    image: '',
    galleryImages: [],
    discount: '',
    tags: [],
    searchTags: [],
    colors: [],
    sizes: [],
    status: 'Active'
  });
  const [initialFormData, setInitialFormData] = useState<Partial<Product> | null>(null); // To track dirty state
  const [pricingData, setPricingData] = useState<ProductPricingData>({
    regularPrice: 0,
    salesPrice: 0,
    costPrice: 0,
    stockValue: 0,
    sku: '',
    isWholesale: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [searchTagInput, setSearchTagInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [isSlugTouched, setIsSlugTouched] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingProgress, setSavingProgress] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const savingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    description: true,
    images: true,
    variants: true,
    pricing: true,
    tags: true
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isViewMenuOpen && viewMenuRef.current && !viewMenuRef.current.contains(event.target as Node)) {
        setIsViewMenuOpen(false);
      }
      // Close action dropdown when clicking outside
      if (openActionDropdown !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-action-dropdown]')) {
          setOpenActionDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isViewMenuOpen, openActionDropdown]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false);
        setOpenActionDropdown(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Cleanup saving interval on unmount
  useEffect(() => {
    return () => {
      if (savingIntervalRef.current) {
        clearInterval(savingIntervalRef.current);
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Load drafts on mount
  useEffect(() => {
    const drafts = getDrafts(activeTenantId);
    setDraftProducts(drafts);
    
    // Check if first time user
    const hasSeenHelp = localStorage.getItem('hasSeenProductsHelp');
    if (!hasSeenHelp) {
      setShowFirstTimeHelp(true);
    }
  }, [activeTenantId]);

  // Auto-save draft when formData changes
  useEffect(() => {
    if (!isModalOpen || !hasUnsavedChanges) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save (debounced by 5 seconds)
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSaveDraft();
    }, 5000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, isModalOpen, hasUnsavedChanges]);

  // Add beforeunload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && isModalOpen) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isModalOpen]);

  // Auto-save draft function
  const handleAutoSaveDraft = useCallback(() => {
    if (!formData.name) return; // Don't save empty drafts

    const draftId = currentDraftId || generateDraftId();
    if (!currentDraftId) {
      setCurrentDraftId(draftId);
    }

    saveDraft(formData, draftId, activeTenantId);
    
    // Update local draft products list
    setDraftProducts(prev => {
      const existing = prev.findIndex(d => d.draftId === draftId);
      const draftProduct: DraftProduct = {
        ...formData,
        draftId,
        lastSaved: new Date().toISOString(),
        isDraft: true,
      };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = draftProduct;
        return updated;
      }
      return [...prev, draftProduct];
    });
  }, [formData, currentDraftId, activeTenantId]);

  // Derived State for filtering - combine real products with drafts
  const allProducts = [
    ...products,
    ...draftProducts.map(draft => ({
      id: parseInt(draft.draftId.replace('draft_', '')) || Date.now(),
      name: draft.name || 'Untitled Draft',
      price: draft.price || 0,
      originalPrice: draft.originalPrice,
      category: draft.category,
      subCategory: draft.subCategory,
      childCategory: draft.childCategory,
      brand: draft.brand,
      description: draft.description,
      image: draft.image || '',
      galleryImages: draft.galleryImages || [],
      slug: draft.slug,
      discount: draft.discount,
      tags: draft.tags,
      searchTags: draft.searchTags,
      colors: draft.colors,
      sizes: draft.sizes,
      status: 'Draft' as const,
      stock: draft.stock,
      rating: draft.rating,
      reviews: draft.reviews,
      sku: draft.sku,
      costPrice: draft.costPrice,
      isWholesale: draft.isWholesale,
      _isDraft: true,
      _draftId: draft.draftId,
    } as Product & { _isDraft?: boolean; _draftId?: string }))
  ];

  const filteredProducts = allProducts.filter(p => {
    // Basic search - now includes searchTags
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.searchTags && p.searchTags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Deep search
    let matchesDeepSearch = true;
    if (isDeepSearchOpen && deepSearchTerm) {
      const searchLower = deepSearchTerm.toLowerCase();
      matchesDeepSearch = false;
      
      if (searchInFields.name && p.name?.toLowerCase().includes(searchLower)) matchesDeepSearch = true;
      if (searchInFields.description && p.description?.toLowerCase().includes(searchLower)) matchesDeepSearch = true;
      if (searchInFields.category && p.category?.toLowerCase().includes(searchLower)) matchesDeepSearch = true;
      if (searchInFields.brand && p.brand?.toLowerCase().includes(searchLower)) matchesDeepSearch = true;
      if (searchInFields.tags && p.tags?.some(tag => tag.toLowerCase().includes(searchLower))) matchesDeepSearch = true;
      if (searchInFields.sku && p.sku?.toLowerCase().includes(searchLower)) matchesDeepSearch = true;
      // Include searchTags in deep search
      if (p.searchTags?.some(tag => tag.toLowerCase().includes(searchLower))) matchesDeepSearch = true;
    }
    
    // Price range filter
    let matchesPriceRange = true;
    if (priceRange.min && p.price < Number(priceRange.min)) matchesPriceRange = false;
    if (priceRange.max && p.price > Number(priceRange.max)) matchesPriceRange = false;
    
    // Stock range filter
    let matchesStockRange = true;
    if (stockRange.min && (p.stock || 0) < Number(stockRange.min)) matchesStockRange = false;
    if (stockRange.max && (p.stock || 0) > Number(stockRange.max)) matchesStockRange = false;
    
    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    const matchesBrand = filterBrand ? p.brand === filterBrand : true;
    const matchesStatus = filterStatus ? (p.status || 'Active') === filterStatus : true;

    return matchesSearch && matchesDeepSearch && matchesPriceRange && matchesStockRange && matchesCategory && matchesBrand && matchesStatus;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterBrand('');
    setFilterStatus('');
    setDeepSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setStockRange({ min: '', max: '' });
    setSearchInFields({
      name: true,
      description: true,
      category: true,
      brand: true,
      tags: true,
      sku: false
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Filtered dropdown options based on selection
  const availableSubCategories = subCategories.filter(s => {
    const parentCat = categories.find(c => c.name === formData.category);
    return parentCat && s.categoryId === parentCat.id;
  });

  const availableChildCategories = childCategories.filter(c => {
    const parentSub = subCategories.find(s => s.name === formData.subCategory);
    return parentSub && c.subCategoryId === parentSub.id;
  });

  const buildSlugFromName = (value: string) => slugify(value || '').replace(/--+/g, '-');

  const ensureUniqueSlug = (desired: string, excludeId?: number) => {
    const base = desired || buildSlugFromName(formData.name || '') || `product-${Date.now()}`;
    let candidate = base;
    let counter = 2;
    const isConflict = (slugValue: string) => products.some(p => p.slug === slugValue && p.id !== excludeId);
    while (isConflict(candidate)) {
      candidate = `${base}-${counter++}`;
    }
    return candidate;
  };

  const handleOpenModal = (product?: Product & { _isDraft?: boolean; _draftId?: string }) => {
    let initialData: Partial<Product>;
    if (product) {
      // Check if this is a draft
      if (product._isDraft && product._draftId) {
        const draft = draftProducts.find(d => d.draftId === product._draftId);
        if (draft) {
          setEditingDraft(draft);
          setCurrentDraftId(draft.draftId);
          setEditingProduct(null);
        }
      } else {
        setEditingProduct(product);
        setEditingDraft(null);
        setCurrentDraftId(null);
      }
      
      initialData = { ...product, status: product.status || 'Active', colors: product.colors || [], sizes: product.sizes || [], galleryImages: product.galleryImages || [], slug: product.slug };
      setIsSlugTouched(true);
      // Initialize pricing data from product
      setPricingData({
        regularPrice: product.price || 0,
        salesPrice: product.originalPrice || 0,
        costPrice: product.costPrice || 0,
        stockValue: product.stock || 0,
        sku: product.sku || '',
        isWholesale: product.isWholesale || false,
      });
    } else {
      setEditingProduct(null);
      setEditingDraft(null);
      // Generate new draft ID for new product
      setCurrentDraftId(generateDraftId());
      initialData = {
        name: '',
        price: 0,
        originalPrice: 0,
        category: categories[0]?.name || '',
        subCategory: '',
        childCategory: '',
        brand: '',
        description: '',
        image: '',
        galleryImages: [],
        slug: '',
        discount: '',
        tags: [],
        searchTags: [],
        colors: [],
        sizes: [],
        status: 'Active'
      };
      setIsSlugTouched(false);
      // Reset pricing data
      setPricingData({
        regularPrice: 0,
        salesPrice: 0,
        costPrice: 0,
        stockValue: 0,
        sku: '',
        isWholesale: false,
      });
    }
    setFormData(initialData);
    setInitialFormData(initialData);
    setHasUnsavedChanges(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    // Don't allow closing while saving
    if (isSaving) return;
    
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    
    if (isDirty) {
      // Auto-save as draft before closing
      if (formData.name) {
        handleAutoSaveDraft();
        toast.success('Draft saved automatically');
      }
      
      if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
        return;
      }
    }
    
    setIsModalOpen(false);
    setHasUnsavedChanges(false);
    setCurrentDraftId(null);
    setEditingDraft(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submit
    if (isSaving) return;
    
    // Basic validation
    if (!formData.name || !pricingData.regularPrice) {
      toast.error("Please fill in required fields (Name, Regular Price)");
      return;
    }

    const gallery = formData.galleryImages || [];
    if (gallery.length === 0) {
      toast.error("Please upload at least one product image.");
      return;
    }
    if (gallery.length < 5) {
      if (!window.confirm(`You only uploaded ${gallery.length} image(s). We recommend at least 5 images for best results. Continue anyway?`)) {
        return;
      }
    }

    // Start saving with progress animation
    setIsSaving(true);
    setSavingProgress(10);

    // Animate progress bar with deterministic steps
    let progress = 10;
    savingIntervalRef.current = setInterval(() => {
      progress = Math.min(progress + 20, 80);
      setSavingProgress(progress);
    }, 100);

    try {
      const primaryImage = gallery[0] || '';
      const normalizedSlug = buildSlugFromName(formData.slug || formData.name || '');
      const finalSlug = ensureUniqueSlug(normalizedSlug, editingProduct?.id);
      const productData = {
        ...formData,
        image: primaryImage,
        galleryImages: gallery,
        slug: finalSlug,
        // Update with pricing data
        price: pricingData.regularPrice,
        originalPrice: pricingData.salesPrice,
        costPrice: pricingData.costPrice,
        stock: pricingData.stockValue,
        sku: pricingData.sku,
        isWholesale: pricingData.isWholesale,
        // Ensure defaults
        rating: editingProduct ? editingProduct.rating : 5.0, // Default rating for new products
        reviews: editingProduct ? editingProduct.reviews : 0,
        status: formData.status || 'Active'
      } as Product;

      if (editingProduct) {
        onUpdateProduct({ ...productData, id: editingProduct.id });
      } else {
        onAddProduct({ ...productData, id: Date.now() }); // Simple ID generation
      }

      // Delete draft if this was a draft being published
      if (currentDraftId) {
        deleteDraft(currentDraftId, activeTenantId);
        setDraftProducts(prev => prev.filter(d => d.draftId !== currentDraftId));
      }

      // Complete the progress bar
      if (savingIntervalRef.current) {
        clearInterval(savingIntervalRef.current);
        savingIntervalRef.current = null;
      }
      setSavingProgress(100);

      toast.success(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      setIsModalOpen(false);
      setHasUnsavedChanges(false);
      setCurrentDraftId(null);
    } catch (error) {
      if (savingIntervalRef.current) {
        clearInterval(savingIntervalRef.current);
        savingIntervalRef.current = null;
      }
      toast.error('Failed to save product. Please try again.');
    } finally {
      setIsSaving(false);
      setSavingProgress(0);
    }
  };

  const handleDelete = (id: number, isDraft?: boolean, draftId?: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      if (isDraft && draftId) {
        deleteDraft(draftId, activeTenantId);
        setDraftProducts(prev => prev.filter(d => d.draftId !== draftId));
        toast.success('Draft deleted successfully');
      } else {
        onDeleteProduct(id);
      }
    }
  };

  const handleCloneProduct = (product: Product) => {
    // Generate unique name for cloned product
    const clonedName = `${product.name} (Copy)`;
    
    // Generate unique slug
    let baseSlug = slugify(clonedName);
    let counter = 1;
    while (products.some(p => p.slug === baseSlug)) {
      baseSlug = `${slugify(product.name)}-copy-${counter++}`;
    }
    
    // Create cloned product data
    const clonedProduct: Partial<Product> = {
      ...product,
      id: Date.now(), // Temporary ID, will be replaced by backend
      name: clonedName,
      slug: baseSlug,
      sku: product.sku ? `${product.sku}-COPY` : '',
    };
    
    // Remove _id if exists (MongoDB)
    delete (clonedProduct as any)._id;
    
    // Open modal with cloned data
    setEditingProduct(null);
    setEditingDraft(null);
    setCurrentDraftId(generateDraftId());
    setFormData(clonedProduct);
    setInitialFormData(clonedProduct);
    setPricingData({
      regularPrice: product.price || 0,
      salesPrice: product.originalPrice || 0,
      costPrice: product.costPrice || 0,
      stockValue: product.stock || 0,
      sku: product.sku ? `${product.sku}-COPY` : '',
      isWholesale: product.isWholesale || false,
    });
    setIsSlugTouched(true);
    setHasUnsavedChanges(true);
    setIsModalOpen(true);
    toast.success('Product cloned! Make changes and save.');
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const addSearchTag = () => {
    if (searchTagInput.trim() && !formData.searchTags?.includes(searchTagInput.trim())) {
      setFormData({
        ...formData,
        searchTags: [...(formData.searchTags || []), searchTagInput.trim()]
      });
      setSearchTagInput('');
    }
  };

  const addExistingTag = (tagName: string) => {
    if (!formData.tags?.includes(tagName)) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagName]
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tagToRemove)
    });
  };

  const removeSearchTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      searchTags: formData.searchTags?.filter(t => t !== tagToRemove)
    });
  };

  const addColor = () => {
    if (colorInput.trim() && !formData.colors?.includes(colorInput.trim())) {
      setFormData({
        ...formData,
        colors: [...(formData.colors || []), colorInput.trim()]
      });
      setColorInput('');
    }
  };

  const removeColor = (colorToRemove: string) => {
    setFormData({
      ...formData,
      colors: formData.colors?.filter(c => c !== colorToRemove)
    });
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
      setFormData({
        ...formData,
        sizes: [...(formData.sizes || []), sizeInput.trim()]
      });
      setSizeInput('');
    }
  };

  const removeSize = (sizeToRemove: string) => {
    setFormData({
      ...formData,
      sizes: formData.sizes?.filter(s => s !== sizeToRemove)
    });
  };

  const handleNameChange = (value: string) => {
    const updated: Partial<Product> = { ...formData, name: value };
    if (!isSlugTouched) {
      updated.slug = buildSlugFromName(value);
    }
    setFormData(updated);
    setHasUnsavedChanges(true);
  };

  // Memoized handler for RichTextEditor to prevent infinite re-renders
  const handleDescriptionChange = useCallback((html: string) => {
    setFormData(prev => ({ ...prev, description: html }));
    setHasUnsavedChanges(true);
  }, []);

  // Memoized handler for ProductPricingAndStock to prevent infinite re-renders
  const handlePricingDataChange = useCallback((data: ProductPricingData) => {
    setPricingData(data);
    setFormData(prev => ({
      ...prev,
      price: data.regularPrice,
      originalPrice: data.salesPrice,
    }));
    setHasUnsavedChanges(true);
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const currentGallery = formData.galleryImages || [];
    const maxFiles = 10;

    if (currentGallery.length + files.length > maxFiles) {
      toast.error(`You can upload up to ${maxFiles} images. You're adding ${files.length}, which would exceed the limit.`);
      if (input) input.value = '';
      return;
    }

    // Show uploading toast
    const loadingToast = toast.loading(`Uploading ${files.length} image(s)...`);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // File size validation
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`File "${file.name}" is too large. Each file must be under 5MB.`);
          if (input) input.value = '';
          toast.dismiss(loadingToast);
          return;
        }

        try {
          // Convert to fixed 800x800 square and compress to under 25KB
          toast.loading(
            `Processing ${i + 1}/${files.length}...`,
            { id: loadingToast }
          );
          const compressedFile = await convertProductImage(file);
          console.log(`[ProductImage] Processed: ${(file.size / 1024).toFixed(1)}KB â†’ ${(compressedFile.size / 1024).toFixed(1)}KB (800x800)`);
          
          // Upload compressed image to server
          toast.loading(
            `Uploading ${i + 1}/${files.length}...`,
            { id: loadingToast }
          );
          const imageUrl = await uploadImageToServer(compressedFile, activeTenantId || 'default');
          uploadedUrls.push(imageUrl);
        } catch (error) {
          console.error(`Failed to upload ${file.name}`, error);
          toast.error(`Unable to upload "${file.name}". ${error instanceof Error ? error.message : 'Please try again.'}`);
          if (input) input.value = '';
          toast.dismiss(loadingToast);
          return;
        }
      }

      // Success
      setFormData({
        ...formData,
        galleryImages: [...currentGallery, ...uploadedUrls]
      });

      setHasUnsavedChanges(true);
      
      // Immediately save draft after image upload
      setTimeout(() => {
        handleAutoSaveDraft();
        toast.success('Draft auto-saved', { duration: 2000 });
      }, 100);

      toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`, { id: loadingToast });

      if (input) input.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An unexpected error occurred during upload');
      toast.dismiss(loadingToast);
    }
  };

  const removeGalleryImage = async (index: number) => {
    const imageToRemove = formData.galleryImages?.[index];
    
    if (imageToRemove) {
      try {
        // Delete from server if it's a server URL (either relative or full URL)
        if (imageToRemove.includes('/uploads/')) {
          await deleteImageFromServer(imageToRemove, activeTenantId);
        }
      } catch (error) {
        console.error('Failed to delete image from server:', error);
        toast.error('Failed to delete image');
      }
    }

    const updated = [...(formData.galleryImages || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, galleryImages: updated });
  };

  const moveGalleryImage = (fromIndex: number, toIndex: number) => {
    const updated = [...(formData.galleryImages || [])];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    setFormData({ ...formData, galleryImages: updated });
  };

  // Bulk Handlers
  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    if (!filteredProducts || filteredProducts.length === 0) return;
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

  const executeBulkAction = () => {
    if (bulkAction === 'category') {
      if (!bulkValue) return alert("Please select a category");
      onBulkUpdate(selectedIds, { category: bulkValue });
    } else if (bulkAction === 'discount') {
      onBulkUpdate(selectedIds, { discount: bulkValue }); // Allow empty to clear discount
    } else if (bulkAction === 'status') {
      if (!bulkValue) return alert("Please select a status");
      onBulkUpdate(selectedIds, { status: bulkValue as 'Active' | 'Draft' });
    }
    
    // Reset
    setBulkAction(null);
    setBulkValue('');
    setSelectedIds([]);
    alert("Bulk action completed successfully!");
  };

  const executeBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  const activeViewOption = VIEW_OPTIONS.find(option => option.value === viewMode) || VIEW_OPTIONS[1];
  const ActiveViewIcon = activeViewOption?.icon || Square;
  const gridTemplateClass = VIEW_GRID_LAYOUTS[viewMode];
  const imageHeightClass = VIEW_IMAGE_HEIGHT[viewMode];
  const isListLikeView = viewMode === 'list';  // details mode now uses table view

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* First Time Help Overlay */}
      {showFirstTimeHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-purple-600 flex items-center justify-center">
                <AlertCircle className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Welcome to Products!</h3>
                <p className="text-sm text-gray-500">Let's get you started</p>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center flex-shrink-0 font-bold texd ? :   s t r i n g   } )   = >   {  
         l e t   i n i t i a l D a t a :   P a r t i a l < P r o d u c t > ;  
         i f   ( p r o d u c t )   {  
             / /   C h e c k   i f   t h i s   i s   a   d r a f t  
             i f   ( p r o d u c t . _ i s D r a f t   & &   p r o d u c t . _ d r a f t I d )   {  
                 c o n s t   d r a f t   =   d r a f t P r o d u c t s . f i n d ( d   = >   d . d r a f t I d   = = =   p r o d u c t . _ d r a f t I d ) ;  
                 i f   ( d r a f t )   {  
                     s e t E d i t i n g D r a f t ( d r a f t ) ;  
                     s e t C u r r e n t D r a f t I d ( d r a f t . d r a f t I d ) ;  
                     s e t E d i t i n g P r o d u c t ( n u l l ) ;  
                 }  
             }   e l s e   {  
                 s e t E d i t i n g P r o d u c t ( p r o d u c t ) ;  
                 s e t E d i t i n g D r a f t ( n u l l ) ;  
                 s e t C u r r e n t D r a f t I d ( n u l l ) ;  
             }  
              
             i n i t i a l D a t a   =   {   . . . p r o d u c t ,   s t a t u s :   p r o d u c t . s t a t u s   | |   ' A c t i v e ' ,   c o l o r s :   p r o d u c t . c o l o r s   | |   [ ] ,   s i z e s :   p r o d u c t . s i z e s   | |   [ ] ,   g a l l e r y I m a g e s :   p r o d u c t . g a l l e r y I m a g e s   | |   [ ] ,   s l u g :   p r o d u c t . s l u g   } ;  
             s e t I s S l u g T o u c h e d ( t r u e ) ;  
             / /   I n i t i a l i z e   p r i c i n g   d a t a   f r o m   p r o d u c t  
             s e t P r i c i n g D a t a ( {  
                 r e g u l a r P r i c e :   p r o d u c t . p r i c e   | |   0 ,  
                 s a l e s P r i c e :   p r o d u c t . o r i g i n a l P r i c e   | |   0 ,  
                 c o s t P r i c e :   p r o d u c t . c o s t P r i c e   | |   0 ,  
                 s t o c k V a l u e :   p r o d u c t . s t o c k   | |   0 ,  
                 s k u :   p r o d u c t . s k u   | |   ' ' ,  
                 i s W h o l e s a l e :   p r o d u c t . i s W h o l e s a l e   | |   f a l s e ,  
             } ) ;  
         }   e l s e   {  
             s e t E d i t i n g P r o d u c t ( n u l l ) ;  
             s e t E d i t i n g D r a f t ( n u l l ) ;  
             / /   G e n e r a t e   n e w   d r a f t   I D   f o r   n e w   p r o d u c t  
             s e t C u r r e n t D r a f t I d ( g e n e r a t e D r a f t I d ( ) ) ;  
             i n i t i a l D a t a   =   {  
                 n a m e :   ' ' ,  
                 p r i c e :   0 ,  
                 o r i g i n a l P r i c e :   0 ,  
                 c a t e g o r y :   c a t e g o r i e s [ 0 ] ? . n a m e   | |   ' ' ,  
                 s u b C a t e g o r y :   ' ' ,  
                 c h i l d C a t e g o r y :   ' ' ,  
                 b r a n d :   ' ' ,  
                 d e s c r i p t i o n :   ' ' ,  
                 i m a g e :   ' ' ,  
                 g a l l e r y I m a g e s :   [ ] ,  
                 s l u g :   ' ' ,  
                 d i s c o u n t :   ' ' ,  
                 t a g s :   [ ] ,  
                 s e a r c h T a g s :   [ ] ,  
                 c o l o r s :   [ ] ,  
                 s i z e s :   [ ] ,  
                 s t a t u s :   ' A c t i v e '  
             } ;  
             s e t I s S l u g T o u c h e d ( f a l s e ) ;  
             / /   R e s e t   p r i c i n g   d a t a  
             s e t P r i c i n g D a t a ( {  
                 r e g u l a r P r i c e :   0 ,  
                 s a l e s P r i c e :   0 ,  
                 c o s t P r i c e :   0 ,  
                 s t o c k V a l u e :   0 ,  
                 s k u :   ' ' ,  
                 i s W h o l e s a l e :   f a l s e ,  
             } ) ;  
         }  
         s e t F o r m D a t a ( i n i t i a l D a t a ) ;  
         s e t I n i t i a l F o r m D a t a ( i n i t i a l D a t a ) ;  
         s e t H a s U n s a v e d C h a n g e s ( f a l s e ) ;  
         s e t I s M o d a l O p e n ( t r u e ) ;  
     } ;  
  
     c o n s t   h a n d l e C l o s e M o d a l   =   ( )   = >   {  
         / /   D o n ' t   a l l o w   c l o s i n g   w h i l e   s a v i n g  
         i f   ( i s S a v i n g )   r e t u r n ;  
          
         c o n s t   i s D i r t y   =   J S O N . s t r i n g i f y ( f o r m D a t a )   ! = =   J S O N . s t r i n g i f y ( i n i t i a l F o r m D a t a ) ;  
          
         i f   ( i s D i r t y )   {  
             / /   A u t o - s a v e   a s   d r a f t   b e f o r e   c l o s i n g  
             i f   ( f o r m D a t a . n a m e )   {  
                 h a n d l e A u t o S a v e D r a f t ( ) ;  
                 t o a s t . s u c c e s s ( ' D r a f t   s a v e d   a u t o m a t i c a l l y ' ) ;  
             }  
              
             i f   ( ! w i n d o w . c o n f i r m ( " Y o u   h a v e   u n s a v e d   c h a n g e s .   A r e   y o u   s u r e   y o u   w a n t   t o   d i s c a r d   t h e m ? " ) )   {  
                 r e t u r n ;  
             }  
         }  
          
         s e t I s M o d a l O p e n ( f a l s e ) ;  
         s e t H a s U n s a v e d C h a n g e s ( f a l s e ) ;  
         s e t C u r r e n t D r a f t I d ( n u l l ) ;  
         s e t E d i t i n g D r a f t ( n u l l ) ;  
     } ;  
  
     c o n s t   h a n d l e S u b m i t   =   a s y n c   ( e :   R e a c t . F o r m E v e n t )   = >   {  
         e . p r e v e n t D e f a u l t ( ) ;  
          
         / /   P r e v e n t   d o u b l e   s u b m i t  
         i f   ( i s S a v i n g )   r e t u r n ;  
          
         / /   B a s i c   v a l i d a t i o n  
         i f   ( ! f o r m D a t a . n a m e   | |   ! p r i c i n g D a t a . r e g u l a r P r i c e )   {  
             t o a s t . e r r o r ( " P l e a s e   f i l l   i n   r e q u i r e d   f i e l d s   ( N a m e ,   R e g u l a r   P r i c e ) " ) ;  
             r e t u r n ;  
         }  
  
         c o n s t   g a l l e r y   =   f o r m D a t a . g a l l e r y I m a g e s   | |   [ ] ;  
         i f   ( g a l l e r y . l e n g t h   = = =   0 )   {  
             t o a s t . e r r o r ( " P l e a s e   u p l o a d   a t   l e a s t   o n e   p r o d u c t   i m a g e . " ) ;  
             r e t u r n ;  
         }  
         i f   ( g a l l e r y . l e n g t h   <   5 )   {  
             i f   ( ! w i n d o w . c o n f i r m ( ` Y o u   o n l y   u p l o a d e d   $ { g a l l e r y . l e n g t h }   i m a g e ( s ) .   W e   r e c o m m e n d   a t   l e a s t   5   i m a g e s   f o r   b e s t   r e s u l t s .   C o n t i n u e   a n y w a y ? ` ) )   {  
                 r e t u r n ;  
             }  
         }  
  
         / /   S t a r t   s a v i n g   w i t h   p r o g r e s s   a n i m a t i o n  
         s e t I s S a v i n g ( t r u e ) ;  
         s e t S a v i n g P r o g r e s s ( 1 0 ) ;  
  
         / /   A n i m a t e   p r o g r e s s   b a r   w i t h   d e t e r m i n i s t i c   s t e p s  
         l e t   p r o g r e s s   =   1 0 ;  
         s a v i n g I n t e r v a l R e f . c u r r e n t   =   s e t I n t e r v a l ( ( )   = >   {  
             p r o g r e s s   =   M a t h . m i n ( p r o g r e s s   +   2 0 ,   8 0 ) ;  
             s e t S a v i n g P r o g r e s s ( p r o g r e s s ) ;  
         } ,   1 0 0 ) ;  
  
         t r y   {  
             c o n s t   p r i m a r y I m a g e   =   g a l l e r y [ 0 ]   | |   ' ' ;  
             c o n s t   n o r m a l i z e d S l u g   =   b u i l d S l u g F r o m N a m e ( f o r m D a t a . s l u g   | |   f o r m D a t a . n a m e   | |   ' ' ) ;  
             c o n s t   f i n a l S l u g   =   e n s u r e U n i q u e S l u g ( n o r m a l i z e d S l u g ,   e d i t i n g P r o d u c t ? . i d ) ;  
             c o n s t   p r o d u c t D a t a   =   {  
                 . . . f o r m D a t a ,  
                 i m a g e :   p r i m a r y I m a g e ,  
                 g a l l e r y I m a g e s :   g a l l e r y ,  
                 s l u g :   f i n a l S l u g ,  
                 / /   U p d a t e   w i t h   p r i c i n g   d a t a  
                 p r i c e :   p r i c i n g D a t a . r e g u l a r P r i c e ,  
                 o r i g i n a l P r i c e :   p r i c i n g D a t a . s a l e s P r i c e ,  
                 c o s t P r i c e :   p r i c i n g D a t a . c o s t P r i c e ,  
                 s t o c k :   p r i c i n g D a t a . s t o c k V a l u e ,  
                 s k u :   p r i c i n g D a t a . s k u ,  
                 i s W h o l e s a l e :   p r i c i n g D a t a . i s W h o l e s a l e ,  
                 / /   E n s u r e   d e f a u l t s  
                 r a t i n g :   e d i t i n g P r o d u c t   ?   e d i t i n g P r o d u c t . r a t i n g   :   5 . 0 ,   / /   D e f a u l t   r a t i n g   f o r   n e w   p r o d u c t s  
                 r e v i e w s :   e d i t i n g P r o d u c t   ?   e d i t i n g P r o d u c t . r e v i e w s   :   0 ,  
                 s t a t u s :   f o r m D a t a . s t a t u s   | |   ' A c t i v e '  
             }   a s   P r o d u c t ;  
  
             i f   ( e d i t i n g P r o d u c t )   {  
                 o n U p d a t e P r o d u c t ( {   . . . p r o d u c t D a t a ,   i d :   e d i t i n g P r o d u c t . i d   } ) ;  
             }   e l s e   {  
                 o n A d d P r o d u c t ( {   . . . p r o d u c t D a t a ,   i d :   D a t e . n o w ( )   } ) ;   / /   S i m p l e   I D   g e n e r a t i o n  
             }  
  
             / /   D e l e t e   d r a f t   i f   t h i s   w a s   a   d r a f t   b e i n g   p u b l i s h e d  
             i f   ( c u r r e n t D r a f t I d )   {  
                 d e l e t e D r a f t ( c u r r e n t D r a f t I d ,   a c t i v e T e n a n t I d ) ;  
                 s e t D r a f t P r o d u c t s ( p r e v   = >   p r e v . f i l t e r ( d   = >   d . d r a f t I d   ! = =   c u r r e n t D r a f t I d ) ) ;  
             }  
  
             / /   C o m p l e t e   t h e   p r o g r e s s   b a r  
             i f   ( s a v i n g I n t e r v a l R e f . c u r r e n t )   {  
                 c l e a r I n t e r v a l ( s a v i n g I n t e r v a l R e f . c u r r e n t ) ;  
                 s a v i n g I n t e r v a l R e f . c u r r e n t   =   n u l l ;  
             }  
             s e t S a v i n g P r o g r e s s ( 1 0 0 ) ;  
  
             t o a s t . s u c c e s s ( e d i t i n g P r o d u c t   ?   ' P r o d u c t   u p d a t e d   s u c c e s s f u l l y ! '   :   ' P r o d u c t   a d d e d   s u c c e s s f u l l y ! ' ) ;  
             s e t I s M o d a l O p e n ( f a l s e ) ;  
             s e t H a s U n s a v e d C h a n g e s ( f a l s e ) ;  
             s e t C u r r e n t D r a f t I d ( n u l l ) ;  
         }   c a t c h   ( e r r o r )   {  
             i f   ( s a v i n g I n t e r v a l R e f . c u r r e n t )   {  
                 c l e a r I n t e r v a l ( s a v i n g I n t e r v a l R e f . c u r r e n t ) ;  
                 s a v i n g I n t e r v a l R e f . c u r r e n t   =   n u l l ;  
             }  
             t o a s t . e r r o r ( ' F a i l e d   t o   s a v e   p r o d u c t .   P l e a s e   t r y   a g a i n . ' ) ;  
         }   f i n a l l y   {  
             s e t I s S a v i n g ( f a l s e ) ;  
             s e t S a v i n g P r o g r e s s ( 0 ) ;  
         }  
     } ;  
  
     c o n s t   h a n d l e D e l e t e   =   ( i d :   n u m b e r ,   i s D r a f t ? :   b o o l e a n ,   d r a f t I d ? :   s t r i n g )   = >   {  
         i f   ( w i n d o w . c o n f i r m ( " A r e   y o u   s u r e   y o u   w a n t   t o   d e l e t e   t h i s   p r o d u c t ? " ) )   {  
             i f   ( i s D r a f t   & &   d r a f t I d )   {  
                 d e l e t e D r a f t ( d r a f t I d ,   a c t i v e T e n a n t I d ) ;  
                 s e t D r a f t P r o d u c t s ( p r e v   = >   p r e v . f i l t e r ( d   = >   d . d r a f t I d   ! = =   d r a f t I d ) ) ;  
                 t o a s t . s u c c e s s ( ' D r a f t   d e l e t e d   s u c c e s s f u l l y ' ) ;  
             }   e l s e   {  
                 o n D e l e t e P r o d u c t ( i d ) ;  
             }  
         }  
     } ;  
  
     c o n s t   h a n d l e C l o n e P r o d u c t   =   ( p r o d u c t :   P r o d u c t )   = >   {  
         / /   G e n e r a t e   u n i q u e   n a m e   f o r   c l o n e d   p r o d u c t  
         c o n s t   c l o n e d N a m e   =   ` $ { p r o d u c t . n a m e }   ( C o p y ) ` ;  
          
         / /   G e n e r a t e   u n i q u e   s l u g  
         l e t   b a s e S l u g   =   s l u g i f y ( c l o n e d N a m e ) ;  
         l e t   c o u n t e r   =   1 ;  
         w h i l e   ( p r o d u c t s . s o m e ( p   = >   p . s l u g   = = =   b a s e S l u g ) )   {  
             b a s e S l u g   =   ` $ { s l u g i f y ( p r o d u c t . n a m e ) } - c o p y - $ { c o u n t e r + + } ` ;  
         }  
          
         / /   C r e a t e   c l o n e d   p r o d u c t   d a t a  
         c o n s t   c l o n e d P r o d u c t :   P a r t i a l < P r o d u c t >   =   {  
             . . . p r o d u c t ,  
             i d :   D a t e . n o w ( ) ,   / /   T e m p o r a r y   I D ,   w i l l   b e   r e p l a c e d   b y   b a c k e n d  
             n a m e :   c l o n e d N a m e ,  
             s l u g :   b a s e S l u g ,  
             s k u :   p r o d u c t . s k u   ?   ` $ { p r o d u c t . s k u } - C O P Y `   :   ' ' ,  
         } ;  
          
         / /   R e m o v e   _ i d   i f   e x i s t s   ( M o n g o D B )  
         d e l e t e   ( c l o n e d P r o d u c t   a s   a n y ) . _ i d ;  
          
         / /   O p e n   m o d a l   w i t h   c l o n e d   d a t a  
         s e t E d i t i n g P r o d u c t ( n u l l ) ;  
         s e t E d i t i n g D r a f t ( n u l l ) ;  
         s e t C u r r e n t D r a f t I d ( g e n e r a t e D r a f t I d ( ) ) ;  
         s e t F o r m D a t a ( c l o n e d P r o d u c t ) ;  
         s e t I n i t i a l F o r m D a t a ( c l o n e d P r o d u c t ) ;  
         s e t P r i c i n g D a t a ( {  
             r e g u l a r P r i c e :   p r o d u c t . p r i c e   | |   0 ,  
             s a l e s P r i c e :   p r o d u c t . o r i g i n a l P r i c e   | |   0 ,  
             c o s t P r i c e :   p r o d u c t . c o s t P r i c e   | |   0 ,  
             s t o c k V a l u e :   p r o d u c t . s t o c k   | |   0 ,  
             s k u :   p r o d u c t . s k u   ?   ` $ { p r o d u c t . s k u } - C O P Y `   :   ' ' ,  
             i s W h o l e s a l e :   p r o d u c t . i s W h o l e s a l e   | |   f a l s e ,  
         } ) ;  
         s e t I s S l u g T o u c h e d ( t r u e ) ;  
         s e t H a s U n s a v e d C h a n g e s ( t r u e ) ;  
         s e t I s M o d a l O p e n ( t r u e ) ;  
         t o a s t . s u c c e s s ( ' P r o d u c t   c l o n e d !   M a k e   c h a n g e s   a n d   s a v e . ' ) ;  
     } ;  
  
     c o n s t   a d d T a g   =   ( )   = >   {  
         i f   ( t a g I n p u t . t r i m ( )   & &   ! f o r m D a t a . t a g s ? . i n c l u d e s ( t a g I n p u t . t r i m ( ) ) )   {  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 t a g s :   [ . . . ( f o r m D a t a . t a g s   | |   [ ] ) ,   t a g I n p u t . t r i m ( ) ]  
             } ) ;  
             s e t T a g I n p u t ( ' ' ) ;  
         }  
     } ;  
  
     c o n s t   a d d S e a r c h T a g   =   ( )   = >   {  
         i f   ( s e a r c h T a g I n p u t . t r i m ( )   & &   ! f o r m D a t a . s e a r c h T a g s ? . i n c l u d e s ( s e a r c h T a g I n p u t . t r i m ( ) ) )   {  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 s e a r c h T a g s :   [ . . . ( f o r m D a t a . s e a r c h T a g s   | |   [ ] ) ,   s e a r c h T a g I n p u t . t r i m ( ) ]  
             } ) ;  
             s e t S e a r c h T a g I n p u t ( ' ' ) ;  
         }  
     } ;  
  
     c o n s t   a d d E x i s t i n g T a g   =   ( t a g N a m e :   s t r i n g )   = >   {  
         i f   ( ! f o r m D a t a . t a g s ? . i n c l u d e s ( t a g N a m e ) )   {  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 t a g s :   [ . . . ( f o r m D a t a . t a g s   | |   [ ] ) ,   t a g N a m e ]  
             } ) ;  
         }  
     } ;  
  
     c o n s t   r e m o v e T a g   =   ( t a g T o R e m o v e :   s t r i n g )   = >   {  
         s e t F o r m D a t a ( {  
             . . . f o r m D a t a ,  
             t a g s :   f o r m D a t a . t a g s ? . f i l t e r ( t   = >   t   ! = =   t a g T o R e m o v e )  
         } ) ;  
     } ;  
  
     c o n s t   r e m o v e S e a r c h T a g   =   ( t a g T o R e m o v e :   s t r i n g )   = >   {  
         s e t F o r m D a t a ( {  
             . . . f o r m D a t a ,  
             s e a r c h T a g s :   f o r m D a t a . s e a r c h T a g s ? . f i l t e r ( t   = >   t   ! = =   t a g T o R e m o v e )  
         } ) ;  
     } ;  
  
     c o n s t   a d d C o l o r   =   ( )   = >   {  
         i f   ( c o l o r I n p u t . t r i m ( )   & &   ! f o r m D a t a . c o l o r s ? . i n c l u d e s ( c o l o r I n p u t . t r i m ( ) ) )   {  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 c o l o r s :   [ . . . ( f o r m D a t a . c o l o r s   | |   [ ] ) ,   c o l o r I n p u t . t r i m ( ) ]  
             } ) ;  
             s e t C o l o r I n p u t ( ' ' ) ;  
         }  
     } ;  
  
     c o n s t   r e m o v e C o l o r   =   ( c o l o r T o R e m o v e :   s t r i n g )   = >   {  
         s e t F o r m D a t a ( {  
             . . . f o r m D a t a ,  
             c o l o r s :   f o r m D a t a . c o l o r s ? . f i l t e r ( c   = >   c   ! = =   c o l o r T o R e m o v e )  
         } ) ;  
     } ;  
  
     c o n s t   a d d S i z e   =   ( )   = >   {  
         i f   ( s i z e I n p u t . t r i m ( )   & &   ! f o r m D a t a . s i z e s ? . i n c l u d e s ( s i z e I n p u t . t r i m ( ) ) )   {  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 s i z e s :   [ . . . ( f o r m D a t a . s i z e s   | |   [ ] ) ,   s i z e I n p u t . t r i m ( ) ]  
             } ) ;  
             s e t S i z e I n p u t ( ' ' ) ;  
         }  
     } ;  
  
     c o n s t   r e m o v e S i z e   =   ( s i z e T o R e m o v e :   s t r i n g )   = >   {  
         s e t F o r m D a t a ( {  
             . . . f o r m D a t a ,  
             s i z e s :   f o r m D a t a . s i z e s ? . f i l t e r ( s   = >   s   ! = =   s i z e T o R e m o v e )  
         } ) ;  
     } ;  
  
     c o n s t   h a n d l e N a m e C h a n g e   =   ( v a l u e :   s t r i n g )   = >   {  
         c o n s t   u p d a t e d :   P a r t i a l < P r o d u c t >   =   {   . . . f o r m D a t a ,   n a m e :   v a l u e   } ;  
         i f   ( ! i s S l u g T o u c h e d )   {  
             u p d a t e d . s l u g   =   b u i l d S l u g F r o m N a m e ( v a l u e ) ;  
         }  
         s e t F o r m D a t a ( u p d a t e d ) ;  
         s e t H a s U n s a v e d C h a n g e s ( t r u e ) ;  
     } ;  
  
     / /   M e m o i z e d   h a n d l e r   f o r   R i c h T e x t E d i t o r   t o   p r e v e n t   i n f i n i t e   r e - r e n d e r s  
     c o n s t   h a n d l e D e s c r i p t i o n C h a n g e   =   u s e C a l l b a c k ( ( h t m l :   s t r i n g )   = >   {  
         s e t F o r m D a t a ( p r e v   = >   ( {   . . . p r e v ,   d e s c r i p t i o n :   h t m l   } ) ) ;  
         s e t H a s U n s a v e d C h a n g e s ( t r u e ) ;  
     } ,   [ ] ) ;  
  
     / /   M e m o i z e d   h a n d l e r   f o r   P r o d u c t P r i c i n g A n d S t o c k   t o   p r e v e n t   i n f i n i t e   r e - r e n d e r s  
     c o n s t   h a n d l e P r i c i n g D a t a C h a n g e   =   u s e C a l l b a c k ( ( d a t a :   P r o d u c t P r i c i n g D a t a )   = >   {  
         s e t P r i c i n g D a t a ( d a t a ) ;  
         s e t F o r m D a t a ( p r e v   = >   ( {  
             . . . p r e v ,  
             p r i c e :   d a t a . r e g u l a r P r i c e ,  
             o r i g i n a l P r i c e :   d a t a . s a l e s P r i c e ,  
         } ) ) ;  
         s e t H a s U n s a v e d C h a n g e s ( t r u e ) ;  
     } ,   [ ] ) ;  
  
     c o n s t   h a n d l e I m a g e U p l o a d   =   a s y n c   ( e :   R e a c t . C h a n g e E v e n t < H T M L I n p u t E l e m e n t > )   = >   {  
         c o n s t   i n p u t   =   e . t a r g e t   a s   H T M L I n p u t E l e m e n t ;  
         c o n s t   f i l e s   =   i n p u t . f i l e s ;  
         i f   ( ! f i l e s   | |   f i l e s . l e n g t h   = = =   0 )   r e t u r n ;  
  
         c o n s t   c u r r e n t G a l l e r y   =   f o r m D a t a . g a l l e r y I m a g e s   | |   [ ] ;  
         c o n s t   m a x F i l e s   =   1 0 ;  
  
         i f   ( c u r r e n t G a l l e r y . l e n g t h   +   f i l e s . l e n g t h   >   m a x F i l e s )   {  
             t o a s t . e r r o r ( ` Y o u   c a n   u p l o a d   u p   t o   $ { m a x F i l e s }   i m a g e s .   Y o u ' r e   a d d i n g   $ { f i l e s . l e n g t h } ,   w h i c h   w o u l d   e x c e e d   t h e   l i m i t . ` ) ;  
             i f   ( i n p u t )   i n p u t . v a l u e   =   ' ' ;  
             r e t u r n ;  
         }  
  
         / /   S h o w   u p l o a d i n g   t o a s t  
         c o n s t   l o a d i n g T o a s t   =   t o a s t . l o a d i n g ( ` U p l o a d i n g   $ { f i l e s . l e n g t h }   i m a g e ( s ) . . . ` ) ;  
  
         t r y   {  
             c o n s t   u p l o a d e d U r l s :   s t r i n g [ ]   =   [ ] ;  
  
             f o r   ( l e t   i   =   0 ;   i   <   f i l e s . l e n g t h ;   i + + )   {  
                 c o n s t   f i l e   =   f i l e s [ i ] ;  
  
                 / /   F i l e   s i z e   v a l i d a t i o n  
                 i f   ( f i l e . s i z e   >   5   *   1 0 2 4   *   1 0 2 4 )   {  
                     t o a s t . e r r o r ( ` F i l e   " $ { f i l e . n a m e } "   i s   t o o   l a r g e .   E a c h   f i l e   m u s t   b e   u n d e r   5 M B . ` ) ;  
                     i f   ( i n p u t )   i n p u t . v a l u e   =   ' ' ;  
                     t o a s t . d i s m i s s ( l o a d i n g T o a s t ) ;  
                     r e t u r n ;  
                 }  
  
                 t r y   {  
                     / /   C o n v e r t   t o   f i x e d   8 0 0 x 8 0 0   s q u a r e   a n d   c o m p r e s s   t o   u n d e r   2 5 K B  
                     t o a s t . l o a d i n g (  
                         ` P r o c e s s i n g   $ { i   +   1 } / $ { f i l e s . l e n g t h } . . . ` ,  
                         {   i d :   l o a d i n g T o a s t   }  
                     ) ;  
                     c o n s t   c o m p r e s s e d F i l e   =   a w a i t   c o n v e r t P r o d u c t I m a g e ( f i l e ) ;  
                     c o n s o l e . l o g ( ` [ P r o d u c t I m a g e ]   P r o c e s s e d :   $ { ( f i l e . s i z e   /   1 0 2 4 ) . t o F i x e d ( 1 ) } K B   “å Æ   $ { ( c o m p r e s s e d F i l e . s i z e   /   1 0 2 4 ) . t o F i x e d ( 1 ) } K B   ( 8 0 0 x 8 0 0 ) ` ) ;  
                      
                     / /   U p l o a d   c o m p r e s s e d   i m a g e   t o   s e r v e r  
                     t o a s t . l o a d i n g (  
                         ` U p l o a d i n g   $ { i   +   1 } / $ { f i l e s . l e n g t h } . . . ` ,  
                         {   i d :   l o a d i n g T o a s t   }  
                     ) ;  
                     c o n s t   i m a g e U r l   =   a w a i t   u p l o a d I m a g e T o S e r v e r ( c o m p r e s s e d F i l e ,   a c t i v e T e n a n t I d   | |   ' d e f a u l t ' ) ;  
                     u p l o a d e d U r l s . p u s h ( i m a g e U r l ) ;  
                 }   c a t c h   ( e r r o r )   {  
                     c o n s o l e . e r r o r ( ` F a i l e d   t o   u p l o a d   $ { f i l e . n a m e } ` ,   e r r o r ) ;  
                     t o a s t . e r r o r ( ` U n a b l e   t o   u p l o a d   " $ { f i l e . n a m e } " .   $ { e r r o r   i n s t a n c e o f   E r r o r   ?   e r r o r . m e s s a g e   :   ' P l e a s e   t r y   a g a i n . ' } ` ) ;  
                     i f   ( i n p u t )   i n p u t . v a l u e   =   ' ' ;  
                     t o a s t . d i s m i s s ( l o a d i n g T o a s t ) ;  
                     r e t u r n ;  
                 }  
             }  
  
             / /   S u c c e s s  
             s e t F o r m D a t a ( {  
                 . . . f o r m D a t a ,  
                 g a l l e r y I m a g e s :   [ . . . c u r r e n t G a l l e r y ,   . . . u p l o a d e d U r l s ]  
             } ) ;  
  
             s e t H a s U n s a v e d C h a n g e s ( t r u e ) ;  
              
             / /   I m m e d i a t e l y   s a v e   d r a f t   a f t e r   i m a g e   u p l o a d  
             s e t T i m e o u t ( ( )   = >   {  
                 h a n d l e A u t o S a v e D r a f t ( ) ;  
                 t o a s t . s u c c e s s ( ' D r a f t   a u t o - s a v e d ' ,   {   d u r a t i o n :   2 0 0 0   } ) ;  
             } ,   1 0 0 ) ;  
  
             t o a s t . s u c c e s s ( ` S u c c e s s f u l l y   u p l o a d e d   $ { u p l o a d e d U r l s . l e n g t h }   i m a g e ( s ) ` ,   {   i d :   l o a d i n g T o a s t   } ) ;  
  
             i f   ( i n p u t )   i n p u t . v a l u e   =   ' ' ;  
         }   c a t c h   ( e r r o r )   {  
             c o n s o l e . e r r o r ( ' U p l o a d   e r r o r : ' ,   e r r o r ) ;  
             t o a s t . e r r o r ( ' A n   u n e x p e c t e d   e r r o r   o c c u r r e d   d u r i n g   u p l o a d ' ) ;  
             t o a s t . d i s m i s s ( l o a d i n g T o a s t ) ;  
         }  
     } ;  
  
     c o n s t   r e m o v e G a l l e r y I m a g e   =   a s y n c   ( i n d e x :   n u m b e r )   = >   {  
         c o n s t   i m a g e T o R e m o v e   =   f o r m D a t a . g a l l e r y I m a g e s ? . [ i n d e x ] ;  
          
         i f   ( i m a g e T o R e m o v e )   {  
             t r y   {  
                 / /   D e l e t e   f r o m   s e r v e r   i f   i t ' s   a   s e r v e r   U R L   ( e i t h e r   r e l a t i v e   o r   f u l l   U R L )  
                 i f   ( i m a g e T o R e m o v e . i n c l u d e s ( ' / u p l o a d s / ' ) )   {  
                     a w a i t   d e l e t e I m a g e F r o m S e r v e r ( i m a g e T o R e m o v e ,   a c t i v e T e n a n t I d ) ;  
                 }  
             }   c a t c h   ( e r r o r )   {  
                 c o n s o l e . e r r o r ( ' F a i l e d   t o   d e l e t e   i m a g e   f r o m   s e r v e r : ' ,   e r r o r ) ;  
                 t o a s t . e r r o r ( ' F a i l e d   t o   d e l e t e   i m a g e ' ) ;  
             }  
         }  
  
         c o n s t   u p d a t e d   =   [ . . . ( f o r m D a t a . g a l l e r y I m a g e s   | |   [ ] ) ] ;  
         u p d a t e d . s p l i c e ( i n d e x ,   1 ) ;  
         s e t F o r m D a t a ( {   . . . f o r m D a t a ,   g a l l e r y I m a g e s :   u p d a t e d   } ) ;  
     } ;  
  
     c o n s t   m o v e G a l l e r y I m a g e   =   ( f r o m I n d e x :   n u m b e r ,   t o I n d e x :   n u m b e r )   = >   {  
         c o n s t   u p d a t e d   =   [ . . . ( f o r m D a t a . g a l l e r y I m a g e s   | |   [ ] ) ] ;  
         c o n s t   [ m o v e d I t e m ]   =   u p d a t e d . s p l i c e ( f r o m I n d e x ,   1 ) ;  
         u p d a t e d . s p l i c e ( t o I n d e x ,   0 ,   m o v e d I t e m ) ;  
         s e t F o r m D a t a ( {   . . . f o r m D a t a ,   g a l l e r y I m a g e s :   u p d a t e d   } ) ;  
     } ;  
  
     / /   B u l k   H a n d l e r s  
     c o n s t   t o g g l e S e l e c t i o n   =   ( i d :   n u m b e r )   = >   {  
         i f   ( s e l e c t e d I d s . i n c l u d e s ( i d ) )   {  
             s e t S e l e c t e d I d s ( s e l e c t e d I d s . f i l t e r ( s i d   = >   s i d   ! = =   i d ) ) ;  
         }   e l s e   {  
             s e t S e l e c t e d I d s ( [ . . . s e l e c t e d I d s ,   i d ] ) ;  
         }  
     } ;  
  
     c o n s t   s e l e c t A l l   =   ( )   = >   {  
         i f   ( ! f i l t e r e d P r o d u c t s   | |   f i l t e r e d P r o d u c t s . l e n g t h   = = =   0 )   r e t u r n ;  
         i f   ( s e l e c t e d I d s . l e n g t h   = = =   f i l t e r e d P r o d u c t s . l e n g t h )   {  
             s e t S e l e c t e d I d s ( [ ] ) ;  
         }   e l s e   {  
             s e t S e l e c t e d I d s ( f i l t e r e d P r o d u c t s . m a p ( p   = >   p . i d ) ) ;  
         }  
     } ;  
  
     c o n s t   e x e c u t e B u l k A c t i o n   =   ( )   = >   {  
         i f   ( b u l k A c t i o n   = = =   ' c a t e g o r y ' )   {  
             i f   ( ! b u l k V a l u e )   r e t u r n   a l e r t ( " P l e a s e   s e l e c t   a   c a t e g o r y " ) ;  
             o n B u l k U p d a t e ( s e l e c t e d I d s ,   {   c a t e g o r y :   b u l k V a l u e   } ) ;  
         }   e l s e   i f   ( b u l k A c t i o n   = = =   ' d i s c o u n t ' )   {  
             o n B u l k U p d a t e ( s e l e c t e d I d s ,   {   d i s c o u n t :   b u l k V a l u e   } ) ;   / /   A l l o w   e m p t y   t o   c l e a r   d i s c o u n t  
         }   e l s e   i f   ( b u l k A c t i o n   = = =   ' s t a t u s ' )   {  
             i f   ( ! b u l k V a l u e )   r e t u r n   a l e r t ( " P l e a s e   s e l e c t   a   s t a t u s " ) ;  
             o n B u l k U p d a t e ( s e l e c t e d I d s ,   {   s t a t u s :   b u l k V a l u e   a s   ' A c t i v e '   |   ' D r a f t '   } ) ;  
         }  
          
         / /   R e s e t  
         s e t B u l k A c t i o n ( n u l l ) ;  
         s e t B u l k V a l u e ( ' ' ) ;  
         s e t S e l e c t e d I d s ( [ ] ) ;  
         a l e r t ( " B u l k   a c t i o n   c o m p l e t e d   s u c c e s s f u l l y ! " ) ;  
     } ;  
  
     c o n s t   e x e c u t e B u l k D e l e t e   =   ( )   = >   {  
         i f   ( w i n d o w . c o n f i r m ( ` A r e   y o u   s u r e   y o u   w a n t   t o   d e l e t e   $ { s e l e c t e d I d s . l e n g t h }   p r o d u c t s ? ` ) )   {  
             o n B u l k D e l e t e ( s e l e c t e d I d s ) ;  
             s e t S e l e c t e d I d s ( [ ] ) ;  
         }  
     } ;  
  
     c o n s t   a c t i v e V i e w O p t i o n   =   V I E W _ O P T I O N S . f i n d ( o p t i o n   = >   o p t i o n . v a l u e   = = =   v i e w M o d e )   | |   V I E W _ O P T I O N S [ 1 ] ;  
     c o n s t   A c t i v e V i e w I c o n   =   a c t i v e V i e w O p t i o n ? . i c o n   | |   S q u a r e ;  
     c o n s t   g r i d T e m p l a t e C l a s s   =   V I E W _ G R I D _ L A Y O U T S [ v i e w M o d e ] ;  
     c o n s t   i m a g e H e i g h t C l a s s   =   V I E W _ I M A G E _ H E I G H T [ v i e w M o d e ] ;  
     c o n s t   i s L i s t L i k e V i e w   =   v i e w M o d e   = = =   ' l i s t ' ;     / /   d e t a i l s   m o d e   n o w   u s e s   t a b l e   v i e w  
  
     r e t u r n   (  
         < d i v   c l a s s N a m e = " s p a c e - y - 6   a n i m a t e - f a d e - i n   r e l a t i v e " >  
             { / *   F i r s t   T i m e   H e l p   O v e r l a y   * / }  
             { s h o w F i r s t T i m e H e l p   & &   (  
                 < d i v   c l a s s N a m e = " f i x e d   i n s e t - 0   b g - b l a c k / 6 0   b a c k d r o p - b l u r - s m   z - 5 0   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   p - 4 " >  
                     < d i v   c l a s s N a m e = " b g - w h i t e   r o u n d e d - 2 x l   s h a d o w - 2 x l   m a x - w - m d   w - f u l l   p - 6   s p a c e - y - 4   a n i m a t e - f a d e - i n " >  
                         < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3 " >  
                             < d i v   c l a s s N a m e = " w - 1 2   h - 1 2   r o u n d e d - f u l l   b g - g r a d i e n t - t o - b r   f r o m - t e a l - 5 0 0   t o - p u r p l e - 6 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r " >  
                                 < A l e r t C i r c l e   c l a s s N a m e = " t e x t - w h i t e "   s i z e = { 2 4 }   / >  
                             < / d i v >  
                             < d i v >  
                                 < h 3   c l a s s N a m e = " t e x t - x l   f o n t - b o l d   t e x t - g r a y - 8 0 0 " > W e l c o m e   t o   P r o d u c t s ! < / h 3 >  
                                 < p   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 5 0 0 " > L e t ' s   g e t   y o u   s t a r t e d < / p >  
                             < / d i v >  
                         < / d i v >  
                          
                         < d i v   c l a s s N a m e = " s p a c e - y - 3   t e x t - s m   t e x t - g r a y - 6 0 0 " >  
                             < d i v   c l a s s N a m e = " f l e x   g a p - 3   i t e m s - s t a r t " >  
                                 < d i v   c l a s s N a m e = " w - 6   h - 6   r o u n d e d - f u l l   b g - t e a l - 1 0 0   t e x t - t e a l - 6 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   f l e x - s h r i n k - 0   f o n t - b o l d   t e x t - x s " > 1 < / d i v >  
                                 < d i v >  
                                     < p   c l a s s N a m e = " f o n t - s e m i b o l d   t e x t - g r a y - 8 0 0 " > C l i c k   " A d d   P r o d u c t "   t o   c r e a t e   y o u r   f i r s t   p r o d u c t < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > T h e   b u t t o n   i s   h i g h l i g h t e d   i n   t h e   t o p - r i g h t   c o r n e r < / p >  
                                 < / d i v >  
                             < / d i v >  
                              
                             < d i v   c l a s s N a m e = " f l e x   g a p - 3   i t e m s - s t a r t " >  
                                 < d i v   c l a s s N a m e = " w - 6   h - 6   r o u n d e d - f u l l   b g - t e a l - 1 0 0   t e x t - t e a l - 6 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   f l e x - s h r i n k - 0   f o n t - b o l d   t e x t - x s " > 2 < / d i v >  
                                 < d i v >  
                                     < p   c l a s s N a m e = " f o n t - s e m i b o l d   t e x t - g r a y - 8 0 0 " > U s e   t h e   t o o l b a r   t o   s e a r c h   a n d   f i l t e r   p r o d u c t s < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > C l i c k   o n   S e a r c h ,   F i l t e r s ,   o r   V i e w   t o   e x p a n d   o p t i o n s < / p >  
                                 < / d i v >  
                             < / d i v >  
                              
                             < d i v   c l a s s N a m e = " f l e x   g a p - 3   i t e m s - s t a r t " >  
                                 < d i v   c l a s s N a m e = " w - 6   h - 6   r o u n d e d - f u l l   b g - t e a l - 1 0 0   t e x t - t e a l - 6 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   f l e x - s h r i n k - 0   f o n t - b o l d   t e x t - x s " > 3 < / d i v >  
                                 < d i v >  
                                     < p   c l a s s N a m e = " f o n t - s e m i b o l d   t e x t - g r a y - 8 0 0 " > S e l e c t   p r o d u c t s   t o   p e r f o r m   b u l k   a c t i o n s < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > U s e   c h e c k b o x e s   t o   s e l e c t   m u l t i p l e   i t e m s   a t   o n c e < / p >  
                                 < / d i v >  
                             < / d i v >  
                         < / d i v >  
                          
                         < b u t t o n  
                             o n C l i c k = { ( )   = >   {  
                                 s e t S h o w F i r s t T i m e H e l p ( f a l s e ) ;  
                                 l o c a l S t o r a g e . s e t I t e m ( ' h a s S e e n P r o d u c t s H e l p ' ,   ' t r u e ' ) ;  
                             } }  
                             c l a s s N a m e = " w - f u l l   b g - g r a d i e n t - t o - r   f r o m - t e a l - 5 0 0   t o - p u r p l e - 6 0 0   t e x t - w h i t e   p y - 3   r o u n d e d - x l   f o n t - s e m i b o l d   h o v e r : s h a d o w - l g   t r a n s i t i o n - a l l   t r a n s f o r m   h o v e r : s c a l e - [ 1 . 0 2 ] "  
                         >  
                             G o t   i t ,   l e t ' s   g o !  
                         < / b u t t o n >  
                     < / d i v >  
                 < / d i v >  
             ) }  
  
             { / *   H e a d e r   * / }  
             < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   m d : f l e x - r o w   j u s t i f y - b e t w e e n   i t e m s - s t a r t   m d : i t e m s - c e n t e r   g a p - 4 " >  
                 < d i v >  
                       < h 2   c l a s s N a m e = " t e x t - 2 x l   f o n t - b o l d   t e x t - g r a y - 8 0 0 " > P r o d u c t s < / h 2 >  
                       < p   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 5 0 0 " > M a n a g e   y o u r   p r o d u c t   i n v e n t o r y < / p >  
                 < / d i v >  
                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3   w - f u l l   m d : w - a u t o " >  
                     < b u t t o n    
                         o n C l i c k = { ( )   = >   s e t S h o w F i r s t T i m e H e l p ( t r u e ) }  
                         c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 2   p x - 4   p y - 3   b g - w h i t e   b o r d e r - 2   b o r d e r - g r a y - 2 0 0   t e x t - g r a y - 7 0 0   r o u n d e d - x l   f o n t - s e m i b o l d   h o v e r : b o r d e r - t e a l - 4 0 0   h o v e r : t e x t - t e a l - 6 0 0   t r a n s i t i o n - a l l   t r a n s f o r m   h o v e r : s c a l e - [ 1 . 0 2 ] "  
                         t i t l e = " S h o w   h e l p   g u i d e "  
                     >  
                         < H e l p C i r c l e   s i z e = { 2 0 }   / >  
                         < s p a n   c l a s s N a m e = " h i d d e n   s m : i n l i n e " > H e l p < / s p a n >  
                     < / b u t t o n >  
                     < d i v   c l a s s N a m e = " r e l a t i v e   f l e x - 1   m d : f l e x - i n i t i a l " >  
                         < b u t t o n    
                             o n C l i c k = { ( )   = >   h a n d l e O p e n M o d a l ( ) }  
                             c l a s s N a m e = " w - f u l l   m d : w - a u t o   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 2   p x - 6   p y - 3   b g - g r a d i e n t - t o - r   f r o m - t e a l - 5 0 0   t o - p u r p l e - 6 0 0   t e x t - w h i t e   r o u n d e d - x l   f o n t - s e m i b o l d   s h a d o w - l g   h o v e r : s h a d o w - x l   t r a n s i t i o n - a l l   t r a n s f o r m   h o v e r : s c a l e - [ 1 . 0 2 ]   a n i m a t e - p u l s e - s u b t l e "  
                         >  
                             < P l u s   s i z e = { 2 0 }   / >   A d d   P r o d u c t  
                         < / b u t t o n >  
                         { p r o d u c t s . l e n g t h   = = =   0   & &   (  
                             < d i v   c l a s s N a m e = " a b s o l u t e   - b o t t o m - 8   l e f t - 0   r i g h t - 0   t e x t - c e n t e r " >  
                                 < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - t e a l - 6 0 0   f o n t - m e d i u m " > a"’æ å   S t a r t   h e r e ! < / s p a n >  
                             < / d i v >  
                         ) }  
                     < / d i v >  
                 < / d i v >  
             < / d i v >  
  
             { / *   M o d e r n   M o b i l e   T o o l b a r   * / }  
             < d i v   c l a s s N a m e = " b g - w h i t e   r o u n d e d - 2 x l   b o r d e r   b o r d e r - g r a y - 2 0 0   s h a d o w - l g   o v e r f l o w - h i d d e n   s t i c k y   t o p - 0   z - 2 0 " >  
                  
                 { / *   M o b i l e   A c c o r d i o n   M e n u   * / }  
                 < d i v   c l a s s N a m e = " m d : h i d d e n " >  
                     { / *   S e a r c h   S e c t i o n   * / }  
                     < d i v   c l a s s N a m e = " b o r d e r - b   b o r d e r - g r a y - 1 0 0 " >  
                         < b u t t o n  
                             o n C l i c k = { ( )   = >   s e t M o b i l e S e a r c h E x p a n d e d ( ! m o b i l e S e a r c h E x p a n d e d ) }  
                             c l a s s N a m e = " w - f u l l   p x - 4   p y - 4   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   h o v e r : b g - g r a y - 5 0   t r a n s i t i o n "  
                         >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3 " >  
                                 < d i v   c l a s s N a m e = { ` w - 1 0   h - 1 0   r o u n d e d - x l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   t r a n s i t i o n   $ {  
                                     m o b i l e S e a r c h E x p a n d e d   ?   ' b g - t e a l - 1 0 0 '   :   ' b g - g r a y - 1 0 0 '  
                                 } ` } >  
                                     < S e a r c h   s i z e = { 2 0 }   c l a s s N a m e = { m o b i l e S e a r c h E x p a n d e d   ?   ' t e x t - t e a l - 6 0 0 '   :   ' t e x t - g r a y - 6 0 0 ' }   / >  
                                 < / d i v >  
                                 < d i v   c l a s s N a m e = " t e x t - l e f t " >  
                                     < p   c l a s s N a m e = { ` f o n t - s e m i b o l d   $ { m o b i l e S e a r c h E x p a n d e d   ?   ' t e x t - t e a l - 7 0 0 '   :   ' t e x t - g r a y - 8 0 0 ' } ` } > S e a r c h < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > F i n d   p r o d u c t s   q u i c k l y < / p >  
                                 < / d i v >  
                             < / d i v >  
                             < C h e v r o n D o w n    
                                 s i z e = { 2 0 }    
                                 c l a s s N a m e = { ` t e x t - g r a y - 4 0 0   t r a n s i t i o n - t r a n s f o r m   $ { m o b i l e S e a r c h E x p a n d e d   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }  
                             / >  
                         < / b u t t o n >  
                          
                         { m o b i l e S e a r c h E x p a n d e d   & &   (  
                             < d i v   c l a s s N a m e = " p x - 4   p b - 4   s p a c e - y - 3   a n i m a t e - f a d e - i n " >  
                                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                     < i n p u t    
                                         t y p e = " c h e c k b o x "    
                                         c l a s s N a m e = " w - 5   h - 5   t e x t - t e a l - 6 0 0   r o u n d e d   f o c u s : r i n g - t e a l - 5 0 0   c u r s o r - p o i n t e r "  
                                         c h e c k e d = { f i l t e r e d P r o d u c t s . l e n g t h   >   0   & &   s e l e c t e d I d s . l e n g t h   = = =   f i l t e r e d P r o d u c t s . l e n g t h }  
                                         o n C h a n g e = { s e l e c t A l l }  
                                     / >  
                                     < s p a n   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 6 0 0   f o n t - m e d i u m " > S e l e c t   A l l   ( { f i l t e r e d P r o d u c t s . l e n g t h } ) < / s p a n >  
                                 < / d i v >  
                                  
                                 < d i v   c l a s s N a m e = " r e l a t i v e " >  
                                     < i n p u t    
                                         t y p e = " t e x t "    
                                         p l a c e h o l d e r = " S e a r c h   p r o d u c t s . . . "    
                                         c l a s s N a m e = " w - f u l l   p l - 1 0   p r - 4   p y - 3   t e x t - s m   r o u n d e d - x l   b g - g r a y - 5 0   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   b o r d e r - 2   b o r d e r - g r a y - 2 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 / 4 0   f o c u s : b o r d e r - t e a l - 5 0 0   t r a n s i t i o n "  
                                         v a l u e = { s e a r c h T e r m }  
                                         o n C h a n g e = { ( e )   = >   s e t S e a r c h T e r m ( e . t a r g e t . v a l u e ) }  
                                     / >  
                                     < S e a r c h   c l a s s N a m e = " a b s o l u t e   l e f t - 3   t o p - 3 . 5   t e x t - g r a y - 4 0 0 "   s i z e = { 1 8 }   / >  
                                 < / d i v >  
                                  
                                 < b u t t o n  
                                     o n C l i c k = { ( )   = >   s e t I s D e e p S e a r c h O p e n ( ! i s D e e p S e a r c h O p e n ) }  
                                     c l a s s N a m e = { ` w - f u l l   p x - 4   p y - 3   r o u n d e d - x l   t e x t - s m   f o n t - s e m i b o l d   t r a n s i t i o n   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 2   $ {  
                                         i s D e e p S e a r c h O p e n    
                                             ?   ' b g - g r a d i e n t - t o - r   f r o m - t e a l - 5 0 0   t o - p u r p l e - 6 0 0   t e x t - w h i t e   s h a d o w - m d '    
                                             :   ' b g - g r a y - 1 0 0   t e x t - g r a y - 7 0 0   h o v e r : b g - g r a y - 2 0 0 '  
                                     } ` }  
                                 >  
                                     < F i l t e r   s i z e = { 1 8 }   / >  
                                     { i s D e e p S e a r c h O p e n   ?   ' C l o s e   A d v a n c e d   S e a r c h '   :   ' A d v a n c e d   D e e p   S e a r c h ' }  
                                 < / b u t t o n >  
                                  
                                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   p t - 2   p x - 1 " >  
                                     < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > R e s u l t s : < / s p a n >  
                                     < s p a n   c l a s s N a m e = " t e x t - s m   f o n t - b o l d   t e x t - g r a y - 8 0 0 " > { f i l t e r e d P r o d u c t s . l e n g t h }   p r o d u c t s < / s p a n >  
                                 < / d i v >  
                             < / d i v >  
                         ) }  
                     < / d i v >  
  
                     { / *   F i l t e r s   S e c t i o n   * / }  
                     < d i v   c l a s s N a m e = " b o r d e r - b   b o r d e r - g r a y - 1 0 0 " >  
                         < b u t t o n  
                             o n C l i c k = { ( )   = >   s e t M o b i l e F i l t e r s E x p a n d e d ( ! m o b i l e F i l t e r s E x p a n d e d ) }  
                             c l a s s N a m e = " w - f u l l   p x - 4   p y - 4   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   h o v e r : b g - g r a y - 5 0   t r a n s i t i o n "  
                         >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3 " >  
                                 < d i v   c l a s s N a m e = { ` w - 1 0   h - 1 0   r o u n d e d - x l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   t r a n s i t i o n   r e l a t i v e   $ {  
                                     m o b i l e F i l t e r s E x p a n d e d   ?   ' b g - p u r p l e - 1 0 0 '   :   ' b g - g r a y - 1 0 0 '  
                                 } ` } >  
                                     < F i l t e r   s i z e = { 2 0 }   c l a s s N a m e = { m o b i l e F i l t e r s E x p a n d e d   ?   ' t e x t - p u r p l e - 6 0 0 '   :   ' t e x t - g r a y - 6 0 0 ' }   / >  
                                     { ( f i l t e r C a t e g o r y   | |   f i l t e r B r a n d   | |   f i l t e r S t a t u s )   & &   (  
                                         < d i v   c l a s s N a m e = " a b s o l u t e   - t o p - 1   - r i g h t - 1   w - 5   h - 5   b g - r e d - 5 0 0   r o u n d e d - f u l l   t e x t - w h i t e   t e x t - x s   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   f o n t - b o l d " >  
                                             { [ f i l t e r C a t e g o r y ,   f i l t e r B r a n d ,   f i l t e r S t a t u s ] . f i l t e r ( B o o l e a n ) . l e n g t h }  
                                         < / d i v >  
                                     ) }  
                                 < / d i v >  
                                 < d i v   c l a s s N a m e = " t e x t - l e f t " >  
                                     < p   c l a s s N a m e = { ` f o n t - s e m i b o l d   $ { m o b i l e F i l t e r s E x p a n d e d   ?   ' t e x t - p u r p l e - 7 0 0 '   :   ' t e x t - g r a y - 8 0 0 ' } ` } > F i l t e r s < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > N a r r o w   d o w n   r e s u l t s < / p >  
                                 < / d i v >  
                             < / d i v >  
                             < C h e v r o n D o w n    
                                 s i z e = { 2 0 }    
                                 c l a s s N a m e = { ` t e x t - g r a y - 4 0 0   t r a n s i t i o n - t r a n s f o r m   $ { m o b i l e F i l t e r s E x p a n d e d   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }  
                             / >  
                         < / b u t t o n >  
                          
                         { m o b i l e F i l t e r s E x p a n d e d   & &   (  
                             < d i v   c l a s s N a m e = " p x - 4   p b - 4   s p a c e - y - 3   a n i m a t e - f a d e - i n " >  
                                 < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                     < l a b e l   c l a s s N a m e = " t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e " > C a t e g o r y < / l a b e l >  
                                     < s e l e c t    
                                         c l a s s N a m e = " w - f u l l   p x - 4   p y - 3   b o r d e r - 2   b o r d e r - g r a y - 2 0 0   r o u n d e d - x l   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0 / 4 0   f o c u s : b o r d e r - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0   f o n t - m e d i u m "  
                                         v a l u e = { f i l t e r C a t e g o r y }  
                                         o n C h a n g e = { ( e )   = >   s e t F i l t e r C a t e g o r y ( e . t a r g e t . v a l u e ) }  
                                     >  
                                         < o p t i o n   v a l u e = " " > A l l   C a t e g o r i e s < / o p t i o n >  
                                         { c a t e g o r i e s . m a p ( c   = >   < o p t i o n   k e y = { c . n a m e }   v a l u e = { c . n a m e } > { c . n a m e } < / o p t i o n > ) }  
                                     < / s e l e c t >  
                                 < / d i v >  
  
                                 < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                     < l a b e l   c l a s s N a m e = " t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e " > B r a n d < / l a b e l >  
                                     < s e l e c t    
                                         c l a s s N a m e = " w - f u l l   p x - 4   p y - 3   b o r d e r - 2   b o r d e r - g r a y - 2 0 0   r o u n d e d - x l   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0 / 4 0   f o c u s : b o r d e r - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0   f o n t - m e d i u m "  
                                         v a l u e = { f i l t e r B r a n d }  
                                         o n C h a n g e = { ( e )   = >   s e t F i l t e r B r a n d ( e . t a r g e t . v a l u e ) }  
                                     >  
                                         < o p t i o n   v a l u e = " " > A l l   B r a n d s < / o p t i o n >  
                                         { b r a n d s . m a p ( b   = >   < o p t i o n   k e y = { b . n a m e }   v a l u e = { b . n a m e } > { b . n a m e } < / o p t i o n > ) }  
                                     < / s e l e c t >  
                                 < / d i v >  
  
                                 < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                     < l a b e l   c l a s s N a m e = " t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e " > S t a t u s < / l a b e l >  
                                     < s e l e c t    
                                         c l a s s N a m e = " w - f u l l   p x - 4   p y - 3   b o r d e r - 2   b o r d e r - g r a y - 2 0 0   r o u n d e d - x l   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0 / 4 0   f o c u s : b o r d e r - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0   f o n t - m e d i u m "  
                                         v a l u e = { f i l t e r S t a t u s }  
                                         o n C h a n g e = { ( e )   = >   s e t F i l t e r S t a t u s ( e . t a r g e t . v a l u e ) }  
                                     >  
                                         < o p t i o n   v a l u e = " " > A l l   S t a t u s < / o p t i o n >  
                                         < o p t i o n   v a l u e = " A c t i v e " > A c t i v e < / o p t i o n >  
                                         < o p t i o n   v a l u e = " D r a f t " > D r a f t < / o p t i o n >  
                                     < / s e l e c t >  
                                 < / d i v >  
  
                                 { ( s e a r c h T e r m   | |   f i l t e r C a t e g o r y   | |   f i l t e r B r a n d   | |   f i l t e r S t a t u s )   & &   (  
                                     < b u t t o n    
                                         o n C l i c k = { r e s e t F i l t e r s }  
                                         c l a s s N a m e = " w - f u l l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 2   p x - 4   p y - 3   t e x t - s m   t e x t - w h i t e   b g - g r a d i e n t - t o - r   f r o m - r e d - 5 0 0   t o - p i n k - 6 0 0   h o v e r : s h a d o w - l g   r o u n d e d - x l   f o n t - s e m i b o l d   t r a n s i t i o n - a l l "  
                                     >  
                                         < R e f r e s h C w   s i z e = { 1 6 }   / >   R e s e t   A l l   F i l t e r s  
                                     < / b u t t o n >  
                                 ) }  
                             < / d i v >  
                         ) }  
                     < / d i v >  
  
                     { / *   V i e w   S e c t i o n   * / }  
                     < d i v >  
                         < b u t t o n  
                             o n C l i c k = { ( )   = >   s e t M o b i l e V i e w E x p a n d e d ( ! m o b i l e V i e w E x p a n d e d ) }  
                             c l a s s N a m e = " w - f u l l   p x - 4   p y - 4   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   h o v e r : b g - g r a y - 5 0   t r a n s i t i o n "  
                         >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3 " >  
                                 < d i v   c l a s s N a m e = { ` w - 1 0   h - 1 0   r o u n d e d - x l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   t r a n s i t i o n   $ {  
                                     m o b i l e V i e w E x p a n d e d   ?   ' b g - i n d i g o - 1 0 0 '   :   ' b g - g r a y - 1 0 0 '  
                                 } ` } >  
                                     < A c t i v e V i e w I c o n   s i z e = { 2 0 }   c l a s s N a m e = { m o b i l e V i e w E x p a n d e d   ?   ' t e x t - i n d i g o - 6 0 0 '   :   ' t e x t - g r a y - 6 0 0 ' }   / >  
                                 < / d i v >  
                                 < d i v   c l a s s N a m e = " t e x t - l e f t " >  
                                     < p   c l a s s N a m e = { ` f o n t - s e m i b o l d   $ { m o b i l e V i e w E x p a n d e d   ?   ' t e x t - i n d i g o - 7 0 0 '   :   ' t e x t - g r a y - 8 0 0 ' } ` } > V i e w :   { a c t i v e V i e w O p t i o n ? . l a b e l } < / p >  
                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > C h a n g e   l a y o u t   s t y l e < / p >  
                                 < / d i v >  
                             < / d i v >  
                             < C h e v r o n D o w n    
                                 s i z e = { 2 0 }    
                                 c l a s s N a m e = { ` t e x t - g r a y - 4 0 0   t r a n s i t i o n - t r a n s f o r m   $ { m o b i l e V i e w E x p a n d e d   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }  
                             / >  
                         < / b u t t o n >  
                          
                         { m o b i l e V i e w E x p a n d e d   & &   (  
                             < d i v   c l a s s N a m e = " p x - 4   p b - 4   s p a c e - y - 2   a n i m a t e - f a d e - i n " >  
                                 { V I E W _ O P T I O N S . m a p ( o p t i o n   = >   {  
                                     c o n s t   I c o n   =   o p t i o n . i c o n ;  
                                     c o n s t   i s A c t i v e   =   o p t i o n . v a l u e   = = =   v i e w M o d e ;  
                                     r e t u r n   (  
                                         < b u t t o n  
                                             k e y = { o p t i o n . v a l u e }  
                                             t y p e = " b u t t o n "  
                                             o n C l i c k = { ( )   = >   {  
                                                 s e t V i e w M o d e ( o p t i o n . v a l u e ) ;  
                                                 / /   A u t o - c o l l a p s e   a f t e r   s e l e c t i o n   o n   m o b i l e   f o r   b e t t e r   U X  
                                                 s e t T i m e o u t ( ( )   = >   s e t M o b i l e V i e w E x p a n d e d ( f a l s e ) ,   3 0 0 ) ;  
                                             } }  
                                             c l a s s N a m e = { ` w - f u l l   f l e x   i t e m s - c e n t e r   g a p - 3   p x - 4   p y - 3   r o u n d e d - x l   t r a n s i t i o n   t e x t - l e f t   $ {  
                                                 i s A c t i v e    
                                                     ?   ' b g - g r a d i e n t - t o - r   f r o m - i n d i g o - 5 0 0   t o - p u r p l e - 6 0 0   t e x t - w h i t e   s h a d o w - m d   t r a n s f o r m   s c a l e - [ 1 . 0 2 ] '    
                                                     :   ' b g - g r a y - 5 0   h o v e r : b g - g r a y - 1 0 0   b o r d e r - 2   b o r d e r - t r a n s p a r e n t   h o v e r : b o r d e r - g r a y - 2 0 0 '  
                                             } ` }  
                                         >  
                                             < I c o n   s i z e = { 2 0 }   c l a s s N a m e = { i s A c t i v e   ?   ' t e x t - w h i t e '   :   ' t e x t - g r a y - 5 0 0 ' }   / >  
                                             < d i v   c l a s s N a m e = " f l e x - 1 " >  
                                                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   g a p - 2 " >  
                                                     < s p a n   c l a s s N a m e = { ` t e x t - s m   f o n t - b o l d   $ { i s A c t i v e   ?   ' t e x t - w h i t e '   :   ' t e x t - g r a y - 8 0 0 ' } ` } > { o p t i o n . l a b e l } < / s p a n >  
                                                     { i s A c t i v e   & &   < C h e c k C i r c l e   s i z e = { 1 8 }   c l a s s N a m e = " t e x t - w h i t e "   / > }  
                                                 < / d i v >  
                                                 < p   c l a s s N a m e = { ` t e x t - x s   $ { i s A c t i v e   ?   ' t e x t - w h i t e / 9 0 '   :   ' t e x t - g r a y - 5 0 0 ' } ` } > { o p t i o n . d e s c r i p t i o n } < / p >  
                                             < / d i v >  
                                         < / b u t t o n >  
                                     ) ;  
                                 } ) }  
                             < / d i v >  
                         ) }  
                     < / d i v >  
                 < / d i v >  
  
                 { / *   D e s k t o p   V i e w   ( O r i g i n a l )   * / }  
                 < d i v   c l a s s N a m e = " h i d d e n   m d : b l o c k   p - 4   s p a c e - y - 4 " >  
                     { / *   T o p   R o w :   S e a r c h   &   S e l e c t   A l l   * / }  
                     < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   s m : f l e x - r o w   g a p - 4   j u s t i f y - b e t w e e n   i t e m s - c e n t e r " >  
                         < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 4   w - f u l l   s m : w - a u t o " >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                 < i n p u t    
                                     t y p e = " c h e c k b o x "    
                                     c l a s s N a m e = " w - 5   h - 5   t e x t - p u r p l e - 6 0 0   r o u n d e d   f o c u s : r i n g - p u r p l e - 5 0 0   c u r s o r - p o i n t e r "  
                                     c h e c k e d = { f i l t e r e d P r o d u c t s . l e n g t h   >   0   & &   s e l e c t e d I d s . l e n g t h   = = =   f i l t e r e d P r o d u c t s . l e n g t h }  
                                     o n C h a n g e = { s e l e c t A l l }  
                                 / >  
                                 < s p a n   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 6 0 0 " > S e l e c t   A l l < / s p a n >  
                             < / d i v >  
                             < d i v   c l a s s N a m e = " h - 6   w - p x   b g - g r a y - 2 0 0   m x - 2   h i d d e n   s m : b l o c k " > < / d i v >  
                             < d i v   c l a s s N a m e = " r e l a t i v e   f l e x - 1   w - f u l l   s m : m a x - w - x s " >  
                                   < i n p u t    
                                       t y p e = " t e x t "    
                                       p l a c e h o l d e r = " S e a r c h   p r o d u c t s . . . "    
                                       c l a s s N a m e = " w - f u l l   p l - 1 0   p r - 4   p y - 2   t e x t - s m   r o u n d e d - x l   b g - g r a y - 5 0   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   b o r d e r   b o r d e r - g r a y - 2 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 / 4 0   f o c u s : b o r d e r - t e a l - 5 0 0   t r a n s i t i o n "  
                                       v a l u e = { s e a r c h T e r m }  
                                       o n C h a n g e = { ( e )   = >   s e t S e a r c h T e r m ( e . t a r g e t . v a l u e ) }  
                                   / >  
                                   < S e a r c h   c l a s s N a m e = " a b s o l u t e   l e f t - 3   t o p - 2 . 5   t e x t - g r a y - 4 0 0 "   s i z e = { 1 6 }   / >  
                             < / d i v >  
                             < b u t t o n  
                                 o n C l i c k = { ( )   = >   s e t I s D e e p S e a r c h O p e n ( ! i s D e e p S e a r c h O p e n ) }  
                                 c l a s s N a m e = { ` p x - 3   p y - 2   r o u n d e d - l g   t e x t - s m   f o n t - m e d i u m   t r a n s i t i o n   f l e x   i t e m s - c e n t e r   g a p - 2   $ {  
                                     i s D e e p S e a r c h O p e n    
                                         ?   ' b g - t e a l - 5 0 0   t e x t - w h i t e '    
                                         :   ' b g - g r a y - 1 0 0   t e x t - g r a y - 6 0 0   h o v e r : b g - g r a y - 2 0 0 '  
                                 } ` }  
                                 t i t l e = " A d v a n c e d   D e e p   S e a r c h "  
                             >  
                                 < F i l t e r   s i z e = { 1 6 }   / >  
                                 D e e p   S e a r c h  
                             < / b u t t o n >  
                         < / d i v >  
                         < d i v   c l a s s N a m e = " w - f u l l   s m : w - a u t o   t e x t - s m   t e x t - g r a y - 5 0 0   w h i t e s p a c e - n o w r a p   t e x t - r i g h t   m d : h i d d e n " >  
                               S h o w i n g   < s p a n   c l a s s N a m e = " f o n t - b o l d   t e x t - g r a y - 8 0 0 " > { f i l t e r e d P r o d u c t s . l e n g t h } < / s p a n >   p r o d u c t s  
                         < / d i v >  
                     < / d i v >  
  
                     { / *   B o t t o m   R o w :   F i l t e r s   * / }  
                     < d i v   c l a s s N a m e = " f l e x   f l e x - w r a p   i t e m s - c e n t e r   g a p - 3   p t - 2   b o r d e r - t   b o r d e r - g r a y - 1 0 0 " >  
                           < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   t e x t - s m   t e x t - g r a y - 5 0 0 " >  
                                 < F i l t e r   s i z e = { 1 6 }   / >  
                                 < s p a n   c l a s s N a m e = " f o n t - m e d i u m " > F i l t e r s : < / s p a n >  
                           < / d i v >  
                            
                           < s e l e c t    
                               c l a s s N a m e = " p x - 3   p y - 1 . 5   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - m d   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0 "  
                               v a l u e = { f i l t e r C a t e g o r y }  
                               o n C h a n g e = { ( e )   = >   s e t F i l t e r C a t e g o r y ( e . t a r g e t . v a l u e ) }  
                           >  
                               < o p t i o n   v a l u e = " " > A l l   C a t e g o r i e s < / o p t i o n >  
                               { c a t e g o r i e s . m a p ( c   = >   < o p t i o n   k e y = { c . n a m e }   v a l u e = { c . n a m e } > { c . n a m e } < / o p t i o n > ) }  
                           < / s e l e c t >  
  
                           < s e l e c t    
                               c l a s s N a m e = " p x - 3   p y - 1 . 5   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - m d   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0 "  
                               v a l u e = { f i l t e r B r a n d }  
                               o n C h a n g e = { ( e )   = >   s e t F i l t e r B r a n d ( e . t a r g e t . v a l u e ) }  
                           >  
                               < o p t i o n   v a l u e = " " > A l l   B r a n d s < / o p t i o n >  
                               { b r a n d s . m a p ( b   = >   < o p t i o n   k e y = { b . n a m e }   v a l u e = { b . n a m e } > { b . n a m e } < / o p t i o n > ) }  
                           < / s e l e c t >  
  
                           < s e l e c t    
                               c l a s s N a m e = " p x - 3   p y - 1 . 5   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - m d   t e x t - s m   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   b g - w h i t e   t e x t - g r a y - 7 0 0 "  
                               v a l u e = { f i l t e r S t a t u s }  
                               o n C h a n g e = { ( e )   = >   s e t F i l t e r S t a t u s ( e . t a r g e t . v a l u e ) }  
                           >  
                               < o p t i o n   v a l u e = " " > A l l   S t a t u s < / o p t i o n >  
                               < o p t i o n   v a l u e = " A c t i v e " > A c t i v e < / o p t i o n >  
                               < o p t i o n   v a l u e = " D r a f t " > D r a f t < / o p t i o n >  
                           < / s e l e c t >  
  
                           { ( s e a r c h T e r m   | |   f i l t e r C a t e g o r y   | |   f i l t e r B r a n d   | |   f i l t e r S t a t u s )   & &   (  
                               < b u t t o n    
                                   o n C l i c k = { r e s e t F i l t e r s }  
                                   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 1   t e x t - s m   t e x t - r e d - 5 0 0   h o v e r : t e x t - r e d - 7 0 0   f o n t - m e d i u m   m l - a u t o "  
                               >  
                                   < R e f r e s h C w   s i z e = { 1 4 }   / >   R e s e t  
                               < / b u t t o n >  
                           ) }  
                     < / d i v >  
  
                     { / *   D e s k t o p   V i e w   D r o p d o w n   a n d   P r o d u c t   C o u n t   * / }  
                     < d i v   c l a s s N a m e = " f l e x   w - f u l l   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   g a p - 3   p t - 2   b o r d e r - t   b o r d e r - g r a y - 1 0 0 " >  
                         < d i v   c l a s s N a m e = " r e l a t i v e "   r e f = { v i e w M e n u R e f } >  
                             < b u t t o n    
                                 t y p e = " b u t t o n "  
                                 o n C l i c k = { ( )   = >   s e t I s V i e w M e n u O p e n ( ! i s V i e w M e n u O p e n ) }  
                                 c l a s s N a m e = { ` r o u n d e d - x l   p x - 4   p y - 2 . 5   t e x t - l e f t   t r a n s i t i o n   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 / 4 0   s h a d o w - s m   b g - w h i t e   b o r d e r   $ { i s V i e w M e n u O p e n   ?   ' b o r d e r - t e a l - 5 0 0 '   :   ' b o r d e r - g r a y - 2 0 0   h o v e r : b o r d e r - t e a l - 4 0 0 ' } ` }  
                             >  
                                 < s p a n   c l a s s N a m e = " t e x t - [ 1 0 p x ]   u p p e r c a s e   t r a c k i n g - [ 0 . 3 e m ]   t e x t - g r a y - 4 0 0 " > V i e w < / s p a n >  
                                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   g a p - 3   m t - 1 " >  
                                     < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                         < A c t i v e V i e w I c o n   s i z e = { 1 6 }   c l a s s N a m e = " t e x t - t e a l - 6 0 0 "   / >  
                                         < s p a n   c l a s s N a m e = " t e x t - s m   f o n t - s e m i b o l d   t e x t - g r a y - 8 0 0 " > { a c t i v e V i e w O p t i o n ? . l a b e l } < / s p a n >  
                                     < / d i v >  
                                     < C h e v r o n D o w n   s i z e = { 1 4 }   c l a s s N a m e = { ` t e x t - g r a y - 4 0 0   t r a n s i t i o n   $ { i s V i e w M e n u O p e n   ?   ' t r a n s f o r m   r o t a t e - 1 8 0 '   :   ' ' } ` }   / >  
                                 < / d i v >  
                             < / b u t t o n >  
  
                             { i s V i e w M e n u O p e n   & &   (  
                                 < d i v   c l a s s N a m e = " a b s o l u t e   r i g h t - 0   m t - 2   w - 7 2   b g - w h i t e   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - x l   s h a d o w - l g   z - 4 0   o v e r f l o w - h i d d e n " >  
                                     < d i v   c l a s s N a m e = " p x - 4   p y - 3   b o r d e r - b   b o r d e r - g r a y - 1 0 0   b g - g r a y - 5 0 " >  
                                         < p   c l a s s N a m e = " t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 7 0 0   u p p e r c a s e   t r a c k i n g - w i d e r " > V i e w   o p t i o n s < / p >  
                                         < p   c l a s s N a m e = " t e x t - [ 1 1 p x ]   t e x t - g r a y - 5 0 0 " > S w i t c h   b e t w e e n   l a y o u t s < / p >  
                                     < / d i v >  
                                     < d i v   c l a s s N a m e = " p y - 1 " >  
                                         { V I E W _ O P T I O N S . m a p ( o p t i o n   = >   {  
                                             c o n s t   I c o n   =   o p t i o n . i c o n ;  
                                             c o n s t   i s A c t i v e   =   o p t i o n . v a l u e   = = =   v i e w M o d e ;  
                                             r e t u r n   (  
                                                 < b u t t o n  
                                                     k e y = { o p t i o n . v a l u e }  
                                                     t y p e = " b u t t o n "  
                                                     o n C l i c k = { ( )   = >   {  
                                                         s e t V i e w M o d e ( o p t i o n . v a l u e ) ;  
                                                         s e t I s V i e w M e n u O p e n ( f a l s e ) ;  
                                                     } }  
                                                     c l a s s N a m e = { ` w - f u l l   f l e x   i t e m s - s t a r t   g a p - 3   p x - 4   p y - 2 . 5   t r a n s i t i o n   t e x t - l e f t   $ { i s A c t i v e   ?   ' b g - t e a l - 5 0   b o r d e r - l - 4   b o r d e r - t e a l - 5 0 0 '   :   ' h o v e r : b g - g r a y - 5 0 ' } ` }  
                                                 >  
                                                     < I c o n   s i z e = { 1 8 }   c l a s s N a m e = { ` m t - 0 . 5   $ { i s A c t i v e   ?   ' t e x t - t e a l - 6 0 0 '   :   ' t e x t - g r a y - 4 0 0 ' } ` }   / >  
                                                     < d i v   c l a s s N a m e = " f l e x - 1 " >  
                                                         < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   g a p - 2 " >  
                                                             < s p a n   c l a s s N a m e = { ` t e x t - s m   f o n t - s e m i b o l d   $ { i s A c t i v e   ?   ' t e x t - t e a l - 7 0 0 '   :   ' t e x t - g r a y - 7 0 0 ' } ` } > { o p t i o n . l a b e l } < / s p a n >  
                                                             { i s A c t i v e   & &   < C h e c k C i r c l e   s i z e = { 1 6 }   c l a s s N a m e = " t e x t - t e a l - 5 0 0 "   / > }  
                                                         < / d i v >  
                                                         < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > { o p t i o n . d e s c r i p t i o n } < / p >  
                                                     < / d i v >  
                                                 < / b u t t o n >  
                                             ) ;  
                                         } ) }  
                                     < / d i v >  
                                     < d i v   c l a s s N a m e = " p x - 4   p y - 3   b g - g r a y - 5 0   t e x t - x s   t e x t - g r a y - 5 0 0   b o r d e r - t   b o r d e r - g r a y - 1 0 0   f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                         < A l e r t C i r c l e   s i z e = { 1 4 }   c l a s s N a m e = " t e x t - g r a y - 4 0 0 "   / >  
                                         P e r s o n a l i z e   h o w   t h e   c a t a l o g   g r i d   l o o k s   a n d   f e e l s .  
                                     < / d i v >  
                                 < / d i v >  
                             ) }  
                         < / d i v >  
                         < d i v   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 5 0 0   w h i t e s p a c e - n o w r a p " >  
                               S h o w i n g   < s p a n   c l a s s N a m e = " f o n t - b o l d   t e x t - g r a y - 8 0 0 " > { f i l t e r e d P r o d u c t s . l e n g t h } < / s p a n >   p r o d u c t s  
                         < / d i v >  
                     < / d i v >  
                 < / d i v >  
             < / d i v >  
  
             { / *   D e e p   S e a r c h   P a n e l   * / }  
             { i s D e e p S e a r c h O p e n   & &   (  
                 < d i v   c l a s s N a m e = " b g - w h i t e   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - x l   p - 6   s h a d o w - l g " >  
                     < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   m b - 4 " >  
                         < h 3   c l a s s N a m e = " t e x t - l g   f o n t - b o l d   t e x t - g r a y - 8 0 0   f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                             < F i l t e r   c l a s s N a m e = " t e x t - t e a l - 5 0 0 "   s i z e = { 2 0 }   / >  
                             A d v a n c e d   D e e p   S e a r c h  
                         < / h 3 >  
                         < b u t t o n  
                             o n C l i c k = { ( )   = >   s e t I s D e e p S e a r c h O p e n ( f a l s e ) }  
                             c l a s s N a m e = " t e x t - g r a y - 4 0 0   h o v e r : t e x t - g r a y - 6 0 0   t r a n s i t i o n "  
                         >  
                             < X   s i z e = { 2 0 }   / >  
                         < / b u t t o n >  
                     < / d i v >  
  
                     < d i v   c l a s s N a m e = " g r i d   g r i d - c o l s - 1   m d : g r i d - c o l s - 2   g a p - 6 " >  
                         { / *   S e a r c h   T e r m   * / }  
                         < d i v   c l a s s N a m e = " m d : c o l - s p a n - 2 " >  
                             < l a b e l   c l a s s N a m e = " b l o c k   t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   m b - 2 " > S e a r c h   Q u e r y < / l a b e l >  
                             < i n p u t  
                                 t y p e = " t e x t "  
                                 v a l u e = { d e e p S e a r c h T e r m }  
                                 o n C h a n g e = { ( e )   = >   s e t D e e p S e a r c h T e r m ( e . t a r g e t . v a l u e ) }  
                                 p l a c e h o l d e r = " E n t e r   s e a r c h   t e r m . . . "  
                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b g - g r a y - 5 0   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0   f o c u s : b o r d e r - t e a l - 5 0 0 "  
                             / >  
                         < / d i v >  
  
                         { / *   S e a r c h   I n   F i e l d s   * / }  
                         < d i v >  
                             < l a b e l   c l a s s N a m e = " b l o c k   t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   m b - 2 " > S e a r c h   I n < / l a b e l >  
                             < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                 { O b j e c t . e n t r i e s ( s e a r c h I n F i e l d s ) . m a p ( ( [ f i e l d ,   c h e c k e d ] )   = >   (  
                                     < l a b e l   k e y = { f i e l d }   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   t e x t - s m   t e x t - g r a y - 6 0 0   c u r s o r - p o i n t e r " >  
                                         < i n p u t  
                                             t y p e = " c h e c k b o x "  
                                             c h e c k e d = { c h e c k e d }  
                                             o n C h a n g e = { ( e )   = >   s e t S e a r c h I n F i e l d s ( {   . . . s e a r c h I n F i e l d s ,   [ f i e l d ] :   e . t a r g e t . c h e c k e d   } ) }  
                                             c l a s s N a m e = " w - 4   h - 4   r o u n d e d   b o r d e r - g r a y - 3 0 0   b g - w h i t e   t e x t - t e a l - 5 0 0   f o c u s : r i n g - t e a l - 5 0 0 "  
                                         / >  
                                         < s p a n   c l a s s N a m e = " c a p i t a l i z e " > { f i e l d } < / s p a n >  
                                     < / l a b e l >  
                                 ) ) }  
                             < / d i v >  
                         < / d i v >  
  
                         { / *   P r i c e   R a n g e   * / }  
                         < d i v >  
                             < l a b e l   c l a s s N a m e = " b l o c k   t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   m b - 2 " > P r i c e   R a n g e < / l a b e l >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                 < i n p u t  
                                     t y p e = " n u m b e r "  
                                     v a l u e = { p r i c e R a n g e . m i n }  
                                     o n C h a n g e = { ( e )   = >   s e t P r i c e R a n g e ( {   . . . p r i c e R a n g e ,   m i n :   e . t a r g e t . v a l u e   } ) }  
                                     p l a c e h o l d e r = " M i n "  
                                     c l a s s N a m e = " w - f u l l   p x - 3   p y - 2   b g - g r a y - 5 0   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 "  
                                 / >  
                                 < s p a n   c l a s s N a m e = " t e x t - g r a y - 4 0 0 " > “Ç ö < / s p a n >  
                                 < i n p u t  
                                     t y p e = " n u m b e r "  
                                     v a l u e = { p r i c e R a n g e . m a x }  
                                     o n C h a n g e = { ( e )   = >   s e t P r i c e R a n g e ( {   . . . p r i c e R a n g e ,   m a x :   e . t a r g e t . v a l u e   } ) }  
                                     p l a c e h o l d e r = " M a x "  
                                     c l a s s N a m e = " w - f u l l   p x - 3   p y - 2   b g - g r a y - 5 0   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 "  
                                 / >  
                             < / d i v >  
                         < / d i v >  
  
                         { / *   S t o c k   R a n g e   * / }  
                         < d i v   c l a s s N a m e = " m d : c o l - s p a n - 2 " >  
                             < l a b e l   c l a s s N a m e = " b l o c k   t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   m b - 2 " > S t o c k   R a n g e < / l a b e l >  
                             < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                 < i n p u t  
                                     t y p e = " n u m b e r "  
                                     v a l u e = { s t o c k R a n g e . m i n }  
                                     o n C h a n g e = { ( e )   = >   s e t S t o c k R a n g e ( {   . . . s t o c k R a n g e ,   m i n :   e . t a r g e t . v a l u e   } ) }  
                                     p l a c e h o l d e r = " M i n   S t o c k "  
                                     c l a s s N a m e = " w - f u l l   p x - 3   p y - 2   b g - g r a y - 5 0   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 "  
                                 / >  
                                 < s p a n   c l a s s N a m e = " t e x t - g r a y - 4 0 0 " > “Ç ö < / s p a n >  
                                 < i n p u t  
                                     t y p e = " n u m b e r "  
                                     v a l u e = { s t o c k R a n g e . m a x }  
                                     o n C h a n g e = { ( e )   = >   s e t S t o c k R a n g e ( {   . . . s t o c k R a n g e ,   m a x :   e . t a r g e t . v a l u e   } ) }  
                                     p l a c e h o l d e r = " M a x   S t o c k "  
                                     c l a s s N a m e = " w - f u l l   p x - 3   p y - 2   b g - g r a y - 5 0   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - g r a y - 9 0 0   p l a c e h o l d e r - g r a y - 4 0 0   f o c u s : o u t l i n e - n o n e   f o c u s : r i n g - 2   f o c u s : r i n g - t e a l - 5 0 0 "  
                                 / >  
                             < / d i v >  
                         < / d i v >  
  
                         { / *   A c t i o n s   * / }  
                         < d i v   c l a s s N a m e = " m d : c o l - s p a n - 2   f l e x   j u s t i f y - e n d   g a p - 3   p t - 2 " >  
                             < b u t t o n  
                                 o n C l i c k = { r e s e t F i l t e r s }  
                                 c l a s s N a m e = " p x - 4   p y - 2   b g - g r a y - 1 0 0   t e x t - g r a y - 6 0 0   r o u n d e d - l g   h o v e r : b g - g r a y - 2 0 0   t r a n s i t i o n "  
                             >  
                                 C l e a r   A l l  
                             < / b u t t o n >  
                             < b u t t o n  
                                 o n C l i c k = { ( )   = >   {  
                                     / /   S e a r c h   i s   a p p l i e d   a u t o m a t i c a l l y   v i a   f i l t e r e d P r o d u c t s  
                                     t o a s t . s u c c e s s ( ` F o u n d   $ { f i l t e r e d P r o d u c t s . l e n g t h }   p r o d u c t s ` ) ;  
                                 } }  
                                 c l a s s N a m e = " p x - 4   p y - 2   b g - t e a l - 5 0 0   t e x t - w h i t e   r o u n d e d - l g   h o v e r : b g - t e a l - 6 0 0   t r a n s i t i o n   f l e x   i t e m s - c e n t e r   g a p - 2 "  
                             >  
                                 < S e a r c h   s i z e = { 1 6 }   / >  
                                 A p p l y   S e a r c h  
                             < / b u t t o n >  
                         < / d i v >  
                     < / d i v >  
                 < / d i v >  
             ) }  
  
             { / *   B u l k   A c t i o n s   F l o a t i n g   B a r   * / }  
             { s e l e c t e d I d s . l e n g t h   >   0   & &   (  
                 < d i v   c l a s s N a m e = " f i x e d   b o t t o m - 6   l e f t - 1 / 2   t r a n s f o r m   - t r a n s l a t e - x - 1 / 2   b g - w h i t e   t e x t - g r a y - 8 0 0   p x - 6   p y - 3   r o u n d e d - x l   s h a d o w - x l   b o r d e r   b o r d e r - g r a y - 2 0 0   z - 5 0   f l e x   i t e m s - c e n t e r   g a p - 6   a n i m a t e - i n   s l i d e - i n - f r o m - b o t t o m - 4 " >  
                       < s p a n   c l a s s N a m e = " f o n t - b o l d   t e x t - s m   b g - t e a l - 5 0 0   t e x t - w h i t e   p x - 3   p y - 1   r o u n d e d - l g " > { s e l e c t e d I d s . l e n g t h }   S e l e c t e d < / s p a n >  
                        
                       < d i v   c l a s s N a m e = " h - 6   w - p x   b g - g r a y - 2 0 0 " > < / d i v >  
                        
                       < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                             < b u t t o n    
                                 o n C l i c k = { ( )   = >   s e t B u l k A c t i o n ( ' c a t e g o r y ' ) }  
                                 c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   h o v e r : t e x t - t e a l - 6 0 0   t r a n s i t i o n   t e x t - s m   f o n t - m e d i u m "  
                             >  
                                 < L a y e r s   s i z e = { 1 6 }   / >   C a t e g o r y  
                             < / b u t t o n >  
                             < b u t t o n    
                                 o n C l i c k = { ( )   = >   s e t B u l k A c t i o n ( ' d i s c o u n t ' ) }  
                                 c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   h o v e r : t e x t - p u r p l e - 3 0 0   t r a n s i t i o n   t e x t - s m   f o n t - m e d i u m "  
                             >  
                                 < P e r c e n t   s i z e = { 1 6 }   / >   D i s c o u n t  
                             < / b u t t o n >  
                             < b u t t o n    
                                 o n C l i c k = { ( )   = >   s e t B u l k A c t i o n ( ' s t a t u s ' ) }  
                                 c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   h o v e r : t e x t - p u r p l e - 3 0 0   t r a n s i t i o n   t e x t - s m   f o n t - m e d i u m "  
                             >  
                                 < C h e c k C i r c l e   s i z e = { 1 6 }   / >   S t a t u s  
                             < / b u t t o n >  
                             < b u t t o n    
                                 o n C l i c k = { e x e c u t e B u l k D e l e t e }  
                                 c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   t e x t - r e d - 4 0 0   h o v e r : t e x t - r e d - 3 0 0   t r a n s i t i o n   t e x t - s m   f o n t - m e d i u m   m l - 2 "  
                             >  
                                 < T r a s h 2   s i z e = { 1 6 }   / >   D e l e t e  
                             < / b u t t o n >  
                       < / d i v >  
  
                       < b u t t o n   o n C l i c k = { ( )   = >   s e t S e l e c t e d I d s ( [ ] ) }   c l a s s N a m e = " b g - g r a y - 7 0 0   r o u n d e d - f u l l   p - 1   h o v e r : b g - g r a y - 6 0 0   m l - 2 " >  
                           < X   s i z e = { 1 4 }   / >  
                       < / b u t t o n >  
                 < / d i v >  
             ) }  
  
             { / *   P r o d u c t   L i s t   * / }  
             { ! f i l t e r e d P r o d u c t s   | |   f i l t e r e d P r o d u c t s . l e n g t h   = = =   0   ?   (  
                 < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   i t e m s - c e n t e r   j u s t i f y - c e n t e r   p y - 1 6   b g - w h i t e   r o u n d e d - 2 x l   b o r d e r - 2   b o r d e r - d a s h e d   b o r d e r - g r a y - 3 0 0 " >  
                     < d i v   c l a s s N a m e = " w - 2 4   h - 2 4   b g - g r a d i e n t - t o - b r   f r o m - g r a y - 1 0 0   t o - g r a y - 2 0 0   r o u n d e d - f u l l   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   m b - 4 " >  
                         < F o l d e r O p e n   s i z e = { 4 8 }   c l a s s N a m e = " t e x t - g r a y - 4 0 0 "   / >  
                     < / d i v >  
                     < h 3   c l a s s N a m e = " t e x t - x l   f o n t - b o l d   t e x t - g r a y - 8 0 0   m b - 2 " >  
                         { p r o d u c t s ? . l e n g t h   = = =   0   ?   ' N o   P r o d u c t s   Y e t '   :   ' N o   P r o d u c t s   F o u n d ' }  
                     < / h 3 >  
                     < p   c l a s s N a m e = " t e x t - g r a y - 5 0 0   m b - 6   t e x t - c e n t e r   m a x - w - m d " >  
                         { p r o d u c t s ? . l e n g t h   = = =   0    
                             ?   ' G e t   s t a r t e d   b y   a d d i n g   y o u r   f i r s t   p r o d u c t   t o   y o u r   i n v e n t o r y '  
                             :   ' T r y   a d j u s t i n g   y o u r   s e a r c h   o r   f i l t e r s   t o   f i n d   w h a t   y o u \ ' r e   l o o k i n g   f o r '  
                         }  
                     < / p >  
                     { p r o d u c t s ? . l e n g t h   = = =   0   ?   (  
                         < b u t t o n    
                             o n C l i c k = { ( )   = >   h a n d l e O p e n M o d a l ( ) }  
                             c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   p x - 6   p y - 3   b g - g r a d i e n t - t o - r   f r o m - t e a l - 5 0 0   t o - p u r p l e - 6 0 0   t e x t - w h i t e   r o u n d e d - x l   f o n t - s e m i b o l d   s h a d o w - l g   h o v e r : s h a d o w - x l   t r a n s i t i o n - a l l   t r a n s f o r m   h o v e r : s c a l e - [ 1 . 0 2 ] "  
                         >  
                             < P l u s   s i z e = { 2 0 }   / >   A d d   Y o u r   F i r s t   P r o d u c t  
                         < / b u t t o n >  
                     )   :   (  
                         < b u t t o n    
                             o n C l i c k = { r e s e t F i l t e r s }  
                             c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   p x - 6   p y - 3   b g - g r a d i e n t - t o - r   f r o m - p u r p l e - 5 0 0   t o - p i n k - 6 0 0   t e x t - w h i t e   r o u n d e d - x l   f o n t - s e m i b o l d   s h a d o w - l g   h o v e r : s h a d o w - x l   t r a n s i t i o n - a l l   t r a n s f o r m   h o v e r : s c a l e - [ 1 . 0 2 ] "  
                         >  
                             < R e f r e s h C w   s i z e = { 2 0 }   / >   C l e a r   A l l   F i l t e r s  
                         < / b u t t o n >  
                     ) }  
                 < / d i v >  
             )   :   v i e w M o d e   = = =   ' d e t a i l s '   ?   (  
                 / *   T a b l e   V i e w   f o r   D e t a i l s   M o d e   * /  
                 < d i v   c l a s s N a m e = " b g - w h i t e   r o u n d e d - x l   b o r d e r   b o r d e r - g r a y - 2 0 0   s h a d o w - s m   m b - 2 0 " >  
                     < d i v   c l a s s N a m e = " o v e r f l o w - x - a u t o   o v e r f l o w - y - v i s i b l e " >  
                         < t a b l e   c l a s s N a m e = " w - f u l l " >  
                             < t h e a d   c l a s s N a m e = " b g - g r a y - 5 0   b o r d e r - b   b o r d e r - g r a y - 2 0 0 " >  
                                 < t r >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 1 2 " >  
                                         < i n p u t  
                                             t y p e = " c h e c k b o x "  
                                             c h e c k e d = { s e l e c t e d I d s . l e n g t h   = = =   f i l t e r e d P r o d u c t s . l e n g t h   & &   f i l t e r e d P r o d u c t s . l e n g t h   >   0 }  
                                             o n C h a n g e = { ( )   = >   {  
                                                 i f   ( s e l e c t e d I d s . l e n g t h   = = =   f i l t e r e d P r o d u c t s . l e n g t h )   {  
                                                     s e t S e l e c t e d I d s ( [ ] ) ;  
                                                 }   e l s e   {  
                                                     s e t S e l e c t e d I d s ( f i l t e r e d P r o d u c t s . m a p ( p   = >   p . i d ) ) ;  
                                                 }  
                                             } }  
                                             c l a s s N a m e = " w - 4   h - 4   t e x t - p u r p l e - 6 0 0   r o u n d e d   b o r d e r - g r a y - 3 0 0   f o c u s : r i n g - p u r p l e - 5 0 0   c u r s o r - p o i n t e r "  
                                         / >  
                                     < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 1 2 " > S L < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 2 0 " > I m a g e < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r " > N a m e < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r " > C a t e g o r y < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r " > S u b   C a t e g o r y < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 2 0 " > P r i o r i t y < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r " > T a g s < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 2 4 " > S t a t u s < / t h >  
                                     < t h   c l a s s N a m e = " p x - 4   p y - 3   t e x t - l e f t   t e x t - x s   f o n t - s e m i b o l d   t e x t - g r a y - 6 0 0   u p p e r c a s e   t r a c k i n g - w i d e r   w - 2 0 " > A c t i o n s < / t h >  
                                 < / t r >  
                             < / t h e a d >  
                             < t b o d y   c l a s s N a m e = " d i v i d e - y   d i v i d e - g r a y - 1 0 0 " >  
                                 { f i l t e r e d P r o d u c t s ? . l e n g t h   >   0   & &   f i l t e r e d P r o d u c t s . m a p ( ( p r o d u c t ,   i n d e x )   = >   {  
                                     i f   ( ! p r o d u c t   | |   ! p r o d u c t . i d )   r e t u r n   n u l l ;   / /   S a f e t y   c h e c k  
                                     c o n s t   i s S e l e c t e d   =   s e l e c t e d I d s . i n c l u d e s ( p r o d u c t . i d ) ;  
                                     c o n s t   i s D r a f t P r o d u c t   =   ( p r o d u c t   a s   a n y ) . _ i s D r a f t ;  
                                     c o n s t   d r a f t I d   =   ( p r o d u c t   a s   a n y ) . _ d r a f t I d ;  
                                     c o n s t   p r o d u c t K e y   =   i s D r a f t P r o d u c t   ?   d r a f t I d   :   p r o d u c t . i d ;  
                                     c o n s t   s t a t u s C l a s s   =   ( p r o d u c t . s t a t u s   | |   ' A c t i v e ' )   = = =   ' A c t i v e '    
                                         ?   ' b g - g r e e n - 1 0 0   t e x t - g r e e n - 7 0 0 '    
                                         :   i s D r a f t P r o d u c t    
                                         ?   ' b g - y e l l o w - 1 0 0   t e x t - y e l l o w - 7 0 0 '  
                                         :   ' b g - g r a y - 1 0 0   t e x t - g r a y - 6 0 0 ' ;  
  
                                     r e t u r n   (  
                                         < t r    
                                             k e y = { p r o d u c t K e y }  
                                             c l a s s N a m e = { ` h o v e r : b g - g r a y - 5 0   t r a n s i t i o n   $ { i s S e l e c t e d   ?   ' b g - p u r p l e - 5 0 '   :   ' ' }   $ { i s D r a f t P r o d u c t   ?   ' b o r d e r - l - 4   b o r d e r - l - y e l l o w - 5 0 0 '   :   ' ' } ` }  
                                         >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < i n p u t  
                                                     t y p e = " c h e c k b o x "  
                                                     c h e c k e d = { i s S e l e c t e d }  
                                                     o n C h a n g e = { ( )   = >   t o g g l e S e l e c t i o n ( p r o d u c t . i d ) }  
                                                     c l a s s N a m e = " w - 4   h - 4   t e x t - p u r p l e - 6 0 0   r o u n d e d   b o r d e r - g r a y - 3 0 0   f o c u s : r i n g - p u r p l e - 5 0 0   c u r s o r - p o i n t e r "  
                                                 / >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3   t e x t - s m   t e x t - g r a y - 6 0 0 " > { i n d e x   +   1 } < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < d i v   c l a s s N a m e = " r e l a t i v e   w - 1 2   h - 1 2   r o u n d e d - l g   b g - g r a y - 1 0 0   o v e r f l o w - h i d d e n " >  
                                                     < i m g    
                                                         s r c = { n o r m a l i z e I m a g e U r l ( p r o d u c t . i m a g e   | |   p r o d u c t . g a l l e r y I m a g e s ? . [ 0 ] ) }    
                                                         a l t = { p r o d u c t . n a m e }    
                                                         c l a s s N a m e = " w - f u l l   h - f u l l   o b j e c t - c o v e r "  
                                                     / >  
                                                     { i s D r a f t P r o d u c t   & &   (  
                                                         < s p a n   c l a s s N a m e = " a b s o l u t e   t o p - 0   l e f t - 0   b g - y e l l o w - 5 0 0   t e x t - w h i t e   t e x t - [ 8 p x ]   p x - 1   r o u n d e d - b r " >  
                                                             D R A F T  
                                                         < / s p a n >  
                                                     ) }  
                                                 < / d i v >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < d i v   c l a s s N a m e = " m a x - w - [ 2 0 0 p x ] " >  
                                                     < p   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 9 0 0   t r u n c a t e "   t i t l e = { p r o d u c t . n a m e } > { p r o d u c t . n a m e } < / p >  
                                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > I D :   { p r o d u c t . i d } < / p >  
                                                 < / d i v >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < s p a n   c l a s s N a m e = " t e x t - x s   f o n t - m e d i u m   t e x t - p u r p l e - 6 0 0   b g - p u r p l e - 5 0   p x - 2   p y - 1   r o u n d e d - f u l l " >  
                                                     { p r o d u c t . c a t e g o r y   | |   ' “Ç ö ' }  
                                                 < / s p a n >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 6 0 0 " >  
                                                     { p r o d u c t . s u b C a t e g o r y   | |   ' “Ç ö ' }  
                                                 < / s p a n >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3   t e x t - c e n t e r " >  
                                                 < s p a n   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 6 0 0 " > { ( p r o d u c t   a s   a n y ) . p r i o r i t y   | |   ' “Ç ö ' } < / s p a n >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < d i v   c l a s s N a m e = " f l e x   f l e x - w r a p   g a p - 1   m a x - w - [ 1 5 0 p x ] " >  
                                                     { p r o d u c t . t a g s ? . s l i c e ( 0 ,   2 ) . m a p ( ( t a g ,   i )   = >   (  
                                                         < s p a n   k e y = { i }   c l a s s N a m e = " t e x t - [ 1 0 p x ]   b g - g r a y - 1 0 0   t e x t - g r a y - 6 0 0   p x - 1 . 5   p y - 0 . 5   r o u n d e d " >  
                                                             { t a g }  
                                                         < / s p a n >  
                                                     ) ) }  
                                                     { p r o d u c t . t a g s   & &   p r o d u c t . t a g s . l e n g t h   >   2   & &   (  
                                                         < s p a n   c l a s s N a m e = " t e x t - [ 1 0 p x ]   t e x t - g r a y - 4 0 0 " > + { p r o d u c t . t a g s . l e n g t h   -   2 } < / s p a n >  
                                                     ) }  
                                                     { ( ! p r o d u c t . t a g s   | |   p r o d u c t . t a g s . l e n g t h   = = =   0 )   & &   < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 4 0 0 " > “Ç ö < / s p a n > }  
                                                 < / d i v >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < s p a n   c l a s s N a m e = { ` p x - 2   p y - 1   r o u n d e d   t e x t - [ 1 0 p x ]   f o n t - b o l d   u p p e r c a s e   $ { s t a t u s C l a s s } ` } >  
                                                     { i s D r a f t P r o d u c t   ?   ' D r a f t '   :   p r o d u c t . s t a t u s   | |   ' A c t i v e ' }  
                                                 < / s p a n >  
                                             < / t d >  
                                             < t d   c l a s s N a m e = " p x - 4   p y - 3 " >  
                                                 < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                                     < b u t t o n  
                                                         t y p e = " b u t t o n "  
                                                         o n C l i c k = { ( e )   = >   {  
                                                             e . s t o p P r o p a g a t i o n ( ) ;  
                                                             h a n d l e O p e n M o d a l ( p r o d u c t   a s   a n y ) ;  
                                                         } }  
                                                         c l a s s N a m e = " p x - 3   p y - 1 . 5   t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0   b g - g r a y - 1 0 0   h o v e r : b g - g r a y - 2 0 0   r o u n d e d - l g   t r a n s i t i o n "  
                                                     >  
                                                         E d i t  
                                                     < / b u t t o n >  
                                                     < b u t t o n  
                                                         t y p e = " b u t t o n "  
                                                         o n C l i c k = { ( e )   = >   {  
                                                             e . s t o p P r o p a g a t i o n ( ) ;  
                                                             h a n d l e D e l e t e ( p r o d u c t . i d ,   i s D r a f t P r o d u c t ,   d r a f t I d ) ;  
                                                         } }  
                                                         c l a s s N a m e = " p x - 3   p y - 1 . 5   t e x t - s m   f o n t - m e d i u m   t e x t - r e d - 6 0 0   b g - r e d - 5 0   h o v e r : b g - r e d - 1 0 0   b o r d e r   b o r d e r - r e d - 2 0 0   r o u n d e d - l g   t r a n s i t i o n "  
                                                     >  
                                                         D e l e t e  
                                                     < / b u t t o n >  
                                                 < / d i v >  
                                             < / t d >  
                                         < / t r >  
                                     ) ;  
                                 } ) }  
                             < / t b o d y >  
                         < / t a b l e >  
                     < / d i v >  
                     { f i l t e r e d P r o d u c t s . l e n g t h   = = =   0   & &   (  
                         < d i v   c l a s s N a m e = " p y - 1 2   t e x t - c e n t e r   t e x t - g r a y - 5 0 0   f l e x   f l e x - c o l   i t e m s - c e n t e r   j u s t i f y - c e n t e r " >  
                             < S e a r c h   s i z e = { 4 8 }   c l a s s N a m e = " t e x t - g r a y - 3 0 0   m b - 4 "   / >  
                             < p   c l a s s N a m e = " f o n t - m e d i u m   t e x t - l g " > N o   p r o d u c t s   f o u n d < / p >  
                             < p   c l a s s N a m e = " t e x t - s m   m b - 4 " > T r y   a d j u s t i n g   y o u r   s e a r c h   o r   f i l t e r s < / p >  
                             < b u t t o n   o n C l i c k = { r e s e t F i l t e r s }   c l a s s N a m e = " t e x t - p u r p l e - 6 0 0   f o n t - b o l d   h o v e r : u n d e r l i n e " > C l e a r   F i l t e r s < / b u t t o n >  
                         < / d i v >  
                     ) }  
                 < / d i v >  
             )   :   (  
                 / *   G r i d / L i s t   V i e w   * /  
                 < d i v   c l a s s N a m e = { ` g r i d   $ { g r i d T e m p l a t e C l a s s }   p b - 2 0 ` } >  
                   { f i l t e r e d P r o d u c t s ? . l e n g t h   >   0   & &   f i l t e r e d P r o d u c t s . m a p ( p r o d u c t   = >   {  
                       i f   ( ! p r o d u c t   | |   ! p r o d u c t . i d )   r e t u r n   n u l l ;   / /   S a f e t y   c h e c k  
                       c o n s t   f o r m a t t e d P r i c e   =   f o r m a t C u r r e n c y ( p r o d u c t . p r i c e   | |   0 ) ;  
                       c o n s t   f o r m a t t e d O r i g i n a l P r i c e   =   f o r m a t C u r r e n c y ( p r o d u c t . o r i g i n a l P r i c e   | |   0 ,   n u l l ) ;  
                       c o n s t   i s S e l e c t e d   =   s e l e c t e d I d s . i n c l u d e s ( p r o d u c t . i d ) ;  
                       c o n s t   i s D r a f t P r o d u c t   =   ( p r o d u c t   a s   a n y ) . _ i s D r a f t ;  
                       c o n s t   d r a f t I d   =   ( p r o d u c t   a s   a n y ) . _ d r a f t I d ;  
                       c o n s t   s t a t u s C l a s s   =   ( p r o d u c t . s t a t u s   | |   ' A c t i v e ' )   = = =   ' A c t i v e '    
                           ?   ' b g - g r e e n - 1 0 0   t e x t - g r e e n - 7 0 0 '    
                           :   i s D r a f t P r o d u c t    
                           ?   ' b g - y e l l o w - 1 0 0   t e x t - y e l l o w - 7 0 0 '  
                           :   ' b g - g r a y - 1 0 0   t e x t - g r a y - 6 0 0 ' ;  
  
                       i f   ( i s L i s t L i k e V i e w )   {  
                           r e t u r n   (  
                               < d i v    
                                   k e y = { i s D r a f t P r o d u c t   ?   d r a f t I d   :   p r o d u c t . i d }  
                                   c l a s s N a m e = { ` b g - w h i t e   r o u n d e d - 2 x l   b o r d e r   s h a d o w - s m   t r a n s i t i o n   $ {  
                                       i s S e l e c t e d   ?   ' b o r d e r - p u r p l e - 5 0 0   r i n g - 1   r i n g - p u r p l e - 5 0 0 '   :   ' b o r d e r - g r a y - 2 0 0 '  
                                   }   $ { i s D r a f t P r o d u c t   ?   ' b o r d e r - l - 4   b o r d e r - l - y e l l o w - 5 0 0 '   :   ' ' } ` }  
                               >  
                                   < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   g a p - 4   p - 4   m d : f l e x - r o w   m d : i t e m s - c e n t e r   m d : j u s t i f y - b e t w e e n " >  
                                       < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 3   f l e x - 1   m i n - w - 0 " >  
                                           < i n p u t    
                                               t y p e = " c h e c k b o x "    
                                               c h e c k e d = { i s S e l e c t e d }  
                                               o n C h a n g e = { ( )   = >   t o g g l e S e l e c t i o n ( p r o d u c t . i d ) }  
                                               c l a s s N a m e = " w - 5   h - 5   t e x t - p u r p l e - 6 0 0   r o u n d e d   b o r d e r - g r a y - 3 0 0   f o c u s : r i n g - p u r p l e - 5 0 0   c u r s o r - p o i n t e r   f l e x - s h r i n k - 0 "  
                                           / >  
                                           < d i v   c l a s s N a m e = " r e l a t i v e   w - 2 0   h - 2 0   r o u n d e d - x l   b g - g r a y - 1 0 0   o v e r f l o w - h i d d e n   f l e x - s h r i n k - 0 " >  
                                                 < i m g   s r c = { n o r m a l i z e I m a g e U r l ( p r o d u c t . g a l l e r y I m a g e s ? . [ 0 ]   | |   p r o d u c t . i m a g e ) }   a l t = { p r o d u c t . n a m e }   c l a s s N a m e = " w - f u l l   h - f u l l   o b j e c t - c o v e r "   / >  
                                                 { p r o d u c t . d i s c o u n t   & &   (  
                                                     < s p a n   c l a s s N a m e = " a b s o l u t e   b o t t o m - 1   r i g h t - 1   b g - p u r p l e - 6 0 0   t e x t - w h i t e   t e x t - [ 1 0 p x ]   f o n t - b o l d   p x - 1 . 5   p y - 0 . 5   r o u n d e d   s h a d o w - s m " >  
                                                         { p r o d u c t . d i s c o u n t }  
                                                     < / s p a n >  
                                                 ) }  
                                                 { i s D r a f t P r o d u c t   & &   (  
                                                     < s p a n   c l a s s N a m e = " a b s o l u t e   t o p - 1   l e f t - 1   b g - y e l l o w - 5 0 0   t e x t - w h i t e   t e x t - [ 1 0 p x ]   f o n t - b o l d   p x - 1 . 5   p y - 0 . 5   r o u n d e d   s h a d o w - s m   f l e x   i t e m s - c e n t e r   g a p - 1 " >  
                                                         < F i l e E d i t   s i z e = { 1 0 }   / >   D R A F T  
                                                     < / s p a n >  
                                                 ) }  
                                           < / d i v >  
                                           < d i v   c l a s s N a m e = " f l e x - 1   m i n - w - 0   s p a c e - y - 1   c u r s o r - p o i n t e r "   o n C l i c k = { ( )   = >   t o g g l e S e l e c t i o n ( p r o d u c t . i d ) } >  
                                                 < d i v   c l a s s N a m e = " f l e x   f l e x - w r a p   g a p - 1 " >  
                                                     < s p a n   c l a s s N a m e = " t e x t - [ 1 1 p x ]   f o n t - m e d i u m   t e x t - p u r p l e - 6 0 0   b g - p u r p l e - 5 0   p x - 2   p y - 0 . 5   r o u n d e d - f u l l " >  
                                                         { p r o d u c t . c a t e g o r y   | |   ' U n c a t e g o r i z e d ' }  
                                                     < / s p a n >  
                                                     { p r o d u c t . b r a n d   & &   (  
                                                         < s p a n   c l a s s N a m e = " t e x t - [ 1 1 p x ]   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   b g - g r a y - 1 0 0   p x - 2   p y - 0 . 5   r o u n d e d - f u l l " >  
                                                             { p r o d u c t . b r a n d }  
                                                         < / s p a n >  
                                                     ) }  
                                                 < / d i v >  
                                                 < h 3   c l a s s N a m e = " f o n t - s e m i b o l d   t e x t - g r a y - 9 0 0   t r u n c a t e "   t i t l e = { p r o d u c t . n a m e } > { p r o d u c t . n a m e } < / h 3 >  
                                                 { v i e w M o d e   = = =   ' d e t a i l s '   ?   (  
                                                     < d i v   c l a s s N a m e = " g r i d   g r i d - c o l s - 2   g a p - 2   t e x t - [ 1 1 p x ]   t e x t - g r a y - 5 0 0 " >  
                                                         < p   c l a s s N a m e = " t r u n c a t e " > B r a n d :   { p r o d u c t . b r a n d   | |   ' “Ç ö ' } < / p >  
                                                         < p   c l a s s N a m e = " t r u n c a t e " > S t o c k :   { p r o d u c t . s t o c k   ? ?   ' “Ç ö ' } < / p >  
                                                         < p   c l a s s N a m e = " t r u n c a t e " > C a t e g o r y :   { p r o d u c t . c a t e g o r y   | |   ' “Ç ö ' } < / p >  
                                                         < p   c l a s s N a m e = " t r u n c a t e " > I D :   { p r o d u c t . i d } < / p >  
                                                     < / d i v >  
                                                 )   :   (  
                                                     < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0   l i n e - c l a m p - 1 " > { p r o d u c t . d e s c r i p t i o n   | |   ' A d d   a   s h o r t   d e s c r i p t i o n   t o   h i g h l i g h t   t h i s   p r o d u c t . ' } < / p >  
                                                 ) }  
                                           < / d i v >  
                                       < / d i v >  
                                       < d i v   c l a s s N a m e = " f l e x   f l e x - c o l   g a p - 3   w - f u l l   m d : w - a u t o   b o r d e r - t   p t - 3   m d : b o r d e r - t - 0   m d : p t - 0   m d : f l e x - r o w   m d : i t e m s - c e n t e r   m d : g a p - 5   m d : j u s t i f y - e n d " >  
                                           < d i v   c l a s s N a m e = " t e x t - r i g h t   m i n - w - [ 1 2 0 p x ] " >  
                                                 < s p a n   c l a s s N a m e = " f o n t - b o l d   t e x t - g r a y - 9 0 0   b l o c k " > ±º %  { f o r m a t t e d P r i c e } < / s p a n >  
                                                 { f o r m a t t e d O r i g i n a l P r i c e   & &   (  
                                                     < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 4 0 0   l i n e - t h r o u g h " > ±º %  { f o r m a t t e d O r i g i n a l P r i c e } < / s p a n >  
                                                 ) }  
                                                 < s p a n   c l a s s N a m e = { ` i n l i n e - f l e x   m t - 2   p x - 2   p y - 1   r o u n d e d   t e x t - [ 1 0 p x ]   f o n t - b o l d   u p p e r c a s e   s h a d o w - s m   $ { s t a t u s C l a s s } ` } >  
                                                     { i s D r a f t P r o d u c t   ?   ' D r a f t '   :   p r o d u c t . s t a t u s   | |   ' A c t i v e ' }  
                                                 < / s p a n >  
                                           < / d i v >  
                                           < d i v   c l a s s N a m e = " f l e x   f l e x - w r a p   g a p - 2   j u s t i f y - e n d " >  
                                                 < b u t t o n    
                                                     t y p e = " b u t t o n "  
                                                     o n C l i c k = { ( e )   = >   {  
                                                         e . s t o p P r o p a g a t i o n ( ) ;  
                                                         h a n d l e O p e n M o d a l ( p r o d u c t   a s   a n y ) ;  
                                                     } }  
                                                     c l a s s N a m e = " p x - 3   p y - 1 . 5   b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   t e x t - s m   t e x t - g r a y - 6 0 0   h o v e r : b o r d e r - g r a y - 4 0 0   h o v e r : t e x t - g r a y - 9 0 0 "  
                                                 >  
                                                     E d i t  
                                                 < / b u t t o n >  
                                                 < b u t t o n    
                                                     t y p e = " b u t t o n "  
                                                     o n C l i c k = { ( e )   = >   {  
                                                         e . s t o p P r o p a g a t i o n ( ) ;  
                                                         h a n d l e D e l e t e ( p r o d u c t . i d ,   i s D r a f t P r o d u c t ,   d r a f t I d ) ;  
                                                     } }  
                                                     c l a s s N a m e = " p x - 3   p y - 1 . 5   b o r d e r   b o r d e r - r e d - 2 0 0   t e x t - s m   t e x t - r e d - 6 0 0   r o u n d e d - l g   h o v e r : b g - r e d - 5 0 "  
                                                 >  
                                                     D e l e t e  
                                                 < / b u t t o n >  
                                           < / d i v >  
                                       < / d i v >  
                                   < / d i v >  
                               < / d i v >  
                           ) ;  
                       }  
  
                       r e t u r n   (  
                           < d i v    
                               k e y = { i s D r a f t P r o d u c t   ?   d r a f t I d   :   p r o d u c t . i d }    
                               c l a s s N a m e = { ` b g - w h i t e   r o u n d e d - x l   b o r d e r   s h a d o w - s m   o v e r f l o w - h i d d e n   h o v e r : s h a d o w - m d   t r a n s i t i o n   g r o u p   r e l a t i v e   $ {  
                                   i s S e l e c t e d   ?   ' b o r d e r - p u r p l e - 5 0 0   r i n g - 1   r i n g - p u r p l e - 5 0 0 '   :   ' b o r d e r - g r a y - 2 0 0 '  
                               }   $ { i s D r a f t P r o d u c t   ?   ' b o r d e r - t - 4   b o r d e r - t - y e l l o w - 5 0 0 '   :   ' ' } ` }  
                           >  
                             < d i v   c l a s s N a m e = " a b s o l u t e   t o p - 3   l e f t - 3   z - 1 0   f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                 < i n p u t    
                                     t y p e = " c h e c k b o x "    
                                     c h e c k e d = { i s S e l e c t e d }  
                                     o n C h a n g e = { ( )   = >   t o g g l e S e l e c t i o n ( p r o d u c t . i d ) }  
                                     c l a s s N a m e = " w - 5   h - 5   t e x t - p u r p l e - 6 0 0   r o u n d e d   b o r d e r - g r a y - 3 0 0   f o c u s : r i n g - p u r p l e - 5 0 0   s h a d o w - s m   c u r s o r - p o i n t e r "  
                                 / >  
                             < / d i v >  
                              
                             < d i v   c l a s s N a m e = " a b s o l u t e   t o p - 3   r i g h t - 3   z - 1 0   f l e x   g a p - 2 " >  
                                   { i s D r a f t P r o d u c t   & &   (  
                                       < s p a n   c l a s s N a m e = " p x - 2   p y - 1   r o u n d e d   t e x t - [ 1 0 p x ]   f o n t - b o l d   u p p e r c a s e   s h a d o w - s m   b g - y e l l o w - 5 0 0   t e x t - w h i t e   f l e x   i t e m s - c e n t e r   g a p - 1 " >  
                                           < F i l e E d i t   s i z e = { 1 0 }   / >   D R A F T  
                                       < / s p a n >  
                                   ) }  
                                   < s p a n   c l a s s N a m e = { ` p x - 2   p y - 1   r o u n d e d   t e x t - [ 1 0 p x ]   f o n t - b o l d   u p p e r c a s e   s h a d o w - s m   $ { s t a t u s C l a s s } ` } >  
                                         { i s D r a f t P r o d u c t   ?   ' D r a f t '   :   p r o d u c t . s t a t u s   | |   ' A c t i v e ' }  
                                   < / s p a n >  
                             < / d i v >  
  
                             < d i v   c l a s s N a m e = { ` r e l a t i v e   $ { i m a g e H e i g h t C l a s s }   b g - g r a y - 1 0 0 ` } >  
                                   < i m g   s r c = { n o r m a l i z e I m a g e U r l ( p r o d u c t . g a l l e r y I m a g e s ? . [ 0 ]   | |   p r o d u c t . i m a g e ) }   a l t = { p r o d u c t . n a m e }   c l a s s N a m e = " w - f u l l   h - f u l l   o b j e c t - c o v e r "   / >  
                                   { p r o d u c t . d i s c o u n t   & &   (  
                                       < s p a n   c l a s s N a m e = " a b s o l u t e   b o t t o m - 2   r i g h t - 2   b g - p u r p l e - 6 0 0   t e x t - w h i t e   t e x t - x s   f o n t - b o l d   p x - 2   p y - 1   r o u n d e d   s h a d o w - s m " >  
                                           { p r o d u c t . d i s c o u n t }  
                                       < / s p a n >  
                                   ) }  
                                   < d i v   c l a s s N a m e = " a b s o l u t e   i n s e t - 0   b g - b l a c k / 4 0   o p a c i t y - 0   g r o u p - h o v e r : o p a c i t y - 1 0 0   t r a n s i t i o n   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   g a p - 3   b a c k d r o p - b l u r - [ 1 p x ] " >  
                                         < b u t t o n    
                                             o n C l i c k = { ( )   = >   h a n d l e O p e n M o d a l ( p r o d u c t   a s   a n y ) }  
                                             c l a s s N a m e = " b g - w h i t e   t e x t - g r a y - 8 0 0   p - 2   r o u n d e d - f u l l   h o v e r : b g - p u r p l e - 5 0   h o v e r : t e x t - p u r p l e - 6 0 0   t r a n s i t i o n   s h a d o w - l g "  
                                             t i t l e = " E d i t "  
                                         >  
                                             < E d i t   s i z e = { 1 8 }   / >  
                                         < / b u t t o n >  
                                         < b u t t o n    
                                             o n C l i c k = { ( )   = >   ! i s D r a f t P r o d u c t   & &   h a n d l e C l o n e P r o d u c t ( p r o d u c t ) }  
                                             c l a s s N a m e = { ` b g - w h i t e   t e x t - g r a y - 8 0 0   p - 2   r o u n d e d - f u l l   t r a n s i t i o n   s h a d o w - l g   $ { i s D r a f t P r o d u c t   ?   ' o p a c i t y - 5 0   c u r s o r - n o t - a l l o w e d '   :   ' h o v e r : b g - g r e e n - 5 0   h o v e r : t e x t - g r e e n - 6 0 0 ' } ` }  
                                             t i t l e = { i s D r a f t P r o d u c t   ?   " C a n ' t   c l o n e   d r a f t s "   :   " C l o n e   P r o d u c t " }  
                                             d i s a b l e d = { i s D r a f t P r o d u c t }  
                                         >  
                                             < C o p y   s i z e = { 1 8 }   / >  
                                         < / b u t t o n >  
                                         < b u t t o n    
                                             o n C l i c k = { ( )   = >   h a n d l e D e l e t e ( p r o d u c t . i d ,   i s D r a f t P r o d u c t ,   d r a f t I d ) }  
                                             c l a s s N a m e = " b g - w h i t e   t e x t - g r a y - 8 0 0   p - 2   r o u n d e d - f u l l   h o v e r : b g - r e d - 5 0   h o v e r : t e x t - r e d - 6 0 0   t r a n s i t i o n   s h a d o w - l g "  
                                             t i t l e = " D e l e t e "  
                                         >  
                                             < T r a s h 2   s i z e = { 1 8 }   / >  
                                         < / b u t t o n >  
                                   < / d i v >  
                             < / d i v >  
                             < d i v   c l a s s N a m e = { ` $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' p - 3 '   :   v i e w M o d e   = = =   ' e x t r a L a r g e I c o n s '   ?   ' p - 5 '   :   ' p - 4 ' }   c u r s o r - p o i n t e r ` }   o n C l i c k = { ( )   = >   t o g g l e S e l e c t i o n ( p r o d u c t . i d ) } >  
                                   < d i v   c l a s s N a m e = " m b - 2   f l e x   f l e x - w r a p   g a p - 1 " >  
                                         < s p a n   c l a s s N a m e = { ` $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' t e x t - [ 1 0 p x ] '   :   ' t e x t - x s ' }   f o n t - m e d i u m   t e x t - p u r p l e - 6 0 0   b g - p u r p l e - 5 0   p x - 2   p y - 0 . 5   r o u n d e d - f u l l ` } >  
                                             { p r o d u c t . c a t e g o r y   | |   ' U n c a t e g o r i z e d ' }  
                                         < / s p a n >  
                                         { p r o d u c t . b r a n d   & &   (  
                                             < s p a n   c l a s s N a m e = { ` $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' t e x t - [ 1 0 p x ] '   :   ' t e x t - x s ' }   f o n t - m e d i u m   t e x t - g r a y - 6 0 0   b g - g r a y - 1 0 0   p x - 2   p y - 0 . 5   r o u n d e d - f u l l ` } >  
                                                 { p r o d u c t . b r a n d }  
                                             < / s p a n >  
                                         ) }  
                                   < / d i v >  
                                   < h 3   c l a s s N a m e = { ` f o n t - b o l d   t e x t - g r a y - 8 0 0   l i n e - c l a m p - 1   m b - 1   $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' t e x t - s m '   :   ' t e x t - b a s e ' } ` }   t i t l e = { p r o d u c t . n a m e } > { p r o d u c t . n a m e } < / h 3 >  
                                   { v i e w M o d e   = = =   ' e x t r a L a r g e I c o n s '   & &   (  
                                       < p   c l a s s N a m e = " t e x t - s m   t e x t - g r a y - 5 0 0   l i n e - c l a m p - 2   m b - 2 " >  
                                           { p r o d u c t . d e s c r i p t i o n   | |   ' A d d   a   m a r k e t i n g   b l u r b   t o   m a k e   t h i s   p r o d u c t   p o p . ' }  
                                       < / p >  
                                   ) }  
                                   < d i v   c l a s s N a m e = { ` f l e x   g a p - 1   m b - 2   $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' s c a l e - 9 0   o r i g i n - l e f t '   :   ' ' } ` } >  
                                         { p r o d u c t . c o l o r s ? . s l i c e ( 0 ,   3 ) . m a p ( ( c ,   i )   = >   (  
                                                 < s p a n   k e y = { i }   c l a s s N a m e = " w - 2 . 5   h - 2 . 5   r o u n d e d - f u l l   b o r d e r   b o r d e r - g r a y - 3 0 0 "   s t y l e = { { b a c k g r o u n d C o l o r :   c } }   t i t l e = { c } > < / s p a n >  
                                         ) ) }  
                                         { p r o d u c t . c o l o r s   & &   p r o d u c t . c o l o r s . l e n g t h   >   3   & &   < s p a n   c l a s s N a m e = " t e x t - [ 1 0 p x ]   t e x t - g r a y - 4 0 0 " > + { p r o d u c t . c o l o r s . l e n g t h   -   3 } < / s p a n > }  
                                   < / d i v >  
  
                                     < d i v   c l a s s N a m e = " f l e x   j u s t i f y - b e t w e e n   i t e m s - c e n t e r   m t - 2 " >  
                                         < d i v   c l a s s N a m e = " f l e x   f l e x - c o l " >  
                                             < s p a n   c l a s s N a m e = { ` $ { v i e w M o d e   = = =   ' s m a l l I c o n s '   ?   ' t e x t - s m '   :   ' t e x t - b a s e ' }   f o n t - b o l d   t e x t - g r a y - 9 0 0 ` } > ±º %  { f o r m a t t e d P r i c e } < / s p a n >  
                                             { f o r m a t t e d O r i g i n a l P r i c e   & &   (  
                                               < s p a n   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 4 0 0   l i n e - t h r o u g h " > ±º %  { f o r m a t t e d O r i g i n a l P r i c e } < / s p a n >  
                                             ) }  
                                         < / d i v >  
                                         < d i v   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " > I D :   { p r o d u c t . i d } < / d i v >  
                                   < / d i v >  
                                 < / d i v >  
                             < / d i v >  
                             ) ;  
                         } ) }  
                   { f i l t e r e d P r o d u c t s . l e n g t h   = = =   0   & &   (  
                         < d i v   c l a s s N a m e = " c o l - s p a n - f u l l   p y - 1 2   t e x t - c e n t e r   t e x t - g r a y - 5 0 0   f l e x   f l e x - c o l   i t e m s - c e n t e r   j u s t i f y - c e n t e r " >  
                                 < S e a r c h   s i z e = { 4 8 }   c l a s s N a m e = " t e x t - g r a y - 3 0 0   m b - 4 "   / >  
                                 < p   c l a s s N a m e = " f o n t - m e d i u m   t e x t - l g " > N o   p r o d u c t s   f o u n d < / p >  
                                 < p   c l a s s N a m e = " t e x t - s m   m b - 4 " > T r y   a d j u s t i n g   y o u r   s e a r c h   o r   f i l t e r s < / p >  
                                 < b u t t o n   o n C l i c k = { r e s e t F i l t e r s }   c l a s s N a m e = " t e x t - p u r p l e - 6 0 0   f o n t - b o l d   h o v e r : u n d e r l i n e " > C l e a r   F i l t e r s < / b u t t o n >  
                         < / d i v >  
                   ) }  
                 < / d i v >  
             ) }  
  
             { / *   A d d / E d i t   M o d a l   * / }  
             { i s M o d a l O p e n   & &   (  
                 < d i v   c l a s s N a m e = " f i x e d   i n s e t - 0   z - [ 1 0 0 ]   f l e x   i t e m s - c e n t e r   j u s t i f y - c e n t e r   b g - b l a c k / 5 0   b a c k d r o p - b l u r - s m   p - 2   s m : p - 4   a n i m a t e - i n   f a d e - i n   d u r a t i o n - 2 0 0 " >  
                       < d i v   c l a s s N a m e = " b g - w h i t e   r o u n d e d - 2 x l   s h a d o w - 2 x l   w - f u l l   m a x - w - 3 x l   m a x - h - [ 9 5 v h ]   s m : m a x - h - [ 9 0 v h ]   f l e x   f l e x - c o l " >  
                             < d i v   c l a s s N a m e = " p - 4   s m : p - 6   b o r d e r - b   b o r d e r - g r a y - 1 0 0   f l e x   j u s t i f y - b e t w e e n   i t e m s - c e n t e r   b g - g r a y - 5 0   r o u n d e d - t - 2 x l " >  
                                   < d i v   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2   s m : g a p - 3 " >  
                                       < h 3   c l a s s N a m e = " t e x t - l g   s m : t e x t - x l   f o n t - b o l d   t e x t - g r a y - 8 0 0 " >  
                                           { e d i t i n g P r o d u c t   ?   ' E d i t   P r o d u c t '   :   e d i t i n g D r a f t   ?   ' E d i t   D r a f t '   :   ' A d d   N e w   P r o d u c t ' }  
                                       < / h 3 >  
                                       { h a s U n s a v e d C h a n g e s   & &   (  
                                           < s p a n   c l a s s N a m e = " p x - 2   p y - 1   b g - y e l l o w - 1 0 0   t e x t - y e l l o w - 7 0 0   t e x t - x s   f o n t - s e m i b o l d   r o u n d e d - f u l l   f l e x   i t e m s - c e n t e r   g a p - 1 " >  
                                               < A l e r t C i r c l e   s i z e = { 1 2 }   / >  
                                               < s p a n   c l a s s N a m e = " h i d d e n   s m : i n l i n e " > U n s a v e d   c h a n g e s < / s p a n >  
                                           < / s p a n >  
                                       ) }  
                                   < / d i v >  
                                   < b u t t o n   o n C l i c k = { h a n d l e C l o s e M o d a l }   c l a s s N a m e = " t e x t - g r a y - 4 0 0   h o v e r : t e x t - g r a y - 6 0 0 " >  
                                       < X   s i z e = { 2 4 }   / >  
                                   < / b u t t o n >  
                             < / d i v >  
                              
                             < d i v   c l a s s N a m e = " f l e x - 1   o v e r f l o w - y - a u t o   p - 4   s m : p - 6 " >  
                                   < f o r m   i d = " p r o d u c t F o r m "   o n S u b m i t = { h a n d l e S u b m i t }   c l a s s N a m e = " s p a c e - y - 4 " >  
                                          
                                         { / *   G E N E R A L   I N F O R M A T I O N   S E C T I O N   * / }  
                                         < d i v   c l a s s N a m e = " b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   o v e r f l o w - h i d d e n " >  
                                             < b u t t o n  
                                                 t y p e = " b u t t o n "  
                                                 o n C l i c k = { ( )   = >   t o g g l e S e c t i o n ( ' g e n e r a l ' ) }  
                                                 c l a s s N a m e = " w - f u l l   p x - 3   s m : p x - 4   p y - 3   b g - g r a y - 5 0   h o v e r : b g - g r a y - 1 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   t r a n s i t i o n   f o n t - s e m i b o l d   t e x t - g r a y - 9 0 0   t e x t - s m   s m : t e x t - b a s e "  
                                             >  
                                                 < s p a n   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                                     < s p a n > a"’ô ï   G e n e r a l   I n f o r m a t i o n < / s p a n >  
                                                 < / s p a n >  
                                                 < C h e v r o n D o w n   s i z e = { 1 8 }   c l a s s N a m e = { ` t r a n s i t i o n - t r a n s f o r m   $ { e x p a n d e d S e c t i o n s . g e n e r a l   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }   / >  
                                             < / b u t t o n >  
                                              
                                             { e x p a n d e d S e c t i o n s . g e n e r a l   & &   (  
                                                 < d i v   c l a s s N a m e = " p - 3   s m : p - 4   s p a c e - y - 3   s m : s p a c e - y - 4   b g - w h i t e " >  
                                                     < d i v   c l a s s N a m e = " g r i d   g r i d - c o l s - 1   m d : g r i d - c o l s - 2   g a p - 4 " >  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > P r o d u c t   N a m e * < / l a b e l >  
                                                             < i n p u t    
                                                                 t y p e = " t e x t "    
                                                                 r e q u i r e d  
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e "  
                                                                 v a l u e = { f o r m D a t a . n a m e }  
                                                                 o n C h a n g e = { e   = >   h a n d l e N a m e C h a n g e ( e . t a r g e t . v a l u e ) }  
                                                             / >  
                                                         < / d i v >  
  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > P r o d u c t   U R L   S l u g < / l a b e l >  
                                                             < i n p u t    
                                                                 t y p e = " t e x t "    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   t e x t - s m "  
                                                                 v a l u e = { f o r m D a t a . s l u g   | |   ' ' }  
                                                                 o n C h a n g e = { e   = >   {  
                                                                     s e t I s S l u g T o u c h e d ( t r u e ) ;  
                                                                     s e t F o r m D a t a ( {   . . . f o r m D a t a ,   s l u g :   b u i l d S l u g F r o m N a m e ( e . t a r g e t . v a l u e )   } ) ;  
                                                                 } }  
                                                             / >  
                                                             < p   c l a s s N a m e = " t e x t - x s   t e x t - g r a y - 5 0 0 " >  
                                                                 L i n k :   { s h a r e O r i g i n } / p r o d u c t - d e t a i l s / { f o r m D a t a . s l u g   | |   ' p r o d u c t - n a m e ' } - { e d i t i n g P r o d u c t ? . i d   | |   ' I D ' }  
                                                             < / p >  
                                                         < / d i v >  
                                                          
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > B r a n d < / l a b e l >  
                                                             < s e l e c t    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   b g - w h i t e "  
                                                                 v a l u e = { f o r m D a t a . b r a n d }  
                                                                 o n C h a n g e = { e   = >   s e t F o r m D a t a ( { . . . f o r m D a t a ,   b r a n d :   e . t a r g e t . v a l u e } ) }  
                                                             >  
                                                                 < o p t i o n   v a l u e = " " > S e l e c t   B r a n d < / o p t i o n >  
                                                                 { b r a n d s . m a p ( b   = >   (  
                                                                     < o p t i o n   k e y = { b . n a m e }   v a l u e = { b . n a m e } > { b . n a m e } < / o p t i o n >  
                                                                 ) ) }  
                                                             < / s e l e c t >  
                                                         < / d i v >  
  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > C a t e g o r y * < / l a b e l >  
                                                             < s e l e c t    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   b g - w h i t e "  
                                                                 v a l u e = { f o r m D a t a . c a t e g o r y }  
                                                                 o n C h a n g e = { e   = >   s e t F o r m D a t a ( {  
                                                                         . . . f o r m D a t a ,    
                                                                         c a t e g o r y :   e . t a r g e t . v a l u e ,  
                                                                         s u b C a t e g o r y :   ' ' ,    
                                                                         c h i l d C a t e g o r y :   ' '    
                                                                 } ) }  
                                                             >  
                                                                 < o p t i o n   v a l u e = " " > S e l e c t   C a t e g o r y < / o p t i o n >  
                                                                 { c a t e g o r i e s . m a p ( c   = >   (  
                                                                     < o p t i o n   k e y = { c . n a m e }   v a l u e = { c . n a m e } > { c . n a m e } < / o p t i o n >  
                                                                 ) ) }  
                                                             < / s e l e c t >  
                                                         < / d i v >  
  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > S u b   C a t e g o r y < / l a b e l >  
                                                             < s e l e c t    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   b g - w h i t e "  
                                                                 v a l u e = { f o r m D a t a . s u b C a t e g o r y }  
                                                                 o n C h a n g e = { e   = >   s e t F o r m D a t a ( {  
                                                                         . . . f o r m D a t a ,    
                                                                         s u b C a t e g o r y :   e . t a r g e t . v a l u e ,  
                                                                         c h i l d C a t e g o r y :   ' '  
                                                                 } ) }  
                                                                 d i s a b l e d = { ! f o r m D a t a . c a t e g o r y }  
                                                             >  
                                                                 < o p t i o n   v a l u e = " " > S e l e c t   S u b   C a t e g o r y < / o p t i o n >  
                                                                 { a v a i l a b l e S u b C a t e g o r i e s . m a p ( s   = >   (  
                                                                     < o p t i o n   k e y = { s . n a m e }   v a l u e = { s . n a m e } > { s . n a m e } < / o p t i o n >  
                                                                 ) ) }  
                                                             < / s e l e c t >  
                                                         < / d i v >  
  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > C h i l d   C a t e g o r y < / l a b e l >  
                                                             < s e l e c t    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   b g - w h i t e "  
                                                                 v a l u e = { f o r m D a t a . c h i l d C a t e g o r y }  
                                                                 o n C h a n g e = { e   = >   s e t F o r m D a t a ( { . . . f o r m D a t a ,   c h i l d C a t e g o r y :   e . t a r g e t . v a l u e } ) }  
                                                                 d i s a b l e d = { ! f o r m D a t a . s u b C a t e g o r y }  
                                                             >  
                                                                 < o p t i o n   v a l u e = " " > S e l e c t   C h i l d   C a t e g o r y < / o p t i o n >  
                                                                 { a v a i l a b l e C h i l d C a t e g o r i e s . m a p ( c   = >   (  
                                                                     < o p t i o n   k e y = { c . n a m e }   v a l u e = { c . n a m e } > { c . n a m e } < / o p t i o n >  
                                                                 ) ) }  
                                                             < / s e l e c t >  
                                                         < / d i v >  
  
                                                         < d i v   c l a s s N a m e = " s p a c e - y - 2 " >  
                                                             < l a b e l   c l a s s N a m e = " t e x t - s m   f o n t - m e d i u m   t e x t - g r a y - 7 0 0 " > S t a t u s < / l a b e l >  
                                                             < s e l e c t    
                                                                 c l a s s N a m e = " w - f u l l   p x - 4   p y - 2   b o r d e r   b o r d e r - g r a y - 3 0 0   r o u n d e d - l g   f o c u s : r i n g - 2   f o c u s : r i n g - p u r p l e - 5 0 0   f o c u s : o u t l i n e - n o n e   b g - w h i t e "  
                                                                 v a l u e = { f o r m D a t a . s t a t u s   | |   ' A c t i v e ' }  
                                                                 o n C h a n g e = { e   = >   s e t F o r m D a t a ( { . . . f o r m D a t a ,   s t a t u s :   e . t a r g e t . v a l u e   a s   a n y } ) }  
                                                             >  
                                                                 < o p t i o n   v a l u e = " A c t i v e " > A c t i v e < / o p t i o n >  
                                                                 < o p t i o n   v a l u e = " D r a f t " > D r a f t < / o p t i o n >  
                                                             < / s e l e c t >  
                                                         < / d i v >  
                                                     < / d i v >  
                                                 < / d i v >  
                                             ) }  
                                         < / d i v >  
  
                                         { / *   D E S C R I P T I O N   S E C T I O N   * / }  
                                         < d i v   c l a s s N a m e = " b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   o v e r f l o w - h i d d e n " >  
                                             < b u t t o n  
                                                 t y p e = " b u t t o n "  
                                                 o n C l i c k = { ( )   = >   t o g g l e S e c t i o n ( ' d e s c r i p t i o n ' ) }  
                                                 c l a s s N a m e = " w - f u l l   p x - 3   s m : p x - 4   p y - 3   b g - g r a y - 5 0   h o v e r : b g - g r a y - 1 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   t r a n s i t i o n   f o n t - s e m i b o l d   t e x t - g r a y - 9 0 0   t e x t - s m   s m : t e x t - b a s e "  
                                             >  
                                                 < s p a n   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                                     < s p a n > a"’ô ¥   D e s c r i p t i o n < / s p a n >  
                                                 < / s p a n >  
                                                 < C h e v r o n D o w n   s i z e = { 1 8 }   c l a s s N a m e = { ` t r a n s i t i o n - t r a n s f o r m   $ { e x p a n d e d S e c t i o n s . d e s c r i p t i o n   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }   / >  
                                             < / b u t t o n >  
                                              
                                             { e x p a n d e d S e c t i o n s . d e s c r i p t i o n   & &   (  
                                                 < d i v   c l a s s N a m e = " p - 3   s m : p - 4   s p a c e - y - 4   b g - w h i t e " >  
                                                     < R i c h T e x t E d i t o r  
                                                         v a l u e = { f o r m D a t a . d e s c r i p t i o n   | |   ' ' }  
                                                         o n C h a n g e = { h a n d l e D e s c r i p t i o n C h a n g e }  
                                                         p l a c e h o l d e r = " E n t e r   p r o d u c t   d e s c r i p t i o n . . . "  
                                                         m i n H e i g h t = " m i n - h - [ 3 0 0 p x ] "  
                                                     / >  
                                                 < / d i v >  
                                             ) }  
                                         < / d i v >  
  
                                         { / *   P R O D U C T   I M A G E S   S E C T I O N   * / }  
                                         < d i v   c l a s s N a m e = " b o r d e r   b o r d e r - g r a y - 2 0 0   r o u n d e d - l g   o v e r f l o w - h i d d e n " >  
                                             < b u t t o n  
                                                 t y p e = " b u t t o n "  
                                                 o n C l i c k = { ( )   = >   t o g g l e S e c t i o n ( ' i m a g e s ' ) }  
                                                 c l a s s N a m e = " w - f u l l   p x - 3   s m : p x - 4   p y - 3   b g - g r a y - 5 0   h o v e r : b g - g r a y - 1 0 0   f l e x   i t e m s - c e n t e r   j u s t i f y - b e t w e e n   t r a n s i t i o n   f o n t - s e m i b o l d   t e x t - g r a y - 9 0 0   t e x t - s m   s m : t e x t - b a s e "  
                                             >  
                                                 < s p a n   c l a s s N a m e = " f l e x   i t e m s - c e n t e r   g a p - 2 " >  
                                                     < s p a n > a"’û ]%)"U%Å   P r o d u c t   I m a g e s < / s p a n >  
                                                 < / s p a n >  
                                                 < C h e v r o n D o w n   s i z e = { 1 8 }   c l a s s N a m e = { ` t r a n s i t i o n - t r a n s f o r m   $ { e x p a n d e d S e c t i o n s . i m a g e s   ?   ' r o t a t e - 1 8 0 '   :   ' ' } ` }   / >  
                                             < / b u t t o n >  
                                              
                                             { e x p a n d e d S e c t i o n s . i m a g e s   & &   (  
                                                 < d i v   c l a s s N a m e = " p - 3   s m : p - 4   s p a c e - y - 4   b g - w h i t e " >  
                                                
                                               < i n p u t    
                                                   t y p e = " f i l e "    
                                                   r e f = { f i l e I n p u t R e f }  
                                                   o n C h a n g e = { h a n d l e I m a g e U p l o a d }  
                                                   c l a s s N a m e = " h i d d e n "  
                                                   a c c e p t = " i m a g e / * "  
                                                   m u l t i p l e  
                                               / >  
  
                                               { ! f o r m D a t a . g a l l e r y I m a g e s   | |   f o r m D a t a . g a l l e r y I m a g e s . l e n g t h   = = =   0   ?   (  
                                                     < d i v   c l a s s N a m e = " s p a c e - y - 3 " >  
                                                         < d i v    
                                                             o n C l i c k = { ( )   = >   f i l e I n p u t R e f . c u r r e n t ? . c l i c k ( ) }  
                                                             c l a s s N a m e = " b o r d e r - 2   b o r d e r - d a s h e d   b o r d e r - g r a y - 3 0 0   r o u n d e d - x l   h - 3 2   f l e x   f l e x - c o l   i t e m s - c e n t e r   j u s t i f y - c e n t e r   c u r s o r - p o i n t e r   h o v e r : b o r d e r - p u r p l e - 5 0 0   h o v e r : b g - p u r p l e - 5 0   t r a n s i t i o n   g r o u p "  
                                                         >  
                                                               < d i v   c l a s s N a m e = " b g  
 