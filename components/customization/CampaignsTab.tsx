import React, { useRef, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, CalendarDays, ImageIcon as ImageIconLucide } from 'lucide-react';
import toast from 'react-hot-toast';
import { Campaign } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrlHelper';
import { convertFileToWebP, dataUrlToFile } from '../../services/imageUtils';
import { uploadPreparedImageToServer } from '../../services/imageUploadService';

type CampaignFilterStatus = 'All' | 'Publish' | 'Draft';

interface CampaignsTabProps {
  tenantId: string;
  campaigns: Campaign[];
  onSaveCampaigns: (campaigns: Campaign[]) => Promise<void>;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({ tenantId, campaigns, onSaveCampaigns }) => {
  const [filterStatus, setFilterStatus] = useState<CampaignFilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    logo: '',
    startDate: '',
    endDate: '',
    url: '',
    serial: 1,
    status: 'Publish'
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const convertedImage = await convertFileToWebP(file, {
        quality: 0.85,
        maxDimension: 400
      });
      const webpFile = dataUrlToFile(convertedImage, `campaign-${Date.now()}.webp`);
      const uploadedUrl = await uploadPreparedImageToServer(webpFile, tenantId, 'carousel');
      setFormData((prev) => ({ ...prev, logo: uploadedUrl }));
    } catch {
      toast.error('Upload failed.');
    }

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const openModal = (campaign?: Campaign): void => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData({ ...campaign });
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        logo: '',
        startDate: '',
        endDate: '',
        url: '',
        serial: campaigns.length + 1,
        status: 'Publish'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    const loadingToast = toast.loading('Saving campaign...');
    const startTime = Date.now();

    try {
      const campaign: Campaign = {
        id: editingCampaign?.id || Date.now().toString(),
        name: formData.name || 'Untitled',
        logo: formData.logo || '',
        startDate: formData.startDate || new Date().toISOString(),
        endDate: formData.endDate || new Date().toISOString(),
        url: formData.url || '#',
        serial: Number(formData.serial),
        status: formData.status as 'Publish' | 'Draft'
      };

      const updatedCampaigns = editingCampaign
        ? campaigns.map((item) => (item.id === editingCampaign.id ? campaign : item))
        : [...campaigns, campaign];

      await onSaveCampaigns(updatedCampaigns);

      const elapsed = Date.now() - startTime;
      if (elapsed < 1000) {
        await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
      }

      toast.dismiss(loadingToast);
      toast.success(editingCampaign ? 'Campaign updated!' : 'Campaign added!');
      setIsModalOpen(false);
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Campaign save failed:', error);
      toast.error('Failed to save campaign.');
    }
  };

  const handleDelete = async (campaignId: string): Promise<void> => {
    if (confirm('Delete campaign?')) {
      const loadingToast = toast.loading('Deleting campaign...');
      try {
        const updatedCampaigns = campaigns.filter((item) => item.id !== campaignId);
        await onSaveCampaigns(updatedCampaigns);
        toast.dismiss(loadingToast);
        toast.success('Campaign deleted!');
      } catch (error) {
        toast.dismiss(loadingToast);
        toast.error('Failed to delete campaign');
      }
    }
  };

  const filteredCampaigns = campaigns.filter(
    (campaign) =>
      (filterStatus === 'All' || campaign.status === filterStatus) &&
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['All', 'Publish', 'Draft'] as CampaignFilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                filterStatus === status
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status === 'All' ? 'All Campaigns' : status}
              {status === 'All' && (
                <span className="ml-1 text-xs bg-gray-200 px-1.5 rounded-full">
                  {campaigns.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns..."
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold"
          >
            <Plus size={18} />
            Add Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="bg-white border rounded-xl overflow-hidden hover:shadow-lg group"
          >
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {campaign.logo ? (
                  <img
                    src={normalizeImageUrl(campaign.logo)}
                    alt={campaign.name}
                    className="w-16 h-10 object-contain rounded"
                  />
                ) : (
                  <div className="w-16 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <CalendarDays className="text-gray-400" size={20} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{campaign.name}</h4>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      campaign.status === 'Publish'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Starts: {new Date(campaign.startDate).toLocaleDateString()}</p>
                <p>Ends: {new Date(campaign.endDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex border-t divide-x">
              <button
                onClick={() => openModal(campaign)}
                className="flex-1 px-4 py-2 text-blue-600 hover:bg-blue-50 font-medium flex items-center justify-center gap-1"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(campaign.id)}
                className="flex-1 px-4 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center justify-center gap-1"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredCampaigns.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
            <p>No campaigns found.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold">
                {editingCampaign ? 'Edit Campaign' : 'Add New Campaign'}
              </h3>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Logo</label>
                <div className="flex items-center gap-4">
                  {formData.logo ? (
                    <img
                      src={normalizeImageUrl(formData.logo)}
                      alt="Logo"
                      className="w-20 h-12 object-contain border rounded"
                    />
                  ) : (
                    <div className="w-20 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIconLucide className="text-gray-400" size={24} />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Upload Logo
                  </button>
                  {formData.logo && (
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, logo: '' }))}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, startDate: new Date(e.target.value).toISOString() }))
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate?.slice(0, 16) || ''}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, endDate: new Date(e.target.value).toISOString() }))
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input
                  type="text"
                  value={formData.url || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="https://..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={formData.serial || 1}
                    onChange={(e) => setFormData((p) => ({ ...p, serial: parseInt(e.target.value) }))}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'Publish'}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, status: e.target.value as 'Publish' | 'Draft' }))
                    }
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Publish">Publish</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  {editingCampaign ? 'Update' : 'Create'} Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
