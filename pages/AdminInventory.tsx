import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface AdminInventoryProps {
  products: Product[];
  tenantId?: string;
  user?: { name?: string; avatar?: string } | null;
}

const AdminInventory: React.FC<AdminInventoryProps> = ({
  products,
  tenantId,
  user
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('stock-low-high');

  // Calculate inventory stats
  const inventoryStats = useMemo(() => {
    const totalProducts = products.length;
    const totalUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockCount = products.filter(p => (p.stock || 0) < 5).length;
    const outOfStockCount = products.filter(p => (p.stock || 0) === 0).length;
    const inventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
    const inventorySaleValue = products.reduce((sum, p) => sum + ((p.originalPrice || p.price || 0) * (p.stock || 0)), 0);

    return {
      totalProducts,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inventoryValue,
      inventorySaleValue
    };
  }, [products]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case 'stock-low-high':
        filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'stock-high-low':
        filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      case 'price-low-high':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high-low':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [products, searchQuery, categoryFilter, sortBy]);

  // Check if inventory is healthy
  const isInventoryHealthy = inventoryStats.lowStockCount === 0 && inventoryStats.outOfStockCount === 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="p-4 md:p-6">
        {/* Main Content Area */}
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="px-5 py-5">
            <h1 className="text-teal-950 text-xl font-bold font-['Lato'] tracking-tight">Inventory</h1>
          </div>

          {/* Stats Cards */}
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Products Card */}
              <div className="px-4 py-3.5 bg-zinc-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <div className="text-black text-base font-medium font-['Poppins']">Products</div>
                    <div className="flex flex-col">
                      <div className="text-black text-2xl font-medium font-['Poppins']">{inventoryStats.totalProducts}</div>
                      <div className="text-neutral-400 text-xs font-medium font-['Poppins']">Stock Report</div>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/fda1d56f-2fe0-4cd7-a589-91844d4e40de.webp" 
                      alt="Products" 
                      className="w-6 h-6 object-contain" 
                    />
                  </div>
                </div>
              </div>

              {/* Total Unit on Hand Card */}
              <div className="px-4 py-3.5 bg-zinc-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <div className="text-black text-base font-medium font-['Poppins']">Total unit on hand</div>
                    <div className="flex flex-col">
                      <div className="text-black text-2xl font-medium font-['Poppins']">{inventoryStats.totalUnits}</div>
                      <div className="text-neutral-400 text-xs font-medium font-['Poppins']">Access entire shop</div>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/b857cbb9-a672-4659-b34f-0dacac429ac4.webp" 
                      alt="Total Units" 
                      className="w-6 h-6 object-contain" 
                    />
                  </div>
                </div>
              </div>

              {/* Low Stock Card */}
              <div className="px-4 py-3.5 bg-zinc-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <div className="text-black text-base font-medium font-['Poppins']">Low stock</div>
                    <div className="flex flex-col">
                      <div className="text-black text-2xl font-medium font-['Poppins']">{inventoryStats.lowStockCount}</div>
                      <div className="text-neutral-400 text-xs font-medium font-['Poppins']">{inventoryStats.outOfStockCount} out / {inventoryStats.lowStockCount} low (&lt;5)</div>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/827fac52-066f-4115-9bf8-3acaf8cf7ab1.webp" 
                      alt="Low Stock" 
                      className="w-6 h-6 object-contain" 
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Value Card */}
              <div className="px-4 py-3.5 bg-zinc-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <div className="text-black text-base font-medium font-['Poppins']">Inventory value</div>
                    <div className="flex flex-col">
                      <div className="text-black text-2xl font-medium font-['Poppins']">৳{inventoryStats.inventoryValue.toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs font-medium font-['Poppins']">Reserve Price</div>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/9ee7f84c-07b0-4d3f-8d11-6f06bb34f992.webp" 
                      alt="Inventory Value" 
                      className="w-6 h-6 object-contain" 
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Sale Value Card */}
              <div className="px-4 py-3.5 bg-zinc-100 rounded-lg overflow-hidden">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col gap-2">
                    <div className="text-black text-base font-medium font-['Poppins']">Inventory sale value</div>
                    <div className="flex flex-col">
                      <div className="text-black text-2xl font-medium font-['Poppins']">৳{inventoryStats.inventorySaleValue.toLocaleString()}</div>
                      <div className="text-neutral-400 text-xs font-medium font-['Poppins']">Selling Price</div>
                    </div>
                  </div>
                  <div className="w-11 h-11 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                    <img 
                      src="https://systemnextit.com/uploads/images/695d12eba327aa48196200fa/9ee7f84c-07b0-4d3f-8d11-6f06bb34f992.webp" 
                      alt="Sale Value" 
                      className="w-6 h-6 object-contain" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="px-5 pb-5">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Left side - Search and Sort */}
              <div className="flex-1 flex flex-col sm:flex-row gap-4">
                {/* Search Box */}
                <div className="flex-1 max-w-md h-8 bg-zinc-100 rounded-lg overflow-hidden flex items-center px-2">
                  <Search className="w-6 h-6 text-black flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search Category"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-black text-xs font-normal font-['Poppins'] outline-none ml-2 placeholder:text-neutral-500"
                  />
                  <span className="text-black text-xs font-normal font-['Poppins'] mr-2">Search</span>
                </div>

                {/* Sort By */}
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500 text-xs font-normal font-['Poppins']">Sort by</span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-40 px-2 py-2 bg-zinc-100 rounded-lg text-black text-xs font-normal font-['Poppins'] outline-none appearance-none cursor-pointer pr-8"
                    >
                      <option value="stock-low-high">Stock low to high</option>
                      <option value="stock-high-low">Stock high to low</option>
                      <option value="price-low-high">Price low to high</option>
                      <option value="price-high-low">Price high to low</option>
                      <option value="name-asc">Name A-Z</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Right side - Inventory Alerts Card */}
              <div className="lg:w-96 px-4 py-3.5 bg-white rounded-lg shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden">
                <div className="flex flex-col gap-2">
                  <div className="text-black text-base font-medium font-['Poppins']">Inventory alerts</div>
                  <div className="text-neutral-400 text-xs font-medium font-['Poppins']">Review the most critical SKUs and plan replenishment</div>
                  <div className={`h-12 flex items-center px-4 rounded overflow-hidden ${isInventoryHealthy ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    {isInventoryHealthy ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-emerald-600 mr-3" />
                        <span className="text-emerald-600 text-xs font-medium font-['Poppins']">Inventory looks healthy: No low-stock items.</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                        <span className="text-amber-600 text-xs font-medium font-['Poppins']">{inventoryStats.lowStockCount} items need attention. {inventoryStats.outOfStockCount} out of stock.</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="h-12 bg-gradient-to-b from-sky-400/25 to-blue-500/25 overflow-hidden flex items-center min-w-[680px]">
              <div className="w-72 px-5 text-black text-base font-medium font-['Poppins']">Product</div>
              <div className="w-32 px-4 text-black text-base font-medium font-['Poppins']">Category</div>
              <div className="w-24 px-4 text-black text-base font-medium font-['Poppins']">Price</div>
              <div className="w-20 px-4 text-black text-base font-medium font-['Poppins']">Stock</div>
              <div className="w-24 px-4 text-center text-black text-base font-medium font-['Poppins']">Status</div>
            </div>

            {/* Table Body */}
            <div className="min-w-[680px]">
              {filteredProducts.length === 0 ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="text-center">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-neutral-500 text-sm font-['Poppins']">No products found</p>
                  </div>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className="h-16 border-b border-zinc-400/50 overflow-hidden flex items-center hover:bg-gray-50 transition-colors"
                  >
                    {/* Product Name */}
                    <div className="w-72 px-5 flex items-center gap-3">
                      {product.image ? (
                        <img 
                          src={normalizeImageUrl(product.image)} 
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-stone-900 text-xs font-normal font-['Poppins'] line-clamp-2">{product.name}</span>
                    </div>

                    {/* Category */}
                    <div className="w-32 px-4">
                      <span className="text-stone-900 text-xs font-normal font-['Poppins']">{product.category || 'Uncategorized'}</span>
                    </div>

                    {/* Price */}
                    <div className="w-24 px-4">
                      <span className="text-stone-900 text-xs font-normal font-['Poppins']">৳{(product.price || 0).toLocaleString()}</span>
                    </div>

                    {/* Stock */}
                    <div className="w-20 px-4 text-center">
                      <span className={`text-xs font-normal font-['Poppins'] ${(product.stock || 0) < 5 ? 'text-red-600 font-medium' : 'text-stone-900'}`}>
                        {product.stock || 0}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="w-24 px-4 flex justify-center">
                      {(product.stock || 0) === 0 ? (
                        <span className="px-2 py-0.5 bg-red-200 rounded-[30px] text-center text-red-900 text-xs font-medium font-['Poppins']">
                          Out
                        </span>
                      ) : (product.stock || 0) < 5 ? (
                        <span className="px-2 py-0.5 bg-amber-200 rounded-[30px] text-center text-amber-900 text-xs font-medium font-['Poppins']">
                          Low
                        </span>
                      ) : product.status === 'Active' ? (
                        <span className="px-2 py-0.5 bg-green-200 rounded-[30px] text-center text-green-900 text-xs font-medium font-['Poppins']">
                          Publish
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-200 rounded-[30px] text-center text-gray-700 text-xs font-medium font-['Poppins']">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination or Load More */}
          {filteredProducts.length > 0 && (
            <div className="px-5 py-4 flex justify-between items-center border-t border-gray-200">
              <span className="text-neutral-500 text-sm font-['Poppins']">
                Showing {filteredProducts.length} of {products.length} products
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
