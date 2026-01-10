import React, { useRef, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, ImageIcon as ImageIconLucide, Upload, ChevronLeft, ChevronRight, Loader2, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { CarouselItem } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { GalleryPicker } from '../GalleryPicker';
import {
  convertCarouselImage,
  dataUrlToFile,
  CAROUSEL_WIDTH,
  CAROUSEL_HEIGHT,
  CAROUSEL_MOBILE_WIDTH,
  CAROUSEL_MOBILE_HEIGHT
} from '../../services/imageUtils';
import { uploadPreparedImageToServer, isBase64Image, convertBase64ToUploadedUrl } from '../../services/imageUploadService';

type CarouselFilterStatus = 'All' | 'Publish' | 'Draft' | 'Trash';

interface CarouselTabProps {
  tenantId: string;
  carouselItems: CarouselItem[];
  onSaveCarousel: (items: CarouselItem[]) => Promise<void>;
}

export const CarouselTab: React.FC<CarouselTabProps> = ({ tenantId, carouselItems, onSaveCarousel }) => {
  const [filterStatus, setFilterStatus] = useState<CarouselFilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCarousel, setEditingCarousel] = useState<CarouselItem | null>(null);
  const [formData, setFormData] = useState<Partial<CarouselItem>>({
    name: '',
    image: '',
    mobileImage: '',
    url: '',
    urlType: 'Internal',
    serial: 1,
    status: 'Publish'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'desktop' | 'mobile' | null>(null);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'desktop' | 'mobile'
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Max 2MB.');
      event.target.value = '';
      return;
    }

    try {
      const convertedImage = type === 'desktop'
        ? await convertCarouselImage(file, { quality: 0.85 })
        : await convertCarouselImage(file, {
            width: CAROUSEL_MOBILE_WIDTH,
            height: CAROUSEL_MOBILE_HEIGHT,
            quality: 0.85
          });

      const webpFile = dataUrlToFile(
        convertedImage,
        `${type === 'mobile' ? 'carousel-mobile' : 'carousel'}-${Date.now()}.webp`
      );
      const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'carousel');
      
      setFormData((prev) =>
        type === 'desktop'
          ? { ...prev, image: uploadedUrl }
          : { ...prev, mobileImage: uploadedUrl }
      );
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      event.target.value = '';
    }
  };

  const openModal = (item?: CarouselItem): void => {
    if (item) {
      setEditingCarousel(item);
      setFormData({ ...item });
    } else {
      setEditingCarousel(null);
      setFormData({
        name: '',
        image: '',
        mobileImage: '',
        url: '',
        urlType: 'Internal',
        serial: carouselItems.length + 1,
        status: 'Publish'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (isSaving || !formData.image) {
      if (!formData.image) {
        toast.error('Upload desktop banner.');
      }
      return;
    }

    setIsSaving(true);
    const startTime = Date.now();

    try {
      let desktopImage = formData.image || '';
      let mobileImage = formData.mobileImage || '';

      if (isBase64Image(desktopImage)) {
        toast.loading('Uploading desktop image...', { id: 'carousel-upload' });
        desktopImage = await convertBase64ToUploadedUrl(desktopImage, tenantId, 'carousel');
        toast.dismiss('carousel-upload');
      }

      if (mobileImage && isBase64Image(mobileImage)) {
        toast.loading('Uploading mobile image...', { id: 'carousel-mobile-upload' });
        mobileImage = await convertBase64ToUploadedUrl(mobileImage, tenantId, 'carousel');
        toast.dismiss('carousel-mobile-upload');
      }

      const carouselItem: CarouselItem = {
        id: editingCarousel?.id || Date.now().toString(),
        name: formData.name || 'Untitled',
        image: desktopImage,
        mobileImage: mobileImage,
        url: formData.url || '#',
        urlType: (formData.urlType as 'Internal' | 'External') || 'Internal',
        serial: Number(formData.serial),
        status: (formData.status as 'Publish' | 'Draft') || 'Publish'
      };

      const updatedItems = editingCarousel
        ? carouselItems.map((item) => (item.id === editingCarousel.id ? carouselItem : item))
        : [...carouselItems, carouselItem];

      toast.loading('Saving carousel...', { id: 'carousel-save' });
      await onSaveCarousel(updatedItems);

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss('carousel-save');
      toast.success(editingCarousel ? 'Carousel updated!' : 'Carousel added!');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Carousel save failed:', error);
      toast.error('Failed to save carousel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (carouselId: string): Promise<void> => {
    if (confirm('Delete carousel?')) {
      const loadingToast = toast.loading('Deleting carousel...');
      try {
        const updatedItems = carouselItems.filter((item) => item.id !== carouselId);
        await onSaveCarousel(updatedItems);
        toast.dismiss(loadingToast);
        toast.success('Carousel deleted!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete carousel');
      }
    }
  };

  const openGalleryPicker = (target: 'desktop' | 'mobile') => {
    setGalleryTarget(target);
    setIsGalleryPickerOpen(true);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'desktop') {
      setFormData(p => ({ ...p, image: imageUrl }));
    } else if (galleryTarget === 'mobile') {
      setFormData(p => ({ ...p, mobileImage: imageUrl }));
    }
  };

  const filteredItems = carouselItems.filter(
    (item) =>
      (filterStatus === 'All' || item.status === filterStatus) &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['All', 'Publish', 'Draft', 'Trash'] as CarouselFilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status === 'All' ? 'All Data' : status}
              {status === 'All' && (
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">
                  {carouselItems.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:ring-1 focus:ring-green-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          <button
            onClick={() => openModal()}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
          >
            <Plus size={16} />
            Add Carousel
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-green-50 text-gray-700 font-semibold text-xs uppercase border-b">
            <tr>
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Url</th>
              <th className="px-4 py-3">Url Type</th>
              <th className="px-4 py-3">Serial</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 group">
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="w-16 h-10 bg-gray-100 rounded border overflow-hidden">
                    {item.image ? (
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIconLucide size={16} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{item.url}</td>
                <td className="px-4 py-3 text-gray-500">{item.urlType}</td>
                <td className="px-4 py-3 font-mono">{item.serial}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === 'Publish'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <ImageIconLucide size={32} className="mx-auto mb-2 opacity-50" />
                  No carousel items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center gap-2">
        <span className="text-sm text-gray-600">1 of 1</span>
        <div className="flex border rounded-lg overflow-hidden">
          <button disabled className="px-2 py-1 bg-gray-50 text-gray-400 border-r">
            <ChevronLeft size={16} />
          </button>
          <button disabled className="px-2 py-1 bg-gray-50 text-gray-400">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center sticky top-0">
              <h3 className="font-bold text-gray-800">
                {editingCarousel ? 'Edit Carousel' : 'Add New Carousel'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desktop Banner*</label>
                <p className="text-xs text-gray-500 mb-2">
                  {CAROUSEL_WIDTH}×{CAROUSEL_HEIGHT}px. Auto WebP.
                </p>
                <input
                  type="file"
                  ref={desktopInputRef}
                  onChange={(e) => handleImageUpload(e, 'desktop')}
                  className="hidden"
                  accept="image/*"
                />
                <div className="flex gap-2">
                  <div
                    onClick={() => desktopInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed rounded-lg p-2 text-center cursor-pointer hover:bg-gray-50 h-28"
                  >
                    {formData.image ? (
                      <img
                        src={normalizeImageUrl(formData.image)}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="text-gray-400 flex flex-col items-center justify-center h-full">
                        <Upload size={32} className="mb-2" />
                        <p className="text-sm">Upload</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openGalleryPicker('desktop')}
                    className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <FolderOpen size={24} className="mb-1" />
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Banner</label>
                <p className="text-xs text-gray-500 mb-2">
                  {CAROUSEL_MOBILE_WIDTH}×{CAROUSEL_MOBILE_HEIGHT}px. Auto WebP.
                </p>
                <input
                  type="file"
                  ref={mobileInputRef}
                  onChange={(e) => handleImageUpload(e, 'mobile')}
                  className="hidden"
                  accept="image/*"
                />
                <div className="flex gap-2">
                  <div
                    onClick={() => mobileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-blue-300 rounded-lg p-2 text-center cursor-pointer hover:bg-blue-50 h-28"
                  >
                    {formData.mobileImage ? (
                      <div className="relative w-full h-full">
                        <img
                          src={normalizeImageUrl(formData.mobileImage)}
                          alt=""
                          className="w-full h-full object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData((p) => ({ ...p, mobileImage: '' }));
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="text-blue-400 flex flex-col items-center justify-center h-full">
                        <Upload size={32} className="mb-2" />
                        <p className="text-sm">Upload</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openGalleryPicker('mobile')}
                    className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <FolderOpen size={24} className="mb-1" />
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.serial}
                    onChange={(e) => setFormData({ ...formData, serial: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Url</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Url Type</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.urlType}
                    onChange={(e) => setFormData({ ...formData, urlType: e.target.value as any })}
                  >
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Publish">Publish</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-60 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Carousel'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GalleryPicker
        isOpen={isGalleryPickerOpen}
        onClose={() => {
          setIsGalleryPickerOpen(false);
          setGalleryTarget(null);
        }}
        onSelect={handleGallerySelect}
        title={`Choose ${galleryTarget === 'desktop' ? 'Desktop Banner' : 'Mobile Banner'} from Gallery`}
      />
    </div>
  );
};
