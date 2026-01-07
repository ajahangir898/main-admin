
import React, { useState, useRef, useEffect } from 'react';
import { Search, FolderOpen, Upload, CheckCircle, Smartphone, Copy, Download, Check } from 'lucide-react';
import { GalleryItem } from '../types';
import { DataService } from '../services/DataService';
import { uploadImageToServer } from '../services/imageUploadService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { ImageGridSkeleton } from '../components/SkeletonLoaders';

const GALLERY_IMAGES: GalleryItem[] = [];

const AdminGallery: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
   const [images, setImages] = useState<GalleryItem[]>([]);
   const [isLoaded, setIsLoaded] = useState(false);
   const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyUrl = async (e: React.MouseEvent, imageUrl: string, id: number) => {
    e.stopPropagation();
    const fullUrl = normalizeImageUrl(imageUrl);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (e: React.MouseEvent, imageUrl: string, title: string) => {
    e.stopPropagation();
    const fullUrl = normalizeImageUrl(imageUrl);
    try {
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${blob.type.split('/')[1] || 'png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback: open in new tab
      window.open(fullUrl, '_blank');
    }
  };

   useEffect(() => {
      let mounted = true;
      const loadGallery = async () => {
         try {
            const stored = await DataService.get<GalleryItem[]>('gallery', GALLERY_IMAGES);
            if (mounted) {
               setImages(stored);
               setIsLoaded(true);
            }
         } catch (error) {
            console.warn('Failed to load gallery, using defaults', error);
            if (mounted) setIsLoaded(true);
         }
      };
      loadGallery();
      return () => { mounted = false; };
   }, []);

   useEffect(() => {
      if (!isLoaded) return;
      DataService.save('gallery', images);
   }, [images, isLoaded]);

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    img.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

   const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      try {
         // Upload to server instead of converting to base64
         const imageUrl = await uploadImageToServer(file, undefined, 'gallery');
         const newItem: GalleryItem = {
            id: Date.now(),
            title: file.name.split('.')[0],
            category: 'Uploads',
            imageUrl,
            dateAdded: new Date().toISOString()
         };
         setImages(prev => [newItem, ...prev]);
      } catch (error) {
         console.error('Failed to upload gallery image', error);
         alert('Unable to upload this image. Please try again.');
      } finally {
         if (input) input.value = '';
      }
   };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white z-10">
        <div className="flex items-center gap-3">
           <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
           {/* Logo or Placeholder */}
           <div className="flex items-center text-xl font-bold tracking-tighter">
                <span className="text-gray-800">GADGET</span>
                <span className="text-theme-primary">SHOB</span>
           </div>
        </div>

        <div className="flex-1 max-w-lg flex gap-3 w-full">
           <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search images. Ex: iPhone" 
                className="w-full pl-10 pr-4 py-2 border border-purple-100 bg-purple-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="absolute right-0 top-0 bottom-0 bg-purple-200 px-3 rounded-r-lg hover:bg-purple-300 transition flex items-center justify-center">
                 <Search size={18} className="text-purple-700" />
              </button>
           </div>
           
           <button className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-bold whitespace-nowrap">
              <FolderOpen size={18} /> Choose Folder
           </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
         {!isLoaded ? (
            <ImageGridSkeleton count={10} />
         ) : filteredImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
               {filteredImages.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => toggleSelection(item.id)}
                    className={`group relative bg-white rounded-lg overflow-hidden border shadow-sm cursor-pointer transition-all duration-200 ${
                        selectedIds.includes(item.id) 
                        ? 'border-purple-600 ring-2 ring-purple-500 ring-opacity-50' 
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                     <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden">
                        <img src={normalizeImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        
                        {/* Overlay on Hover */}
                        <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3 transition-opacity duration-200 ${selectedIds.includes(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                           {/* Action Buttons */}
                           <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleCopyUrl(e, item.imageUrl, item.id)}
                                className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition"
                                title="Copy image URL"
                              >
                                {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                {copiedId === item.id ? 'Copied!' : 'Copy URL'}
                              </button>
                              <button
                                onClick={(e) => handleDownload(e, item.imageUrl, item.title)}
                                className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition"
                                title="Download image"
                              >
                                <Download size={14} />
                                Download
                              </button>
                           </div>
                           
                           {/* Selection indicator */}
                           {selectedIds.includes(item.id) && (
                              <div className="bg-purple-600 text-white rounded-full p-2 shadow-lg">
                                 <CheckCircle size={24} />
                              </div>
                           )}
                        </div>
                     </div>
                     <div className="p-3">
                        <h4 className="font-bold text-gray-800 text-sm truncate" title={item.title}>{item.title}</h4>
                        <div className="flex justify-between items-center mt-1">
                           <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <Smartphone size={48} className="mb-4 opacity-20" />
               <p className="font-medium">No images found</p>
            </div>
         )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-100 bg-white flex justify-end items-center gap-4 z-20">
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleUpload} 
         />
         <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-bold transition uppercase tracking-wide text-sm border border-purple-200"
         >
            <Upload size={18} /> Upload New Images
         </button>
         
         <div className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium text-sm min-w-[120px] text-center">
            {selectedIds.length} Selected
         </div>
      </div>

    </div>
  );
};

export default AdminGallery;
