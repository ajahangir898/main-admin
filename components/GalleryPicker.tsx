import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Check, FolderOpen } from 'lucide-react';
import { GalleryItem } from '../types';
import { DataService } from '../services/DataService';

// No default gallery images - users upload their own
const DEFAULT_GALLERY_IMAGES: GalleryItem[] = [];
import { normalizeImageUrl } from '../utils/imageUrlHelper';

interface GalleryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  multiple?: boolean;
  onSelectMultiple?: (imageUrls: string[]) => void;
  title?: string;
}

export const GalleryPicker: React.FC<GalleryPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  onSelectMultiple,
  title = 'Choose from Gallery'
}) => {
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    if (!isOpen) return;
    
    const loadGallery = async () => {
      setIsLoading(true);
      try {
        const stored = await DataService.get<GalleryItem[]>('gallery', DEFAULT_GALLERY_IMAGES);
        setImages(stored);
      } catch (error) {
        console.warn('Failed to load gallery:', error);
        setImages(DEFAULT_GALLERY_IMAGES);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadGallery();
    setSelectedUrls([]);
    setSearchTerm('');
  }, [isOpen]);

  if (!isOpen) return null;

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(images.map(img => img.category)))];

  // Filter images
  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         img.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || img.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImageClick = (imageUrl: string) => {
    const normalizedUrl = normalizeImageUrl(imageUrl);
    if (multiple) {
      setSelectedUrls(prev => 
        prev.includes(normalizedUrl) 
          ? prev.filter(url => url !== normalizedUrl)
          : [...prev, normalizedUrl]
      );
    } else {
      onSelect(normalizedUrl);
      onClose();
    }
  };

  const handleConfirm = () => {
    if (multiple && onSelectMultiple) {
      onSelectMultiple(selectedUrls.map(url => normalizeImageUrl(url)));
    } else if (selectedUrls.length === 1) {
      onSelect(normalizeImageUrl(selectedUrls[0]));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ImageIcon size={20} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">{images.length} images available</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  activeCategory === cat
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <FolderOpen size={48} className="mb-3 opacity-50" />
              <p className="font-medium">No images found</p>
              <p className="text-sm">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredImages.map(img => {
                const isSelected = selectedUrls.includes(img.imageUrl);
                return (
                  <div
                    key={img.id}
                    onClick={() => handleImageClick(img.imageUrl)}
                    className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border-2 ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-500/30 scale-[0.98]'
                        : 'border-transparent hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(img.imageUrl)}
                      alt={img.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Overlay */}
                    <div className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                    }`} />
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white rounded-full p-1.5 shadow-lg">
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                    
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-xs font-medium truncate">{img.title}</p>
                      <p className="text-white/70 text-[10px]">{img.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {multiple ? `${selectedUrls.length} image(s) selected` : 'Click an image to select'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium text-sm"
            >
              Cancel
            </button>
            {multiple && (
              <button
                onClick={handleConfirm}
                disabled={selectedUrls.length === 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check size={16} />
                Add {selectedUrls.length > 0 ? `(${selectedUrls.length})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryPicker;
