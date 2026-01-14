import React, { useState, useEffect } from 'react';
import { useTenant } from '../hooks/useTenant';
import { OfferPageManager } from '../components/OfferPageManager';
import { OfferPageBuilder } from '../components/OfferPageBuilder';
import { OfferLandingPage } from '../components/OfferLandingPage';
import { DataService, OfferPageResponse } from '../services/DataService';
import { Product } from '../types';
import { ArrowLeft, X } from 'lucide-react';

type ViewMode = 'list' | 'create' | 'edit' | 'preview';

const AdminLandingPage: React.FC = () => {
  const { activeTenantId } = useTenant();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingPage, setEditingPage] = useState<OfferPageResponse | null>(null);
  const [previewPage, setPreviewPage] = useState<OfferPageResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!activeTenantId) return;
      try {
        const data = await DataService.getProducts(activeTenantId);
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
    };
    fetchProducts();
  }, [activeTenantId]);

  const handleCreateNew = () => {
    setEditingPage(null);
    setViewMode('create');
  };

  const handleEdit = (page: OfferPageResponse) => {
    setEditingPage(page);
    setViewMode('edit');
  };

  const handlePreview = (page: OfferPageResponse) => {
    setPreviewPage(page);
    setViewMode('preview');
  };

  const handleSave = () => {
    setViewMode('list');
    setEditingPage(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingPage(null);
    setPreviewPage(null);
  };

  if (!activeTenantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-400">Please select a tenant</p>
      </div>
    );
  }

  // Preview mode - full screen
  if (viewMode === 'preview' && previewPage) {
    return (
      <div className="fixed inset-0 bg-white z-50 overflow-auto">
        <div className="sticky top-0 z-10 bg-gray-900 text-white p-3 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <ArrowLeft size={20} />
            Back to List
          </button>
          <span className="text-sm text-gray-400">Preview Mode</span>
          <button onClick={handleCancel} className="p-2 hover:bg-gray-800 rounded">
            <X size={20} />
          </button>
        </div>
        <OfferLandingPage offerPage={previewPage as any} />
      </div>
    );
  }

  // Create/Edit mode
  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <OfferPageBuilder
        tenantId={activeTenantId}
        products={products}
        editingPage={editingPage}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  // List mode (default)
  return (
    <OfferPageManager
      key={refreshKey}
      tenantId={activeTenantId}
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onPreview={handlePreview}
    />
  );
};

export default AdminLandingPage;
