// components/ProductFormModal.tsx
// New Product Form Modal with Figma Design Implementation
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  X, Upload, Image as ImageIcon, Plus, Trash2, Check, 
  Calendar, RefreshCw, ChevronDown, Minus, Scan,
  Save, FileText
} from 'lucide-react';
import { Product, Category, SubCategory, ChildCategory, Brand, Tag } from '../types';

// Types for variant management
interface VariantOption {
  id: string;
  name: string;
}

interface Variation {
  id: string;
  name: string;
  options: VariantOption[];
}

interface VariantRow {
  id: string;
  image: string;
  name: string;
  regularPrice: number;
  salePrice: number;
  costPrice: number;
  quantity: number;
  sku: string;
  isDefault: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  slug: string;
  autoSlug: boolean;
  regularPrice: number;
  salePrice: number;
  costPrice: number;
  sku: string;
  barcode: string;
  moq: number;
  quantity: number;
  category: string;
  subCategory: string;
  childCategory: string;
  tags: string[];
  brand: string;
  deliveryInsideDhaka: number;
  deliveryOutsideDhaka: number;
  expirationStart: string;
  expirationEnd: string;
  stockQuantity: string;
  stockStatus: string;
  unlimited: boolean;
  hideInWebsite: boolean;
  mainImage: string;
  galleryImages: string[];
  variations: Variation[];
  variantRows: VariantRow[];
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => void;
  onSaveDraft: (product: Partial<Product>) => void;
  editingProduct?: Product | null;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  isLoading?: boolean;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSaveDraft,
  editingProduct,
  categories,
  subCategories,
  childCategories,
  brands,
  tags,
  isLoading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    slug: '',
    autoSlug: true,
    regularPrice: 0,
    salePrice: 0,
    costPrice: 0,
    sku: '',
    barcode: '',
    moq: 0,
    quantity: 0,
    category: '',
    subCategory: '',
    childCategory: '',
    tags: [],
    brand: '',
    deliveryInsideDhaka: 80,
    deliveryOutsideDhaka: 120,
    expirationStart: '',
    expirationEnd: '',
    stockQuantity: 'Unlimited',
    stockStatus: 'In Stock',
    unlimited: true,
    hideInWebsite: false,
    mainImage: '',
    galleryImages: [],
    variations: [
      { id: '1', name: 'Add Variation 1', options: [] },
      { id: '2', name: 'Add Variation 2', options: [] },
      { id: '3', name: 'Add Variation 3', options: [] },
      { id: '4', name: 'Add Variation 4', options: [] },
    ],
    variantRows: [
      { id: '1', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '2', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '3', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
      { id: '4', image: '', name: '', regularPrice: 0, salePrice: 0, costPrice: 0, quantity: 0, sku: '', isDefault: false },
    ]
  });

  const [variationInputs, setVariationInputs] = useState<Record<string, string>>({});
  const [expandedVariations, setExpandedVariations] = useState<Record<string, boolean>>({
    '1': true, '2': false, '3': false, '4': false,
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData(prev => ({
        ...prev,
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        slug: editingProduct.slug || '',
        regularPrice: editingProduct.price || 0,
        salePrice: editingProduct.originalPrice || 0,
        sku: editingProduct.sku || '',
        category: editingProduct.category || '',
        subCategory: editingProduct.subCategory || '',
        childCategory: editingProduct.childCategory || '',
        tags: editingProduct.tags || [],
        brand: editingProduct.brand || '',
        mainImage: editingProduct.image || '',
        galleryImages: editingProduct.galleryImages || [],
      }));
    }
  }, [editingProduct]);

  const availableSubCategories = subCategories.filter(s => {
    const parentCat = categories.find(c => c.name === formData.category);
    return parentCat && s.categoryId === parentCat.id;
  });

  const availableChildCategories = childCategories.filter(c => {
    const parentSub = subCategories.find(s => s.name === formData.subCategory);
    return parentSub && c.subCategoryId === parentSub.id;
  });

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: prev.autoSlug ? generateSlug(value) : prev.slug
    }));
  };

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFormData(prev => ({ ...prev, mainImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            galleryImages: [...prev.galleryImages, reader.result as string].slice(0, 10)
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index)
    }));
  };

  const handleVariantImageUpload = (variantId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({
            ...prev,
            variantRows: prev.variantRows.map(row =>
              row.id === variantId ? { ...row, image: reader.result as string } : row
            )
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const updateVariantRow = (id: string, field: keyof VariantRow, value: any) => {
    setFormData(prev => ({
      ...prev,
      variantRows: prev.variantRows.map(row =>
        row.id === id ? { ...row, [field]: value } : row
      )
    }));
  };

  const addVariationOption = (variationId: string) => {
    const input = variationInputs[variationId]?.trim();
    if (!input) return;
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map(v =>
        v.id === variationId
          ? { ...v, options: [...v.options, { id: Date.now().toString(), name: input }] }
          : v
      )
    }));
    setVariationInputs(prev => ({ ...prev, [variationId]: '' }));
  };

  const removeVariationOption = (variationId: string, optionId: string) => {
    setFormData(prev => ({
      ...prev,
      variations: prev.variations.map(v =>
        v.id === variationId
          ? { ...v, options: v.options.filter(o => o.id !== optionId) }
          : v
      )
    }));
  };

  const toggleVariation = (id: string) => {
    setExpandedVariations(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const applyToAll = () => {
    setFormData(prev => ({
      ...prev,
      variantRows: prev.variantRows.map(row => ({
        ...row,
        regularPrice: prev.regularPrice,
        salePrice: prev.salePrice,
        costPrice: prev.costPrice,
        quantity: prev.quantity,
        sku: prev.sku,
      }))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: Product = {
      id: editingProduct?.id || Date.now(),
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      price: formData.regularPrice,
      originalPrice: formData.salePrice,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      category: formData.category,
      subCategory: formData.subCategory,
      childCategory: formData.childCategory,
      brand: formData.brand,
      tags: formData.tags,
      searchTags: [],
      colors: [],
      sizes: [],
      discount: '',
      status: 'Active',
      sku: formData.sku,
    };
    onSubmit(productData);
  };

  const handleSaveDraft = () => {
    onSaveDraft({
      name: formData.name,
      description: formData.description,
      slug: formData.slug,
      price: formData.regularPrice,
      originalPrice: formData.salePrice,
      image: formData.mainImage,
      galleryImages: formData.galleryImages,
      category: formData.category,
      tags: formData.tags,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:p-8">
      <div className="relative w-full max-w-6xl bg-gray-100 rounded-2xl shadow-2xl my-4">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 p-2 rounded-lg hover:bg-gray-200 transition-colors">
          <X size={20} className="text-gray-500" />
        </button>

        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Details */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Details</h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-semibold text-gray-700">Product Name</label>
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={formData.autoSlug} onChange={(e) => setFormData(prev => ({ ...prev, autoSlug: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
                      Auto Slug
                    </label>
                  </div>
                  <input type="text" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Jasmine Fragrance Oil" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Product Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Enter product description..." rows={4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm resize-none" />
                </div>
              </div>

              {/* Price & Stock */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Price & Stock</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Regular Price</label>
                    <input type="text" value={formData.regularPrice || ''} onChange={(e) => setFormData(prev => ({ ...prev, regularPrice: parseFloat(e.target.value) || 0 }))} placeholder="Ex 1990" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sale Price</label>
                    <input type="text" value={formData.salePrice || ''} onChange={(e) => setFormData(prev => ({ ...prev, salePrice: parseFloat(e.target.value) || 0 }))} placeholder="Ex 1990" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cost Price</label>
                    <input type="text" value={formData.costPrice || ''} onChange={(e) => setFormData(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))} placeholder="Ex 1990" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">SKU</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder="#SK0001" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bar code</label>
                    <div className="relative">
                      <input type="text" value={formData.barcode} onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))} placeholder="2154645786216" className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Scan size={18} /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">MOQ</label>
                    <input type="text" value={formData.moq || ''} onChange={(e) => setFormData(prev => ({ ...prev, moq: parseInt(e.target.value) || 0 }))} placeholder="Ex 1990" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Quantity</label>
                    <input type="text" value={formData.quantity || ''} onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} placeholder="Ex 1990" className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                  </div>
                  <div>
                    <button type="button" onClick={applyToAll} className="w-full px-4 py-2.5 bg-emerald-50 text-emerald-600 font-semibold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm">Apply to all</button>
                  </div>
                </div>
              </div>

              {/* Variant Rows */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="space-y-4">
                  {formData.variantRows.map((variant) => (
                    <div key={variant.id} className="flex flex-col md:flex-row items-start gap-3">
                      <div onClick={() => handleVariantImageUpload(variant.id)} className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors">
                        {variant.image ? <img src={variant.image} alt="" className="w-full h-full object-cover rounded-lg" /> : <><Upload size={16} className="text-gray-400 mb-1" /><span className="text-[10px] text-gray-400">Upload</span></>}
                      </div>
                      <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-6 gap-2">
                        <input type="text" value={variant.name} onChange={(e) => updateVariantRow(variant.id, 'name', e.target.value)} placeholder="Name" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                        <input type="text" value={variant.regularPrice || ''} onChange={(e) => updateVariantRow(variant.id, 'regularPrice', parseFloat(e.target.value) || 0)} placeholder="Regular Price" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                        <input type="text" value={variant.salePrice || ''} onChange={(e) => updateVariantRow(variant.id, 'salePrice', parseFloat(e.target.value) || 0)} placeholder="Sale Price" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                        <div className="col-span-2 md:col-span-3 flex items-center justify-end">
                          <label className="flex items-center gap-2 text-xs text-gray-500">
                            <input type="checkbox" checked={variant.isDefault} onChange={(e) => updateVariantRow(variant.id, 'isDefault', e.target.checked)} className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500" />
                            Default
                          </label>
                        </div>
                        <input type="text" value={variant.costPrice || ''} onChange={(e) => updateVariantRow(variant.id, 'costPrice', parseFloat(e.target.value) || 0)} placeholder="Cost Price" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                        <input type="text" value={variant.quantity || ''} onChange={(e) => updateVariantRow(variant.id, 'quantity', parseInt(e.target.value) || 0)} placeholder="Quantity" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                        <input type="text" value={variant.sku} onChange={(e) => updateVariantRow(variant.id, 'sku', e.target.value)} placeholder="SKU" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-xs" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inventory */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Inventory</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Quantity</label>
                    <input type="text" value={formData.stockQuantity} onChange={(e) => setFormData(prev => ({ ...prev, stockQuantity: e.target.value }))} placeholder="Unlimited" disabled={formData.unlimited} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Stock Status</label>
                    <select value={formData.stockStatus} onChange={(e) => setFormData(prev => ({ ...prev, stockStatus: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm appearance-none cursor-pointer">
                      <option value="In Stock">In Stock</option>
                      <option value="Out of Stock">Out of Stock</option>
                      <option value="Pre-order">Pre-order</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, unlimited: !prev.unlimited }))} className={`relative w-11 h-6 rounded-full transition-colors ${formData.unlimited ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.unlimited ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-sm text-gray-700">Unlimited</span>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={formData.hideInWebsite} onChange={(e) => setFormData(prev => ({ ...prev, hideInWebsite: e.target.checked }))} className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-400" />
                  Hide in website (for landing page)
                </label>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Upload Product Image */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Upload Product Image</h2>
                <p className="text-xs text-gray-400 mb-4">Up to 10 Images</p>
                <div className="relative mb-4 border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <div className="aspect-square flex items-center justify-center p-4">
                    {formData.mainImage ? <img src={formData.mainImage} alt="Product" className="max-w-full max-h-full object-contain" /> : <div className="text-center text-gray-400"><ImageIcon size={48} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No image uploaded</p></div>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 flex">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-white border-t border-r border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><ImageIcon size={16} />Browse</button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 py-2.5 bg-white border-t border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><RefreshCw size={16} />Replace</button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {formData.galleryImages.map((img, index) => (
                    <div key={index} className="relative w-16 h-16 rounded-lg border border-gray-200 overflow-hidden group">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(index)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><X size={16} className="text-white" /></button>
                    </div>
                  ))}
                  {formData.galleryImages.length < 10 && (
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-emerald-500 hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                      <Plus size={16} /><span className="text-[10px] mt-0.5">Add Image</span>
                    </button>
                  )}
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGalleryUpload} className="hidden" />
                </div>
              </div>

              {/* Categories */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Categories</h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-600">Product Categories</label>
                    <button type="button" className="text-xs font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1"><Plus size={12} />Add New</button>
                  </div>
                  <select value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subCategory: '', childCategory: '' }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm appearance-none cursor-pointer">
                    <option value="">Select your category</option>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-600">Tags</label>
                    <button type="button" className="text-xs font-medium text-emerald-500 hover:text-emerald-600 flex items-center gap-1"><Plus size={12} />Add New</button>
                  </div>
                  <select className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm appearance-none cursor-pointer">
                    <option value="">Select your tags</option>
                    {tags.map(tag => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Variation */}
              <div className="bg-white p-4 md:p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Variation</h2>
                <div className="space-y-3">
                  {formData.variations.map((variation) => (
                    <div key={variation.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                      <button type="button" onClick={() => toggleVariation(variation.id)} className="w-full flex items-center justify-between py-1 text-gray-700 hover:text-gray-900">
                        <span className="text-sm font-medium">{variation.name}</span>
                        {expandedVariations[variation.id] ? <Minus size={16} className="text-gray-400" /> : <Plus size={16} className="text-gray-400" />}
                      </button>
                      {expandedVariations[variation.id] && (
                        <div className="mt-2 space-y-2">
                          <input type="text" value={variationInputs[variation.id] || ''} onChange={(e) => setVariationInputs(prev => ({ ...prev, [variation.id]: e.target.value }))} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariationOption(variation.id))} placeholder={variation.id === '1' ? 'Colour' : 'Variation name'} className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none text-sm" />
                          {variation.options.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {variation.options.map((option) => (
                                <span key={option.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-lg border border-blue-200">
                                  {option.name}
                                  <button type="button" onClick={() => removeVariationOption(variation.id, option.id)} className="text-blue-400 hover:text-blue-600"><Trash2 size={12} /></button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 pt-6 border-t border-gray-200">
            <button type="button" onClick={handleSaveDraft} className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"><Save size={16} />Save to draft</button>
            <button type="submit" disabled={isLoading} className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white font-semibold rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading ? 'Publishing...' : 'Publish Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;
