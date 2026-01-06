import React, { useState, useMemo } from 'react';
import { Product, WebsiteConfig } from '../types';
import { 
  Trash2, Edit2, Copy, Eye, EyeOff, Search, Filter, Download, Plus,
  TrendingUp, Package, Users, DollarSign, AlertCircle, CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface AdminProductManagerProps {
  products: Product[];
  onUpdateProduct?: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onBulkAction?: (ids: number[], action: string) => void;
  websiteConfig?: WebsiteConfig;
}

type SortField = 'name' | 'price' | 'stock' | 'rating' | 'sales';
type FilterType = 'all' | 'low-stock' | 'high-price' | 'popular';

export const AdminProductManager: React.FC<AdminProductManagerProps> = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onBulkAction,
  websiteConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDesc, setSortDesc] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Filter and sort logic
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      switch (filterType) {
        case 'low-stock':
          return (p.stock || 0) < 10;
        case 'high-price':
          return (p.price || 0) > 500;
        case 'popular':
          return (p.rating || 0) >= 4;
        default:
          return true;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'stock':
          aVal = a.stock || 0;
          bVal = b.stock || 0;
          break;
        case 'rating':
          aVal = a.rating || 0;
          bVal = b.rating || 0;
          break;
        case 'sales':
          aVal = a.sales || 0;
          bVal = b.sales || 0;
          break;
      }
      
      if (typeof aVal === 'string') {
        return sortDesc ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      return sortDesc ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [products, searchTerm, filterType, sortField, sortDesc]);

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (id: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleBulkDelete = () => {
    if (onBulkAction) {
      onBulkAction(Array.from(selectedProducts), 'delete');
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkToggleVisibility = () => {
    if (onBulkAction) {
      onBulkAction(Array.from(selectedProducts), 'toggle-visibility');
    }
  };

  const stats = {
    total: products.length,
    lowStock: products.filter(p => (p.stock || 0) < 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0),
    averageRating: (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <Package className="text-blue-500" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Low Stock</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.lowStock}</p>
            </div>
            <AlertCircle className="text-orange-500" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Inventory Value</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign className="text-green-500" size={28} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.averageRating}★</p>
            </div>
            <TrendingUp className="text-yellow-500" size={28} />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Products</option>
              <option value="low-stock">Low Stock</option>
              <option value="high-price">High Price</option>
              <option value="popular">Popular (4★+)</option>
            </select>

            <button className="px-4 py-2.5 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition flex items-center gap-2">
              <Plus size={18} /> Add Product
            </button>
          </div>

          {/* Sort and Bulk Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="stock">Stock</option>
                <option value="rating">Rating</option>
                <option value="sales">Sales</option>
              </select>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  sortDesc ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {sortDesc ? '↓' : '↑'}
              </button>
            </div>

            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">
                  {selectedProducts.size} selected
                </span>
                <button
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-200 transition"
                >
                  Bulk Actions
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Panel */}
          {showBulkActions && selectedProducts.size > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-wrap gap-3">
              <button
                onClick={handleBulkToggleVisibility}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg text-sm font-semibold hover:bg-purple-50 transition flex items-center gap-2"
              >
                <Eye size={16} /> Toggle Visibility
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition flex items-center gap-2"
              >
                <Trash2 size={16} /> Delete ({selectedProducts.size})
              </button>
              <button
                onClick={() => setShowBulkActions(false)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="rounded cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Product</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Price</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Rating</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="rounded cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image && (
                        <img src={normalizeImageUrl(product.image)} alt={product.name} className="w-10 h-10 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{formatCurrency(product.price || 0)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      (product.stock || 0) < 10
                        ? 'bg-red-100 text-red-700'
                        : (product.stock || 0) < 50
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.stock || 0} units
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      {product.rating ? (
                        <>
                          <span className="font-bold text-gray-900">{product.rating}</span>
                          <span className="text-yellow-500">★</span>
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No ratings</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {product.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <CheckCircle2 size={14} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          <EyeOff size={14} /> Inactive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onUpdateProduct?.(product)}
                        className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(product.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Product?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProduct?.(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
