import React, { useRef, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { Popup } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { convertFileToWebP } from '../../services/imageUtils';
import { GalleryPicker } from '../GalleryPicker';

type PopupFilterStatus = 'All' | 'Publish' | 'Draft';

interface PopupTabProps {
  popups: Popup[];
  onSavePopups: (popups: Popup[]) => Promise<void>;
}

export const PopupTab: React.FC<PopupTabProps> = ({ popups, onSavePopups }) => {
  const [filterStatus, setFilterStatus] = useState<PopupFilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPopup, setEditingPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState<Partial<Popup>>({
    name: '',
    image: '',
    url: '',
    urlType: 'Internal',
    priority: 0,
    status: 'Draft'
  });
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const convertedImage = await convertFileToWebP(file, {
        quality: 0.85,
        maxDimension: 800
      });
      setFormData((prev) => ({ ...prev, image: convertedImage }));
    } catch (err) {
      console.error('Failed to upload image:', err);
      alert('Failed to process image.');
    } finally {
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const openModal = (popup?: Popup): void => {
    if (popup) {
      setEditingPopup(popup);
      setFormData(popup);
    } else {
      setEditingPopup(null);
      setFormData({
        name: '',
        image: '',
        url: '',
        urlType: 'Internal',
        priority: 0,
        status: 'Draft'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!formData.name || !formData.image) {
      toast.error('Please fill all required fields');
      return;
    }

    const loadingToast = toast.loading('Saving popup...');
    const startTime = Date.now();

    try {
      const popup: Popup = {
        id: editingPopup?.id || Date.now(),
        name: formData.name,
        image: formData.image,
        url: formData.url || '',
        urlType: formData.urlType as 'Internal' | 'External',
        priority: Number(formData.priority),
        status: formData.status as 'Draft' | 'Publish',
        createdAt: editingPopup?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPopups = editingPopup
        ? popups.map((item) => (item.id === editingPopup.id ? popup : item))
        : [...popups, popup];

      await onSavePopups(updatedPopups);

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success(editingPopup ? 'Popup updated!' : 'Popup added!');
      setIsModalOpen(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Popup save failed:', error);
      toast.error('Failed to save popup');
    }
  };

  const handleDelete = async (popupId: number): Promise<void> => {
    if (confirm('Delete popup?')) {
      const loadingToast = toast.loading('Deleting popup...');
      try {
        const updatedPopups = popups.filter((item) => item.id !== popupId);
        await onSavePopups(updatedPopups);
        toast.dismiss(loadingToast);
        toast.success('Popup deleted!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete popup');
      }
    }
  };

  const handleToggleStatus = async (popup: Popup): Promise<void> => {
    const loadingToast = toast.loading('Updating status...');
    try {
      const updatedPopups = popups.map((item) =>
        item.id === popup.id
          ? {
              ...item,
              status: item.status === 'Draft' ? 'Publish' : 'Draft',
              updatedAt: new Date().toISOString()
            }
          : item
      );
      await onSavePopups(updatedPopups);
      toast.dismiss(loadingToast);
      toast.success('Status updated!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to update status');
    }
  };

  const filteredPopups = popups.filter(
    (popup) =>
      (filterStatus === 'All' || popup.status === filterStatus) &&
      popup.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['All', 'Publish', 'Draft'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s as any)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                filterStatus === s
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'All' ? 'All Data' : s}
              {s === 'All' && (
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">{popups.length}</span>
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
            Add Popup
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPopups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No popups found
                </td>
              </tr>
            ) : (
              filteredPopups.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <img
                      src={normalizeImageUrl(p.image)}
                      alt={p.name}
                      className="h-12 w-16 object-cover rounded border"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 truncate max-w-xs">
                    {p.url || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{p.priority || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        p.status === 'Publish'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openModal(p)}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">
                {editingPopup ? 'Edit Popup' : 'Add New Popup'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Popup Image*</label>
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                />
                <div className="flex gap-2">
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                  >
                    {formData.image ? (
                      <img
                        src={normalizeImageUrl(formData.image)}
                        alt=""
                        className="h-28 mx-auto object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">
                        <Upload size={32} className="mx-auto mb-2" />
                        <p className="text-sm">Upload</p>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGalleryPickerOpen(true)}
                    className="w-24 border-2 border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-indigo-600 hover:bg-indigo-50 transition"
                  >
                    <FolderOpen size={24} className="mb-1" />
                    <span className="text-xs font-medium">Gallery</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Type</label>
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
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700"
                >
                  Save Popup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GalleryPicker
        isOpen={isGalleryPickerOpen}
        onClose={() => setIsGalleryPickerOpen(false)}
        onSelect={(imageUrl) => setFormData((p) => ({ ...p, image: imageUrl }))}
        title="Choose Popup Image from Gallery"
      />
    </div>
  );
};
