import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, AlertCircle, MessageSquare, Lightbulb, Filter,
  Calendar, User as UserIcon, MoreVertical, Send, Image as ImageIcon,
  Trash2, Edit2, CheckCircle, Clock, Loader2
} from 'lucide-react';
import { User, Tenant } from '../types';
import { getAuthHeader } from '../services/authService';
import { toast } from 'react-hot-toast';
import RichTextEditor from '../components/RichTextEditor';

// Types
type TicketType = 'issue' | 'feedback' | 'feature';
type TicketStatus = 'pending' | 'in-progress' | 'resolved' | 'closed';

interface SupportTicket {
  id: string;
  tenantId: string;
  type: TicketType;
  title: string;
  description: string;
  images: string[];
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submittedBy: {
    userId: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    userId: string;
    name: string;
    email: string;
  };
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface AdminSupportProps {
  user: User | null;
  activeTenant?: Tenant | null;
}

// API URL helper
const getApiUrl = (): string => {
  if (typeof window === 'undefined') return 'https://systemnextit.com/api';
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  const parts = hostname.split('.');
  const mainDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
  return `${window.location.protocol}//${mainDomain}/api`;
};

const API_URL = getApiUrl();

const AdminSupport: React.FC<AdminSupportProps> = ({ user, activeTenant }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | TicketType>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formType, setFormType] = useState<TicketType>('issue');
  const [formDescription, setFormDescription] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }
      if (activeTenant?.id) {
        params.append('tenantId', activeTenant.id);
      }

      const response = await fetch(`${API_URL}/support?${params.toString()}`, {
        headers: getAuthHeader()
      });

      if (!response.ok) throw new Error('Failed to fetch tickets');

      const data = await response.json();
      setTickets(data.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setIsLoading(false);
    }
  }, [filter, activeTenant?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle form submission
  const handleSubmit = async () => {
    if (!formDescription.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${API_URL}/support`, {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: formType,
          description: formDescription,
          images: formImages,
          userName: user?.name,
          tenantId: activeTenant?.id
        })
      });

      if (!response.ok) throw new Error('Failed to create ticket');

      toast.success('Support ticket submitted successfully');
      setShowForm(false);
      resetForm();
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Failed to submit support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormType('issue');
    setFormDescription('');
    setFormImages([]);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formImages.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    setImageUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file: File) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_URL.replace('/api', '')}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader()['Authorization'] || ''
          },
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.url || data.path;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setFormImages(prev => [...prev, ...uploadedUrls.filter(Boolean)]);
      toast.success('Images uploaded');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setImageUploading(false);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== index));
  };

  // Update ticket status
  const updateTicketStatus = async (ticketId: string, status: TicketStatus) => {
    try {
      const response = await fetch(`${API_URL}/support/${ticketId}`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update ticket');

      toast.success('Ticket status updated');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  // Delete ticket
  const deleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      const response = await fetch(`${API_URL}/support/${ticketId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (!response.ok) throw new Error('Failed to delete ticket');

      toast.success('Ticket deleted');
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get type icon
  const getTypeIcon = (type: TicketType) => {
    switch (type) {
      case 'issue':
        return <AlertCircle className="w-4 h-4" />;
      case 'feedback':
        return <MessageSquare className="w-4 h-4" />;
      case 'feature':
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-500';
      case 'in-progress':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
    }
  };

  // Get type color
  const getTypeColor = (type: TicketType) => {
    switch (type) {
      case 'issue':
        return 'bg-red-500';
      case 'feedback':
        return 'bg-blue-500';
      case 'feature':
        return 'bg-purple-500';
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Support</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition font-medium"
        >
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'issue', 'feedback', 'feature'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              filter === type
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No support tickets found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Type and Status badges */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(ticket.type)}`}>
                      {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(ticket.status)}`}>
                      {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(ticket.createdAt)}
                  </div>

                  {/* Assigned to */}
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <span className="text-gray-500">Assigned To:</span>
                    {ticket.assignedTo ? (
                      <span className="text-gray-700 font-medium">{ticket.assignedTo.name}</span>
                    ) : (
                      <span className="text-orange-500 font-medium">Not Assign Yet!</span>
                    )}
                  </div>

                  {/* Description preview */}
                  <div 
                    className="text-sm text-gray-700 line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: ticket.description.replace(/<[^>]+>/g, ' ').slice(0, 150) + '...' 
                    }}
                  />
                </div>

                {/* Actions menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Toggle dropdown or show options
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create ticket modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Create Support Ticket</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  <X className="w-4 h-4" />
                  Discard
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Submit Data
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Type selection */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { type: 'issue' as TicketType, title: 'Website Issue', desc: 'Report a problem you faced' },
                  { type: 'feedback' as TicketType, title: 'Website Feedback', desc: 'Share your experience' },
                  { type: 'feature' as TicketType, title: 'Custom Feature', desc: 'Request a new feature' }
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setFormType(item.type)}
                    className={`relative p-4 rounded-xl border-2 text-left transition ${
                      formType === item.type
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {formType === item.type && (
                      <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-800 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </button>
                ))}
              </div>

              {/* Image upload */}
              <div className="mb-6">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition">
                    <ImageIcon className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium text-gray-700">Upload Image</p>
                    <p className="text-sm text-green-500">Please select up to 3 images, you can select or upload a new image from the gallery</p>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={imageUploading || formImages.length >= 3}
                    />
                  </div>
                </label>

                {/* Uploaded images preview */}
                {formImages.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageUploading && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>

              {/* Rich text editor */}
              <div>
                <RichTextEditor
                  value={formDescription}
                  onChange={setFormDescription}
                  placeholder="Describe your issue, feedback, or feature request..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket detail modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Ticket Details</h2>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Type and Status */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getTypeColor(selectedTicket.type)}`}>
                  {selectedTicket.type.charAt(0).toUpperCase() + selectedTicket.type.slice(1)}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status.charAt(0).toUpperCase() + selectedTicket.status.slice(1).replace('-', ' ')}
                </span>
              </div>

              {/* Meta info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Created: {formatDate(selectedTicket.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Submitted by: {selectedTicket.submittedBy.name} ({selectedTicket.submittedBy.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Assigned to: {selectedTicket.assignedTo ? `${selectedTicket.assignedTo.name}` : <span className="text-orange-500">Not assigned</span>}
                  </span>
                </div>
              </div>

              {/* Images */}
              {selectedTicket.images && selectedTicket.images.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Attachments:</p>
                  <div className="flex gap-2">
                    {selectedTicket.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={img}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 h-24 rounded-lg overflow-hidden border"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Description:</p>
                <div 
                  className="prose prose-sm max-w-none text-gray-600 bg-gray-50 rounded-lg p-4"
                  dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
                />
              </div>

              {/* Status actions */}
              {(user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'tenant_admin') && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Update Status:</p>
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'in-progress', 'resolved', 'closed'] as TicketStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => updateTicketStatus(selectedTicket.id, status)}
                        disabled={selectedTicket.status === status}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                          selectedTicket.status === status
                            ? `${getStatusColor(status)} text-white`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => deleteTicket(selectedTicket.id)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Ticket
                  </button>
                </div>
              )}

              {/* Comments section */}
              {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Comments:</p>
                  <div className="space-y-3">
                    {selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <span className="font-medium text-gray-700">{comment.userName}</span>
                          <span>•</span>
                          <span>{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupport;
