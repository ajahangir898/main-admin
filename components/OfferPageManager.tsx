import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, Copy, ExternalLink,
  MoreVertical, Calendar, ShoppingCart, TrendingUp, FileText,
  CheckCircle, Clock, Archive, X, AlertTriangle
} from 'lucide-react';
import { getOfferPages, deleteOfferPage, updateOfferPage, OfferPageResponse } from '../services/DataService';

interface OfferPageManagerProps {
  tenantId: string;
  onCreateNew: () => void;
  onEdit: (page: OfferPageResponse) => void;
  onPreview: (page: OfferPageResponse) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-yellow-100 text-yellow-800',
    archived: 'bg-gray-100 text-gray-800'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {status}
    </span>
  );
};

export const OfferPageManager: React.FC<OfferPageManagerProps> = ({
  tenantId,
  onCreateNew,
  onEdit,
  onPreview
}) => {
  const [pages, setPages] = useState<OfferPageResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; page: OfferPageResponse | null }>({ open: false, page: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPages = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const response = await getOfferPages(tenantId);
      setPages(response.data || []);
    } catch (error) {
      console.error('Error fetching offer pages:', error);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [tenantId]);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.urlSlug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async () => {
    if (!deleteModal.page) return;
    setIsDeleting(true);
    try {
      await deleteOfferPage(tenantId, deleteModal.page._id);
      setPages(pages.filter(p => p._id !== deleteModal.page?._id));
      setDeleteModal({ open: false, page: null });
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTogglePublish = async (page: OfferPageResponse) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';
    try {
      await updateOfferPage(tenantId, page._id, { status: newStatus });
      setPages(pages.map(p => p._id === page._id ? { ...p, status: newStatus } : p));
    } catch (error) {
      console.error('Error updating page status:', error);
      alert('Failed to update page status');
    }
  };

  const copyUrl = (slug: string) => {
    const url = `${window.location.origin}/offer/${slug}`;
    navigator.clipboard.writeText(url);
    alert('URL copied!');
  };

  const stats = {
    total: pages.length,
    published: pages.filter(p => p.status === 'published').length,
    draft: pages.filter(p => p.status === 'draft').length,
    totalViews: pages.reduce((sum, p) => sum + (p.views || 0), 0),
    totalOrders: pages.reduce((sum, p) => sum + (p.orders || 0), 0)
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Pages</h1>
          <p className="text-gray-500 mt-1">Create and manage landing pages for your offers</p>
        </div>
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create New Page
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <FileText size={16} />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <CheckCircle size={16} />
            <span className="text-sm">Published</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.published}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock size={16} />
            <span className="text-sm">Draft</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Eye size={16} />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalViews}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <ShoppingCart size={16} />
            <span className="text-sm">Total Orders</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.totalOrders}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No offer pages</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new offer page.</p>
            <button
              onClick={onCreateNew}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Page
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer End</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPages.map((page) => (
                  <tr key={page._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {page.imageUrl && (
                          <img
                            src={page.imageUrl}
                            alt={page.productTitle}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{page.productTitle}</p>
                          <p className="text-sm text-gray-500">/offer/{page.urlSlug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={page.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar size={14} />
                        {new Date(page.offerEndDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {page.views || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {page.orders || 0}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onPreview(page)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Preview"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit(page)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => copyUrl(page.urlSlug)}
                          className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded"
                          title="Copy URL"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(page)}
                          className={`p-2 rounded ${
                            page.status === 'published'
                              ? 'text-yellow-600 hover:bg-yellow-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={page.status === 'published' ? 'Unpublish' : 'Publish'}
                        >
                          {page.status === 'published' ? <Archive size={18} /> : <CheckCircle size={18} />}
                        </button>
                        <button
                          onClick={() => setDeleteModal({ open: true, page })}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold">Delete Offer Page</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "<strong>{deleteModal.page?.productTitle}</strong>"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ open: false, page: null })}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfferPageManager;
