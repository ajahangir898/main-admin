import React, { useState } from 'react';
import {
  LifeBuoy, Bug, Lightbulb, CreditCard, Wrench, HelpCircle,
  Filter, Search, Plus, MessageSquare, Clock, CheckCircle2,
  AlertCircle, User, Building2, ChevronDown, ChevronUp, Send,
  Paperclip, X, Tag, Calendar, UserCheck
} from 'lucide-react';
import { SupportTicket, TicketMessage } from './types';
import { Tenant } from '../../types';

interface SupportTicketsTabProps {
  tickets: SupportTicket[];
  tenants: Tenant[];
  onCreateTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => Promise<void>;
  onUpdateTicket: (id: string, updates: Partial<SupportTicket>) => Promise<void>;
  onReplyTicket: (ticketId: string, message: Omit<TicketMessage, 'id' | 'createdAt'>) => Promise<void>;
  onCloseTicket: (id: string) => Promise<void>;
}

const categoryConfig = {
  bug: { label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-700 border-red-200' },
  feature_request: { label: 'Feature Request', icon: Lightbulb, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  billing: { label: 'Billing', icon: CreditCard, color: 'bg-green-100 text-green-700 border-green-200' },
  technical: { label: 'Technical', icon: Wrench, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  general: { label: 'General', icon: HelpCircle, color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-red-100 text-red-600' }
};

const statusConfig = {
  open: { label: 'Open', color: 'bg-blue-100 text-blue-600', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-600', icon: Clock },
  waiting_response: { label: 'Waiting Response', color: 'bg-purple-100 text-purple-600', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-600', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 }
};

const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({
  tickets,
  tenants,
  onUpdateTicket,
  onReplyTicket,
  onCloseTicket
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.tenantName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReplyTicket(selectedTicket.id, {
        senderId: 'superadmin',
        senderName: 'Support Team',
        senderType: 'support',
        message: replyMessage
      });
      setReplyMessage('');
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await onUpdateTicket(ticketId, { status });
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status } : null);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleAssign = async (ticketId: string, assignedTo: string) => {
    try {
      await onUpdateTicket(ticketId, { assignedTo, status: 'in_progress' });
    } catch (error) {
      console.error('Failed to assign ticket:', error);
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    waiting: tickets.filter(t => t.status === 'waiting_response').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length
  };

  return (
    <div className="p-6 flex gap-6 h-[calc(100vh-64px)]">
      {/* Left Panel - Ticket List */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-emerald-500" />
            Support Tickets
          </h2>
          <p className="text-slate-600 mt-1">Manage merchant support requests and feature requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg p-3 border border-slate-200 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
            <p className="text-xs text-blue-600">Open</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-xs text-yellow-600">In Progress</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.waiting}</p>
            <p className="text-xs text-purple-600">Waiting</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            <p className="text-xs text-green-600">Resolved</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
            <p className="text-xs text-red-600">Urgent</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_response">Waiting Response</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Categories</option>
            <option value="bug">Bug Reports</option>
            <option value="feature_request">Feature Requests</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Ticket List */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <LifeBuoy className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No tickets found</h3>
              <p className="text-slate-500">No support tickets match your filters</p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[calc(100vh-380px)]">
              {filteredTickets.map(ticket => {
                const category = categoryConfig[ticket.category];
                const priority = priorityConfig[ticket.priority];
                const status = statusConfig[ticket.status];
                const StatusIcon = status.icon;
                
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id ? 'bg-emerald-50 border-l-4 border-l-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${category.color}`}>
                        <category.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${priority.color}`}>
                            {priority.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 truncate">{ticket.subject}</h4>
                        <p className="text-sm text-slate-600 line-clamp-1">{ticket.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {ticket.tenantName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {ticket.createdAt}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.messages.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Ticket Detail */}
      {selectedTicket ? (
        <div className="w-[450px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          {/* Ticket Header */}
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full border ${categoryConfig[selectedTicket.category].color}`}>
                    {categoryConfig[selectedTicket.category].label}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${priorityConfig[selectedTicket.priority].color}`}>
                    {priorityConfig[selectedTicket.priority].label}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800">{selectedTicket.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Ticket Meta */}
            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              <span className="flex items-center gap-1 text-slate-600">
                <Building2 className="w-4 h-4" />
                {selectedTicket.tenantName}
              </span>
              <span className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-4 h-4" />
                {selectedTicket.createdAt}
              </span>
            </div>

            {/* Status & Assignment */}
            <div className="flex items-center gap-2 mt-4">
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicket['status'])}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_response">Waiting Response</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <button
                onClick={() => handleAssign(selectedTicket.id, 'Support Team')}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <UserCheck className="w-4 h-4" />
                Assign
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <p className="text-sm text-slate-600">{selectedTicket.description}</p>
            {selectedTicket.tags && selectedTicket.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {selectedTicket.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedTicket.messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.senderType === 'support' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${msg.senderType === 'support' ? 'order-1' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      msg.senderType === 'support' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <User className="w-3 h-3" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{msg.senderName}</span>
                    <span className="text-xs text-slate-400">{msg.createdAt}</span>
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${
                    msg.senderType === 'support'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Box */}
          {selectedTicket.status !== 'closed' && (
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={2}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => onCloseTicket(selectedTicket.id)}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Close Ticket
                  </button>
                  <button
                    onClick={handleReply}
                    disabled={isSubmitting || !replyMessage.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-[#38BDF8] to-[#1E90FF] text-white rounded-lg hover:from-[#2BAEE8] hover:to-[#1A7FE8] transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-[450px] bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-center">
          <div className="text-center p-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-700 mb-2">Select a ticket</h3>
            <p className="text-sm text-slate-500">Choose a ticket from the list to view details and respond</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTicketsTab;
