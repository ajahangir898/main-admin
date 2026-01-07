import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Search, 
  FolderOpen, 
  Upload, 
  CheckCircle, 
  Smartphone, 
  Copy, 
  Download, 
  Check,
  Trash2,
  FolderPlus,
  Edit3,
  RotateCcw,
  Clock,
  ChevronDown,
  X,
  MoreVertical,
  MoveRight,
  AlertTriangle
} from 'lucide-react';
import { GalleryItem } from '../types';
import { DataService } from '../services/DataService';
import { uploadImageToServer } from '../services/imageUploadService';
import { normalizeImageUrl } from '../utils/imageUrlHelper';
import { ImageGridSkeleton } from '../components/SkeletonLoaders';
import toast from 'react-hot-toast';
import { useTenant } from '../hooks/useTenant';

const GALLERY_IMAGES: GalleryItem[] = [];

interface GalleryFolder {
  name: string;
  path: string;
  createdAt: string;
}

interface TrashItem {
  originalUrl: string;
  trashPath: string;
  deletedAt: number;
  tenantId: string;
  folder: string | null;
  filename: string;
  expiresIn: number;
  expiresAt: number;
}

const AdminGallery: React.FC = () => {
  const { tenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Folder state
  const [folders, setFolders] = useState<GalleryFolder[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  
  // Trash state
  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  
  // Move modal state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingImages, setMovingImages] = useState<GalleryItem[]>([]);
  
  // Context menu
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folder: string } | null>(null);

  const apiBase = import.meta.env.VITE_API_BASE_URL || '';

  // Load folders
  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/upload/folders?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    }
  }, [tenantId, apiBase]);

  // Load trash
  const loadTrash = useCallback(async () => {
    setIsLoadingTrash(true);
    try {
      const res = await fetch(`${apiBase}/api/upload/trash?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.success) {
        setTrashItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to load trash:', err);
    } finally {
      setIsLoadingTrash(false);
    }
  }, [tenantId, apiBase]);

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

  // Delete image (move to trash)
  const handleDeleteImage = async (e: React.MouseEvent, image: GalleryItem) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${apiBase}/api/upload/trash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: image.imageUrl, tenantId })
      });
      const data = await res.json();
      
      if (data.success) {
        setImages(prev => prev.filter(img => img.id !== image.id));
        setSelectedIds(prev => prev.filter(id => id !== image.id));
        toast.success('Image moved to trash');
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete image');
    }
  };

  // Delete selected images
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    const toDelete = images.filter(img => selectedIds.includes(img.id));
    let successCount = 0;
    
    for (const img of toDelete) {
      try {
        const res = await fetch(`${apiBase}/api/upload/trash`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: img.imageUrl, tenantId })
        });
        const data = await res.json();
        if (data.success) successCount++;
      } catch (err) {
        console.error('Delete failed for:', img.imageUrl);
      }
    }
    
    if (successCount > 0) {
      setImages(prev => prev.filter(img => !selectedIds.includes(img.id)));
      setSelectedIds([]);
      toast.success(`${successCount} image(s) moved to trash`);
    }
  };

  // Restore from trash
  const handleRestore = async (item: TrashItem) => {
    try {
      const res = await fetch(`${apiBase}/api/upload/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trashPath: item.trashPath, tenantId })
      });
      const data = await res.json();
      
      if (data.success) {
        const restored: GalleryItem = {
          id: Date.now(),
          title: item.filename.split('.')[0],
          category: item.folder || 'Restored',
          imageUrl: data.imageUrl,
          dateAdded: new Date().toISOString()
        };
        setImages(prev => [restored, ...prev]);
        setTrashItems(prev => prev.filter(t => t.trashPath !== item.trashPath));
        toast.success('Image restored');
      } else {
        toast.error(data.error || 'Failed to restore');
      }
    } catch (err) {
      console.error('Restore failed:', err);
      toast.error('Failed to restore image');
    }
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, folderName: newFolderName.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => [...prev, data.folder]);
        setNewFolderName('');
        setShowCreateFolder(false);
        toast.success('Folder created');
      } else {
        toast.error(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Create folder failed:', err);
      toast.error('Failed to create folder');
    }
  };

  // Rename folder
  const handleRenameFolder = async (oldName: string) => {
    if (!editFolderName.trim() || editFolderName === oldName) {
      setEditingFolder(null);
      return;
    }
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, oldName, newName: editFolderName.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => prev.map(f => 
          f.name === oldName ? { ...f, name: editFolderName.trim() } : f
        ));
        setEditingFolder(null);
        toast.success('Folder renamed');
      } else {
        toast.error(data.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('Rename folder failed:', err);
      toast.error('Failed to rename folder');
    }
  };

  // Delete folder
  const handleDeleteFolder = async (folderName: string) => {
    if (!confirm(`Delete folder "${folderName}"? The folder must be empty.`)) return;
    
    try {
      const res = await fetch(`${apiBase}/api/upload/folders`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, folderName })
      });
      const data = await res.json();
      
      if (data.success) {
        setFolders(prev => prev.filter(f => f.name !== folderName));
        if (currentFolder === folderName) setCurrentFolder(null);
        setContextMenu(null);
        toast.success('Folder deleted');
      } else {
        toast.error(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Delete folder failed:', err);
      toast.error('Failed to delete folder');
    }
  };

  // Move images to folder
  const handleMoveToFolder = async (targetFolder: string | null) => {
    if (movingImages.length === 0) return;
    
    let successCount = 0;
    for (const img of movingImages) {
      try {
        const res = await fetch(`${apiBase}/api/upload/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageUrl: img.imageUrl, 
            targetFolder: targetFolder || 'root',
            tenantId 
          })
        });
        const data = await res.json();
        
        if (data.success) {
          setImages(prev => prev.map(i => 
            i.id === img.id ? { ...i, imageUrl: data.imageUrl, category: targetFolder || 'Gallery' } : i
          ));
          successCount++;
        }
      } catch (err) {
        console.error('Move failed:', err);
      }
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} image(s) moved`);
    }
    setShowMoveModal(false);
    setMovingImages([]);
    setSelectedIds([]);
  };

  // Open move modal for selected images
  const openMoveModal = () => {
    const toMove = images.filter(img => selectedIds.includes(img.id));
    if (toMove.length === 0) {
      toast.error('Select images to move');
      return;
    }
    setMovingImages(toMove);
    setShowMoveModal(true);
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

   useEffect(() => {
      let mounted = true;
      const loadGallery = async () => {
         if (!tenantId) return;
         try {
            // Use tenant-specific key for gallery storage
            const galleryKey = `gallery_${tenantId}`;
            const stored = await DataService.get<GalleryItem[]>(galleryKey, GALLERY_IMAGES);
            if (mounted) {
               setImages(stored);
               setIsLoaded(true);
            }
         } catch (error) {
            console.warn('Failed to load gallery, using defaults', error);
            if (mounted) setIsLoaded(true);
         }
      };
      // Reset state when tenant changes
      setImages([]);
      setIsLoaded(false);
      setSelectedIds([]);
      loadGallery();
      loadFolders();
      return () => { mounted = false; };
   }, [loadFolders, tenantId]);

   useEffect(() => {
      if (!isLoaded || !tenantId) return;
      // Use tenant-specific key for gallery storage
      const galleryKey = `gallery_${tenantId}`;
      DataService.save(galleryKey, images);
   }, [images, isLoaded, tenantId]);

  // Load trash when viewing
  useEffect(() => {
    if (showTrash) {
      loadTrash();
    }
  }, [showTrash, loadTrash]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const filteredImages = images.filter(img => {
    const matchesSearch = img.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      img.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = !currentFolder || img.category === currentFolder;
    return matchesSearch && matchesFolder;
  });

  const toggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const imageUrl = await uploadImageToServer(file, tenantId, 'gallery');
        const newItem: GalleryItem = {
          id: Date.now() + Math.random(),
          title: file.name.split('.')[0],
          category: currentFolder || 'Uploads',
          imageUrl,
          dateAdded: new Date().toISOString()
        };
        return newItem;
      } catch (error) {
        console.error('Failed to upload:', file.name, error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const uploaded = results.filter((r): r is GalleryItem => r !== null);
    
    if (uploaded.length > 0) {
      setImages(prev => [...uploaded, ...prev]);
      toast.success(`${uploaded.length} image(s) uploaded`);
    }
    
    if (input) input.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
          
          {/* Trash Toggle */}
          <button
            onClick={() => setShowTrash(!showTrash)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              showTrash 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Trash2 size={16} />
            Trash {trashItems.length > 0 && `(${trashItems.length})`}
          </button>
        </div>

        {!showTrash && (
          <div className="flex-1 max-w-lg flex gap-3 w-full">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search images..." 
                className="w-full pl-10 pr-4 py-2 border border-purple-100 bg-purple-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Folder Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowFolderDropdown(!showFolderDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-bold whitespace-nowrap"
              >
                <FolderOpen size={18} /> 
                {currentFolder || 'All Images'}
                <ChevronDown size={16} />
              </button>
              
              {showFolderDropdown && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="p-2 border-b border-gray-100">
                    <button
                      onClick={() => { setCurrentFolder(null); setShowFolderDropdown(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${!currentFolder ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'}`}
                    >
                      All Images
                    </button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto p-2">
                    {folders.map(folder => (
                      <div
                        key={folder.name}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer group ${
                          currentFolder === folder.name ? 'bg-purple-50 text-purple-700' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => { setCurrentFolder(folder.name); setShowFolderDropdown(false); }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, folder: folder.name });
                        }}
                      >
                        {editingFolder === folder.name ? (
                          <input
                            value={editFolderName}
                            onChange={(e) => setEditFolderName(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.name)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRenameFolder(folder.name)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                            autoFocus
                          />
                        ) : (
                          <>
                            <span className="flex items-center gap-2">
                              <FolderOpen size={16} />
                              {folder.name}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu({ x: e.clientX, y: e.clientY, folder: folder.name });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-2 border-t border-gray-100">
                    {showCreateFolder ? (
                      <div className="flex gap-2">
                        <input
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="Folder name"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                          autoFocus
                        />
                        <button
                          onClick={handleCreateFolder}
                          className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => { setShowCreateFolder(false); setNewFolderName(''); }}
                          className="px-3 py-2 bg-gray-200 rounded-lg text-sm"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowCreateFolder(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm"
                      >
                        <FolderPlus size={16} />
                        Create Folder
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Context Menu for Folders */}
      {contextMenu && (
        <div 
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-[100] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              setEditingFolder(contextMenu.folder);
              setEditFolderName(contextMenu.folder);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Edit3 size={14} /> Rename
          </button>
          <button
            onClick={() => handleDeleteFolder(contextMenu.folder)}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
        {showTrash ? (
          // Trash View
          isLoadingTrash ? (
            <ImageGridSkeleton count={6} />
          ) : trashItems.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertTriangle size={18} />
                <span className="text-sm">Items are permanently deleted after 24 hours</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {trashItems.map(item => (
                  <div 
                    key={item.trashPath}
                    className="group relative bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm"
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative overflow-hidden opacity-60">
                      <img 
                        src={normalizeImageUrl(item.trashPath)} 
                        alt={item.filename} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{item.filename}</h4>
                      <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                        <Clock size={12} />
                        Expires in {formatTimeRemaining(item.expiresIn)}
                      </div>
                      <button
                        onClick={() => handleRestore(item)}
                        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-200 transition"
                      >
                        <RotateCcw size={14} />
                        Restore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Trash2 size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Trash is empty</p>
            </div>
          )
        ) : (
          // Gallery View
          !isLoaded ? (
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
                      <div className="flex items-center gap-2 flex-wrap justify-center">
                        <button
                          onClick={(e) => handleCopyUrl(e, item.imageUrl, item.id)}
                          className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition"
                          title="Copy image URL"
                        >
                          {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          {copiedId === item.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={(e) => handleDownload(e, item.imageUrl, item.title)}
                          className="bg-white hover:bg-gray-100 text-gray-700 rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition"
                          title="Download image"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteImage(e, item)}
                          className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition"
                          title="Delete image"
                        >
                          <Trash2 size={14} />
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
          )
        )}
      </div>

      {/* Footer Actions */}
      {!showTrash && (
        <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center gap-4 z-20">
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <>
                <button 
                  onClick={openMoveModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition text-sm"
                >
                  <MoveRight size={16} /> Move to Folder
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition text-sm"
                >
                  <Trash2 size={16} /> Delete Selected
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-bold transition uppercase tracking-wide text-sm border border-purple-200"
            >
              <Upload size={18} /> Upload Images
            </button>
            
            <div className="px-6 py-3 border border-purple-600 text-purple-600 rounded-lg font-medium text-sm min-w-[120px] text-center">
              {selectedIds.length} Selected
            </div>
          </div>
        </div>
      )}

      {/* Move to Folder Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Move {movingImages.length} image(s) to folder</h3>
              <button onClick={() => setShowMoveModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleMoveToFolder(null)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg text-left"
              >
                <FolderOpen size={20} className="text-gray-400" />
                <span>Gallery Root</span>
              </button>
              
              {folders.map(folder => (
                <button
                  key={folder.name}
                  onClick={() => handleMoveToFolder(folder.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg text-left"
                >
                  <FolderOpen size={20} className="text-purple-500" />
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => setShowMoveModal(false)}
                className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
