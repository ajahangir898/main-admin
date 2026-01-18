import React, { useState, useRef, useEffect } from 'react';
import { Category, SubCategory, ChildCategory, Brand, Tag } from '../types';
import { 
  Plus, Search, Edit, Trash2, X, Image as ImageIcon, Upload, 
  Folder, Layers, Bookmark, Hash, MoreVertical, ChevronLeft, ChevronRight,
  ChevronDown, LayoutGrid, ArrowLeft, ArrowRight
} from 'lucide-react';
import { convertFileToWebP } from '../services/imageUtils';

interface AdminCatalogProps {
  view: string;
  onNavigate?: (view: string) => void;
  categories: Category[];
  subCategories: SubCategory[];
  childCategories: ChildCategory[];
  brands: Brand[];
  tags: Tag[];
  onAddCategory: (item: Category) => void;
  onUpdateCategory: (item: Category) => void;
  onDeleteCategory: (id: string) => void;
  onAddSubCategory: (item: SubCategory) => void;
  onUpdateSubCategory: (item: SubCategory) => void;
  onDeleteSubCategory: (id: string) => void;
  onAddChildCategory: (item: ChildCategory) => void;
  onUpdateChildCategory: (item: ChildCategory) => void;
  onDeleteChildCategory: (id: string) => void;
  onAddBrand: (item: Brand) => void;
  onUpdateBrand: (item: Brand) => void;
  onDeleteBrand: (id: string) => void;
  onAddTag: (item: Tag) => void;
  onUpdateTag: (item: Tag) => void;
  onDeleteTag: (id: string) => void;
}

const AdminCatalog: React.FC<AdminCatalogProps> = ({
  view, onNavigate,
  categories, subCategories, childCategories, brands, tags,
  onAddCategory, onUpdateCategory, onDeleteCategory,
  onAddSubCategory, onUpdateSubCategory, onDeleteSubCategory,
  onAddChildCategory, onUpdateChildCategory, onDeleteChildCategory,
  onAddBrand, onUpdateBrand, onDeleteBrand,
  onAddTag, onUpdateTag, onDeleteTag
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab navigation
  const catalogTabs = [
    { id: 'catalog_categories', label: 'Category', icon: <Folder size={16} /> },
    { id: 'catalog_subcategories', label: 'Sub Category', icon: <LayoutGrid size={16} /> },
    { id: 'catalog_childcategories', label: 'Child Category', icon: <Layers size={16} /> },
    { id: 'catalog_brands', label: 'Brand', icon: <Bookmark size={16} /> },
    { id: 'catalog_tags', label: 'Tags', icon: <Hash size={16} /> },
  ];

  const getTitle = () => {
    switch(view) {
      case 'catalog_categories': return 'Category';
      case 'catalog_subcategories': return 'Sub Category';
      case 'catalog_childcategories': return 'Child Category';
      case 'catalog_brands': return 'Brand';
      case 'catalog_tags': return 'Tag';
      default: return 'Item';
    }
  };

  // Get data based on view
  let displayData: any[] = [];
  switch(view) {
    case 'catalog_categories': displayData = categories; break;
    case 'catalog_subcategories': displayData = subCategories; break;
    case 'catalog_childcategories': displayData = childCategories; break;
    case 'catalog_brands': displayData = brands; break;
    case 'catalog_tags': displayData = tags; break;
  }
  
  // Filter by search and status
  displayData = displayData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalItems = displayData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = displayData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (item?: any) => {
    setEditItem(item || null);
    if (item) {
      setFormData({ ...item });
    } else {
      const defaults: any = { name: '', status: 'Active', priority: 100 };
      if (view === 'catalog_categories') defaults.icon = '';
      if (view === 'catalog_subcategories') defaults.categoryId = categories[0]?.id || '';
      if (view === 'catalog_childcategories') defaults.subCategoryId = subCategories[0]?.id || '';
      if (view === 'catalog_brands') defaults.logo = '';
      setFormData(defaults);
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editItem ? editItem.id : Date.now().toString();
    const newItem = { ...formData, id };

    switch(view) {
      case 'catalog_categories': editItem ? onUpdateCategory(newItem) : onAddCategory(newItem); break;
      case 'catalog_subcategories': editItem ? onUpdateSubCategory(newItem) : onAddSubCategory(newItem); break;
      case 'catalog_childcategories': editItem ? onUpdateChildCategory(newItem) : onAddChildCategory(newItem); break;
      case 'catalog_brands': editItem ? onUpdateBrand(newItem) : onAddBrand(newItem); break;
      case 'catalog_tags': editItem ? onUpdateTag(newItem) : onAddTag(newItem); break;
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if(!window.confirm('Are you sure you want to delete this item?')) return;
    switch(view) {
      case 'catalog_categories': onDeleteCategory(id); break;
      case 'catalog_subcategories': onDeleteSubCategory(id); break;
      case 'catalog_childcategories': onDeleteChildCategory(id); break;
      case 'catalog_brands': onDeleteBrand(id); break;
      case 'catalog_tags': onDeleteTag(id); break;
    }
    setOpenActionMenu(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const converted = await convertFileToWebP(file, { quality: 0.8, maxDimension: 600 });
      const fieldName = view === 'catalog_brands' ? 'logo' : 'icon';
      setFormData({ ...formData, [fieldName]: converted });
    } catch (error) {
      console.error('Failed to process image', error);
      alert('Unable to process this image.');
    }
    e.target.value = '';
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenActionMenu(null);
    if (openActionMenu) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenu]);

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = 1; i <= maxVisible; i++) pages.push(i);
      pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Check if view needs image column
  const showImageColumn = view === 'catalog_categories' || view === 'catalog_brands';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Page Header */}
      <div className="bg-white px-4 sm:px-6 py-4 sm:py-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Catalog</h1>
      </div>

      {/* Toolbar Row */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search Category"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-48 md:w-56 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent placeholder:text-gray-400"
              />
            </div>
            <button className="px-3 sm:px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-200 transition whitespace-nowrap">
              Search
            </button>
          </div>

          {/* Filters & Add Button */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-none min-w-[100px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full pl-3 pr-7 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                <option>All Status</option>
                <option value="Active">Publish</option>
                <option value="Inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Items Per Page */}
            <div className="relative flex-1 sm:flex-none min-w-[110px]">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="appearance-none w-full pl-3 pr-7 py-2 bg-white border border-gray-200 rounded-lg text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
              >
                <option value={10}>10 {getTitle()}</option>
                <option value={20}>20 {getTitle()}</option>
                <option value={50}>50 {getTitle()}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>

            {/* Add Button */}
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg text-xs sm:text-sm font-semibold hover:from-cyan-500 hover:to-cyan-600 transition shadow-sm whitespace-nowrap"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden xs:inline">Add</span> {getTitle()}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {catalogTabs.map((tab) => {
            const isActive = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { onNavigate?.(tab.id); setCurrentPage(1); }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className={`${isActive ? 'text-cyan-500' : 'text-gray-400'}`}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cyan-50/60">
                  <th className="w-10 sm:w-12 px-3 sm:px-4 py-3 sm:py-4">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400" />
                  </th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">SL</th>
                  {showImageColumn && (
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                  )}
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  {view === 'catalog_subcategories' && (
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>
                  )}
                  {view === 'catalog_childcategories' && (
                    <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent Sub</th>
                  )}
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Priority</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-left text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 py-3 sm:py-4 text-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((item, idx) => {
                  const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400" />
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{serialNumber}</td>
                      {showImageColumn && (
                        <td className="px-3 sm:px-4 py-3 sm:py-4">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                            {(item.icon || item.logo) ? (
                              <img src={item.icon || item.logo} className="w-full h-full object-cover" alt={item.name} />
                            ) : (
                              <ImageIcon size={14} className="text-gray-400 sm:w-4 sm:h-4" />
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-700">{item.name}</td>
                      {view === 'catalog_subcategories' && (
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                          {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                        </td>
                      )}
                      {view === 'catalog_childcategories' && (
                        <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                          {subCategories.find(s => s.id === item.subCategoryId)?.name || 'Unknown'}
                        </td>
                      )}
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{item.productCount || 5}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{item.priority || 100}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <span className={`inline-flex px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                          item.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {item.status === 'Active' ? 'Publish' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex justify-center relative">
                          <button
                            onClick={(e) => { e.stopPropagation(); setOpenActionMenu(openActionMenu === item.id ? null : item.id); }}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                          >
                            <MoreVertical size={16} className="text-gray-400" />
                          </button>
                          {openActionMenu === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                              <button
                                onClick={() => { handleOpenModal(item); setOpenActionMenu(null); }}
                                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit size={13} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Folder size={40} className="text-gray-300" />
                        <p className="text-sm">No {getTitle().toLowerCase()}s found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-3 space-y-3">
            {paginatedData.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Folder size={40} className="text-gray-300" />
                  <p className="text-sm">No {getTitle().toLowerCase()}s found</p>
                </div>
              </div>
            ) : (
              paginatedData.map((item, idx) => {
                const serialNumber = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400 mt-1 flex-shrink-0" />
                      {showImageColumn && (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {(item.icon || item.logo) ? (
                            <img src={item.icon || item.logo} className="w-full h-full object-cover" alt={item.name} />
                          ) : (
                            <ImageIcon size={16} className="text-gray-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-gray-800 text-sm font-medium truncate">{item.name}</h3>
                            <p className="text-gray-500 text-xs mt-0.5">#{serialNumber}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-full ${
                              item.status === 'Active' 
                                ? 'bg-emerald-50 text-emerald-600' 
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {item.status === 'Active' ? 'Publish' : 'Inactive'}
                            </span>
                            <div className="relative">
                              <button
                                onClick={(e) => { e.stopPropagation(); setOpenActionMenu(openActionMenu === item.id ? null : item.id); }}
                                className="p-1 hover:bg-gray-100 rounded transition"
                              >
                                <MoreVertical size={16} className="text-gray-400" />
                              </button>
                              {openActionMenu === item.id && (
                                <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                  <button
                                    onClick={() => { handleOpenModal(item); setOpenActionMenu(null); }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit size={13} /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={13} /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Additional Info Row */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>Products: {item.productCount || 5}</span>
                          <span>Priority: {item.priority || 100}</span>
                        </div>
                        
                        {/* Parent Info for Sub/Child Categories */}
                        {view === 'catalog_subcategories' && (
                          <p className="text-gray-500 text-xs mt-1">
                            Parent: {categories.find(c => c.id === item.categoryId)?.name || 'Unknown'}
                          </p>
                        )}
                        {view === 'catalog_childcategories' && (
                          <p className="text-gray-500 text-xs mt-1">
                            Parent: {subCategories.find(s => s.id === item.subCategoryId)?.name || 'Unknown'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="px-3 sm:px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed order-2 sm:order-1"
              >
                <ArrowLeft size={14} /> Previous
              </button>

              <div className="flex items-center gap-1 order-1 sm:order-2 overflow-x-auto">
                {getPaginationNumbers().map((page, idx) => (
                  <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 px-2 text-xs sm:text-sm font-medium rounded-md transition ${
                      currentPage === page
                        ? 'bg-cyan-100 text-cyan-700'
                        : page === '...'
                        ? 'text-gray-400 cursor-default'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed order-3"
              >
                Next <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {editItem ? `Edit ${getTitle()}` : `Add New ${getTitle()}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${getTitle().toLowerCase()} name`}
                  className="w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Priority Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Priority</label>
                <input
                  type="number"
                  placeholder="100"
                  className="w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                  value={formData.priority || ''}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                />
              </div>

              {/* Parent Category (for SubCategory) */}
              {view === 'catalog_subcategories' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Parent Category</label>
                  <select
                    required
                    className="w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                    value={formData.categoryId || ''}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Parent SubCategory (for ChildCategory) */}
              {view === 'catalog_childcategories' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Parent Sub Category</label>
                  <select
                    required
                    className="w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                    value={formData.subCategoryId || ''}
                    onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                  >
                    <option value="">Select Sub Category</option>
                    {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Image Upload (for Categories & Brands) */}
              {showImageColumn && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">
                    {view === 'catalog_brands' ? 'Logo' : 'Icon/Image'}
                  </label>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-5 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition"
                  >
                    {(formData.icon || formData.logo) ? (
                      <img src={formData.icon || formData.logo} className="h-14 sm:h-16 mx-auto object-contain rounded-lg" alt="preview" />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center gap-1">
                        <Upload size={24} className="text-gray-300 sm:w-7 sm:h-7" />
                        <span className="text-xs sm:text-sm">Click to upload</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status Field */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5">Status</label>
                <select
                  className="w-full px-3 py-2 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent text-sm"
                  value={formData.status || 'Active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Publish</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 sm:py-2.5 bg-gradient-to-r from-cyan-400 to-cyan-500 text-white rounded-lg text-sm font-semibold hover:from-cyan-500 hover:to-cyan-600 transition"
                >
                  {editItem ? 'Update' : 'Add'} {getTitle()}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCatalog;
