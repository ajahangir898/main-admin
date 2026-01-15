import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Filter, Eye, Edit2, Trash2, Copy, ExternalLink,
  MoreVertical, Calendar, ShoppingCart, TrendingUp, FileText,
  CheckCircle, Clock, Archive, X, AlertTriangle, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { getOfferPages, deleteOfferPage, updateOfferPage, OfferPageResponse } from '../services/DataService';

interface OfferPageManagerProps {
  tenantId: string;
  onCreateNew: () => void;
  onEdit: (page: OfferPageResponse) => void;
  onPreview: (page: OfferPageResponse) => void;
}

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
  const [versionFilter, setVersionFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; page: OfferPageResponse | null }>({ open: false, page: null });
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [previewPage, setPreviewPage] = useState<OfferPageResponse | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPages = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const response = await getOfferPages(tenantId);
      setPages(response.data || []);
      if (response.data?.length > 0) {
        setPreviewPage(response.data[0]);
      }
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredPages.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedPages = filteredPages.slice(startIndex, startIndex + pageSize);

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

  const handleSelectAll = () => {
    if (selectedPages.length === paginatedPages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages(paginatedPages.map(p => p._id));
    }
  };

  const handleSelectPage = (id: string) => {
    setSelectedPages(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleRowClick = (page: OfferPageResponse) => {
    setPreviewPage(page);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Section - Table */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Landing Page</h1>
            <p className="text-gray-500 mt-1">Create unlimited landing Page</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-orange-400 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors">
              Version 1
              <ChevronDown size={16} />
            </button>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
            >
              <Plus size={18} />
              Create Landing Page
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search Category"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
            />
          </div>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            Search
          </button>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Filter size={16} />
            Filter:
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Category</option>
          </select>
          <select
            value={versionFilter}
            onChange={(e) => setVersionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Version</option>
            <option value="v1">V-1</option>
            <option value="v2">V-2</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No landing pages</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new landing page.</p>
              <button
                onClick={onCreateNew}
                className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
              >
                Create First Page
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-teal-50 border-b border-teal-100">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedPages.length === paginatedPages.length && paginatedPages.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SL</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Landing Page URL</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Version</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedPages.map((page, index) => (
                      <tr 
                        key={page._id} 
                        className={`hover:bg-gray-50 cursor-pointer ${previewPage?._id === page._id ? 'bg-teal-50/50' : ''}`}
                        onClick={() => handleRowClick(page)}
                      >
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPages.includes(page._id)}
                            onChange={() => handleSelectPage(page._id)}
                            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {page.imageUrl ? (
                              <img
                                src={page.imageUrl}
                                alt={page.productTitle}
                                className="w-10 h-10 object-cover rounded-lg border"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText size={16} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900 text-sm line-clamp-2 max-w-[150px]">
                                {page.productTitle}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 truncate max-w-[180px]">
                            offer/{page.urlSlug}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-xs font-medium">
                            V-1
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePublish(page);
                            }}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              page.status === 'published'
                                ? 'bg-teal-500 text-white hover:bg-teal-600'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {page.status === 'published' ? 'Publish' : 'Draft'}
                          </button>
                        </td>
                        <td className="px-4 py-3 relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === page._id ? null : page._id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical size={18} className="text-gray-500" />
                          </button>
                          
                          {actionMenuOpen === page._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border z-10">
                              <button
                                onClick={() => {
                                  onPreview(page);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye size={16} /> Preview
                              </button>
                              <button
                                onClick={() => {
                                  onEdit(page);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit2 size={16} /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  copyUrl(page.urlSlug);
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Copy size={16} /> Copy URL
                              </button>
                              <button
                                onClick={() => {
                                  window.open(`/offer/${page.urlSlug}`, '_blank');
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <ExternalLink size={16} /> Open Link
                              </button>
                              <hr className="my-1" />
                              <button
                                onClick={() => {
                                  setDeleteModal({ open: true, page });
                                  setActionMenuOpen(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredPages.length)} of {filteredPages.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded text-sm ${
                            currentPage === pageNum
                              ? 'bg-teal-500 text-white'
                              : 'hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Section - Preview */}
      <div className="w-[380px] border-l bg-white p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Preview</h2>
          {previewPage && (
            <button
              onClick={() => window.open(`/offer/${previewPage.urlSlug}`, '_blank')}
              className="p-2 hover:bg-gray-100 rounded"
              title="Open in new tab"
            >
              <ExternalLink size={18} className="text-gray-500" />
            </button>
          )}
        </div>
        
        {previewPage ? (
          <div className="flex-1 overflow-hidden rounded-lg border bg-gray-100">
            <div className="w-full h-full overflow-auto">
              <div className="transform scale-[0.4] origin-top-left w-[250%]">
                <iframe
                  src={`/offer/${previewPage.urlSlug}`}
                  className="w-full h-[1500px] border-0"
                  title="Preview"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
            <div className="text-center text-gray-400">
              <Eye size={48} className="mx-auto mb-2 opacity-50" />
              <p>Select a page to preview</p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold">Delete Landing Page</h3>
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

      {/* Click outside to close action menu */}
      {actionMenuOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setActionMenuOpen(null)}
        />
      )}
    </div>
  );
};

export default OfferPageManager;
