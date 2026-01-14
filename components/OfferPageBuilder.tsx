import React, { useState, useEffect } from 'react';
import {
  Save, X, Image, Calendar, Type, FileText, Gift, CreditCard,
  Plus, Trash2, MoveUp, MoveDown, Search, Loader2, Upload, Link, ArrowLeft
} from 'lucide-react';
import { Product } from '../types';
import { createOfferPage, updateOfferPage, OfferPageResponse, OfferPageData } from '../services/DataService';

interface Benefit {
  id: string;
  text: string;
}

interface OfferPageBuilderProps {
  tenantId: string;
  products: Product[];
  editingPage?: OfferPageResponse | null;
  onSave: () => void;
  onCancel: () => void;
}

export const OfferPageBuilder: React.FC<OfferPageBuilderProps> = ({
  tenantId,
  products,
  editingPage,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    productId: editingPage?.productId || 0,
    productTitle: editingPage?.productTitle || '',
    searchQuery: editingPage?.searchQuery || '',
    imageUrl: editingPage?.imageUrl || '',
    offerEndDate: editingPage?.offerEndDate ? new Date(editingPage.offerEndDate).toISOString().split('T')[0] : '',
    description: editingPage?.description || '',
    productOfferInfo: editingPage?.productOfferInfo || '',
    paymentSectionTitle: editingPage?.paymentSectionTitle || '',
    whyBuySection: editingPage?.whyBuySection || '',
    urlSlug: editingPage?.urlSlug || '',
    status: editingPage?.status || 'draft' as 'draft' | 'published'
  });

  const [benefits, setBenefits] = useState<Benefit[]>(
    editingPage?.benefits || [{ id: crypto.randomUUID(), text: '' }]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectProduct = (product: Product) => {
    setFormData({
      ...formData,
      productId: product.id,
      productTitle: product.name,
      imageUrl: product.image || '',
      urlSlug: formData.urlSlug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    });
    setShowProductSearch(false);
    setSearchTerm('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/cloudflare/upload`, {
        method: 'POST',
        body: formDataUpload
      });
      
      if (response.ok) {
        const data = await response.json();
        setFormData({ ...formData, imageUrl: data.url });
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const addBenefit = () => {
    setBenefits([...benefits, { id: crypto.randomUUID(), text: '' }]);
  };

  const updateBenefit = (id: string, text: string) => {
    setBenefits(benefits.map(b => b.id === id ? { ...b, text } : b));
  };

  const removeBenefit = (id: string) => {
    if (benefits.length > 1) {
      setBenefits(benefits.filter(b => b.id !== id));
    }
  };

  const moveBenefit = (id: string, direction: 'up' | 'down') => {
    const index = benefits.findIndex(b => b.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === benefits.length - 1)
    ) return;

    const newBenefits = [...benefits];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBenefits[index], newBenefits[newIndex]] = [newBenefits[newIndex], newBenefits[index]];
    setBenefits(newBenefits);
  };

  const generateSlug = () => {
    const slug = formData.productTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, urlSlug: slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.productTitle.trim()) {
      setError('Product title is required');
      return;
    }
    if (!formData.imageUrl.trim()) {
      setError('Image URL is required');
      return;
    }
    if (!formData.offerEndDate) {
      setError('Offer end date is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.urlSlug.trim()) {
      setError('URL slug is required');
      return;
    }

    setIsSaving(true);
    try {
      const data: OfferPageData = {
        ...formData,
        benefits: benefits.filter(b => b.text.trim())
      };

      if (editingPage?._id) {
        await updateOfferPage(tenantId, editingPage._id, data);
      } else {
        await createOfferPage(tenantId, data);
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving offer page:', error);
      setError(error.message || 'Failed to save offer page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold">
              {editingPage ? 'Edit Offer Page' : 'Create Offer Page'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Product Selection */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Search size={20} />
            Product Selection
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between hover:border-blue-500"
              >
                <span className={formData.productTitle ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.productTitle || 'Select a product or enter manually...'}
                </span>
                <Search size={18} className="text-gray-400" />
              </button>
              
              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-64 overflow-auto">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-4 py-2 border-b"
                    autoFocus
                  />
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-gray-500 text-center">No products found</div>
                  ) : (
                    filteredProducts.slice(0, 10).map(product => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => selectProduct(product)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3"
                      >
                        {product.image && (
                          <img src={product.image} alt="" className="w-10 h-10 object-cover rounded" />
                        )}
                        <span>{product.name}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.productTitle}
                onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter product title"
              />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Image size={20} />
            Product Image
          </h2>
          
          <div className="space-y-4">
            {formData.imageUrl && (
              <div className="w-full max-w-md">
                <img
                  src={formData.imageUrl}
                  alt="Product"
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <div className="flex gap-4">
              <label className="flex-1">
                <span className="block text-sm font-medium text-gray-700 mb-1">Image URL</span>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </label>
              
              <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Or Upload</span>
                <label className="flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Offer Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Offer Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer End Date *
              </label>
              <input
                type="date"
                value={formData.offerEndDate}
                onChange={(e) => setFormData({ ...formData, offerEndDate: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL Slug *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.urlSlug}
                  onChange={(e) => setFormData({ ...formData, urlSlug: e.target.value })}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="product-name"
                />
                <button
                  type="button"
                  onClick={generateSlug}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                  title="Generate from title"
                >
                  <Link size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">URL: /offer/{formData.urlSlug || 'slug'}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FileText size={20} />
            Description *
          </h2>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Enter product description..."
          />
        </div>

        {/* Product Offer Info */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Gift size={20} />
            Product Offer Info (HTML)
          </h2>
          <textarea
            value={formData.productOfferInfo}
            onChange={(e) => setFormData({ ...formData, productOfferInfo: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={6}
            placeholder="<p>Special offer details...</p>"
          />
        </div>

        {/* Benefits */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Gift size={20} />
              Benefits
            </h2>
            <button
              type="button"
              onClick={addBenefit}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Plus size={16} />
              Add Benefit
            </button>
          </div>
          
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div key={benefit.id} className="flex items-center gap-2">
                <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={benefit.text}
                  onChange={(e) => updateBenefit(benefit.id, e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter benefit..."
                />
                <button
                  type="button"
                  onClick={() => moveBenefit(benefit.id, 'up')}
                  disabled={index === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <MoveUp size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => moveBenefit(benefit.id, 'down')}
                  disabled={index === benefits.length - 1}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                >
                  <MoveDown size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => removeBenefit(benefit.id)}
                  disabled={benefits.length === 1}
                  className="p-2 text-red-400 hover:text-red-600 disabled:opacity-30"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Why Buy Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <FileText size={20} />
            Why Buy This Product (HTML)
          </h2>
          <textarea
            value={formData.whyBuySection}
            onChange={(e) => setFormData({ ...formData, whyBuySection: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            rows={6}
            placeholder="<h3>Why choose us?</h3><ul><li>Reason 1</li></ul>"
          />
        </div>

        {/* Payment Section Title */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            Payment Section Title
          </h2>
          <input
            type="text"
            value={formData.paymentSectionTitle}
            onChange={(e) => setFormData({ ...formData, paymentSectionTitle: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Order Now"
          />
        </div>

        {/* Status */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-medium mb-4">Status</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.status === 'draft'}
                onChange={() => setFormData({ ...formData, status: 'draft' })}
                className="w-4 h-4 text-blue-600"
              />
              <span>Draft</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={formData.status === 'published'}
                onChange={() => setFormData({ ...formData, status: 'published' })}
                className="w-4 h-4 text-blue-600"
              />
              <span>Published</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Saving...' : (editingPage ? 'Update Page' : 'Create Page')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OfferPageBuilder;
