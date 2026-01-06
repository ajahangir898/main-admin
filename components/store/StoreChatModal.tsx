// Lazy-loaded StoreChatModal for better code splitting
import React, { useState, useRef, useEffect, useMemo, useCallback, CSSProperties } from 'react';
import { X, Phone, Video, Info, ImageIcon, Smile, Send, Edit2, Trash2, Check, MessageCircle, ShoppingBag, HelpCircle, Sparkles } from 'lucide-react';
import { User as UserType, WebsiteConfig, ChatMessage, ThemeConfig } from '../../types';
import { toast } from 'react-hot-toast';

const buildWhatsAppLink = (rawNumber?: string | null) => {
    if (!rawNumber) return null;
    const sanitized = rawNumber.trim().replace(/[^0-9]/g, '');
    return sanitized ? `https://wa.me/${sanitized}` : null;
};

const hexToRgb = (hex: string) => {
    if (!hex) return '0, 0, 0';
    let sanitized = hex.replace('#', '');
    if (sanitized.length === 3) {
        sanitized = sanitized.split('').map((char) => char + char).join('');
    }
    if (sanitized.length !== 6) return '0, 0, 0';
    const numeric = parseInt(sanitized, 16);
    const r = (numeric >> 16) & 255;
    const g = (numeric >> 8) & 255;
    const b = numeric & 255;
    return `${r}, ${g}, ${b}`;
};

// Quick reply suggestions
const quickReplies = [
    { id: 'know', label: '👋 নাম জানুন', message: 'আপনাদের সম্পর্কে জানতে চাই' },
    { id: 'demo', label: '📦 ডেমো', message: 'আমি একটি ডেমো দেখতে চাই' },
    { id: 'feature', label: '✨ ফিচার', message: 'আপনাদের ফিচারগুলো কি কি?' },
];

export interface StoreChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    websiteConfig?: WebsiteConfig;
    themeConfig?: ThemeConfig;
    user?: UserType | null;
    messages?: ChatMessage[];
    onSendMessage?: (text: string) => void;
    context?: 'customer' | 'admin';
    onEditMessage?: (id: string, text: string) => void;
    onDeleteMessage?: (id: string) => void;
    canDeleteAll?: boolean;
}

export const StoreChatModal: React.FC<StoreChatModalProps> = ({ 
    isOpen, onClose, websiteConfig, themeConfig, user, messages = [], 
    onSendMessage, context = 'customer', onEditMessage, onDeleteMessage, canDeleteAll = false 
}) => {
    const [draft, setDraft] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingDraft, setEditingDraft] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isCustomerView = context !== 'admin';
    const baseWhatsAppLink = isCustomerView ? buildWhatsAppLink(websiteConfig?.whatsappNumber) : null;
    const chatEnabled = isCustomerView ? (websiteConfig?.chatEnabled ?? true) : true;
    const whatsappFallbackLink = websiteConfig?.chatWhatsAppFallback ? baseWhatsAppLink : null;
    const storeName = websiteConfig?.websiteName || 'Our Store';
    const supportHours = websiteConfig?.chatSupportHours ? `${websiteConfig.chatSupportHours.from} — ${websiteConfig.chatSupportHours.to}` : null;
    const displayMessages = messages;
    const normalizedUserEmail = user?.email?.toLowerCase();
    const chatContactName = websiteConfig?.websiteName || 'Support Team';
    const statusLine = websiteConfig?.chatGreeting || (supportHours ? `Typically replies ${supportHours}` : 'Active now');
    const chatInitial = chatContactName.charAt(0).toUpperCase();
    
    const chatShellStyle = useMemo(() => {
        const fallbackAccent = themeConfig?.primaryColor || '#16a34a';
        const accentHex = websiteConfig?.chatAccentColor || fallbackAccent;
        const accentRgb = hexToRgb(accentHex);
        const fallbackSurface = themeConfig?.surfaceColor || '#f5f6f7';
        const surfaceColor = websiteConfig?.chatSurfaceColor || `rgba(${hexToRgb(fallbackSurface)}, 0.96)`;
        const borderColor = websiteConfig?.chatBorderColor || `rgba(${accentRgb}, 0.18)`;
        const shadowColor = websiteConfig?.chatShadowColor || `rgba(${accentRgb}, 0.28)`;
        return {
            '--chat-accent': accentHex,
            '--chat-accent-rgb': accentRgb,
            '--chat-surface': surfaceColor,
            '--chat-border': borderColor,
            '--chat-shadow': shadowColor
        } as CSSProperties;
    }, [themeConfig?.primaryColor, themeConfig?.surfaceColor, websiteConfig?.chatAccentColor, websiteConfig?.chatSurfaceColor, websiteConfig?.chatBorderColor, websiteConfig?.chatShadowColor]);
    
    const composerPlaceholder = isCustomerView
        ? (user ? 'আপনার প্রশ্ন লিখুন...' : 'আপনার প্রশ্ন লিখুন...')
        : 'Reply to the customer...';
    
    const openWhatsApp = useCallback(() => {
        if (!baseWhatsAppLink || typeof window === 'undefined') return;
        window.open(baseWhatsAppLink, '_blank', 'noopener,noreferrer');
    }, [baseWhatsAppLink]);
    
    const showChatInfo = useCallback(() => {
        toast.custom(() => (
            <div className="max-w-sm rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xl text-sm text-gray-700">
                <p className="font-semibold text-gray-900 mb-2">How live chat works</p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>Messages sync in real-time between customer and admin.</li>
                    <li>Tap and hold on your own replies to edit or delete them.</li>
                    <li>Use the call or video icons to jump into WhatsApp if you need faster support.</li>
                </ul>
            </div>
        ), { duration: 6000 });
    }, []);
    
    const canSend = Boolean(draft.trim() && (chatEnabled || !isCustomerView));

    useEffect(() => {
        if (!isOpen) return;
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
        return () => clearTimeout(timeout);
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (!showEmojiPicker) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmojiPicker]);

    useEffect(() => {
        if (!editingMessageId) return;
        const targetExists = displayMessages.some((message) => message.id === editingMessageId);
        if (!targetExists) {
            setEditingMessageId(null);
            setEditingDraft('');
        }
    }, [displayMessages, editingMessageId]);

    const handleSend = useCallback(() => {
        const text = draft.trim();
        if (!text || !onSendMessage || (!chatEnabled && isCustomerView)) return;
        onSendMessage(text);
        setDraft('');
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
    }, [draft, onSendMessage, chatEnabled, isCustomerView]);

    const handleQuickReply = useCallback((message: string) => {
        if (!onSendMessage || (!chatEnabled && isCustomerView)) return;
        onSendMessage(message);
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
    }, [onSendMessage, chatEnabled, isCustomerView]);

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleEmojiClick = (emoji: string) => {
        setDraft(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const startEditing = (message: ChatMessage) => {
        setEditingMessageId(message.id);
        setEditingDraft(message.text);
    };

    const cancelEditing = () => {
        setEditingMessageId(null);
        setEditingDraft('');
    };

    const saveEditing = () => {
        if (!editingMessageId || !onEditMessage) return;
        const trimmed = editingDraft.trim();
        if (!trimmed) return;
        onEditMessage(editingMessageId, trimmed);
        setEditingMessageId(null);
        setEditingDraft('');
    };

    const handleDelete = (id: string) => {
        onDeleteMessage?.(id);
        if (editingMessageId === id) {
            cancelEditing();
        }
    };

    if (!isOpen) return null;

    const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '💔', '🎉', '🎊', '✨', '⭐', '🔥', '💯', '😴', '😷', '🤝', '🤮', '🤢', '🤮', '😈', '👿', '💀', '☠️', '👫', '💥', '✅', '❌', '🙌', '🤝', '👏', '🎁', '🎈', '🎀', '🌈', '🌟', '💖', '💙', '💗', '💓', '💞', '🚀', '⚡', '🌺', '🌸', '🌼', '🍕', '🍔', '🍟', '🌮', '🍰', '🍪', '☕', '🍺', '🍻', '🥂', '🍾'];

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] px-0 sm:px-4 transition-all duration-300">
            <div 
                className="live-chat-shell bg-white w-full sm:max-w-[380px] rounded-t-[28px] sm:rounded-[28px] flex flex-col h-[80vh] sm:h-[520px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300" 
                style={chatShellStyle}
            >
                {/* Header - Green gradient like reference */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/30">
                                {chatInitial}
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-[15px]">{chatContactName}</p>
                            <p className="text-white/80 text-xs">{statusLine}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200" 
                        aria-label="Close chat"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {!chatEnabled && isCustomerView && (
                    <div className="bg-amber-50 text-amber-700 text-sm px-5 py-3 border-b border-amber-100">
                        {websiteConfig?.chatOfflineMessage || 'Our agents are currently offline. Please try again later or use the fallback options below.'}
                    </div>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto px-4 py-5 bg-gradient-to-b from-gray-50 to-white">
                    {displayMessages.length === 0 ? (
                        /* Welcome Message - Like reference image */
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 max-w-[90%]">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">👋</span>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-[15px] mb-1">স্বাগতম!</p>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            আমরা আপনাকে সাহায্য করতে এখানে আছি। কিছু জিজ্ঞাসা করুন!
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Quick Reply Buttons */}
                                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                                    {quickReplies.map((reply) => (
                                        <button
                                            key={reply.id}
                                            onClick={() => handleQuickReply(reply.message)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200 active:scale-95"
                                        >
                                            {reply.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {displayMessages.map((message) => {
                                const isCustomer = message.sender === 'customer';
                                const isOwnMessage = normalizedUserEmail && message.authorEmail?.toLowerCase() === normalizedUserEmail;
                                const isSuperAdminMessage = message.authorRole === 'super_admin' || message.authorEmail?.toLowerCase() === 'admin@systemnextit.com';
                                const alignRight = isCustomerView ? isCustomer : isSuperAdminMessage;
                                const rawDisplayName = isOwnMessage ? 'You' : (message.authorName || (message.sender === 'admin' ? 'Support Team' : message.customerName || 'Customer'));
                                const displayName = !isCustomerView && isSuperAdminMessage ? 'Super Admin' : rawDisplayName;
                                const canEdit = Boolean(isOwnMessage && onEditMessage);
                                const canDelete = Boolean(onDeleteMessage && (isOwnMessage || (!isCustomerView && canDeleteAll)));
                                const isEditing = editingMessageId === message.id;
                                const showNameTag = !isCustomerView && (!isSuperAdminMessage || isCustomer);
                                const shouldShowAvatar = !alignRight;
                                const avatarInitial = (message.authorName || message.customerName || 'A').charAt(0).toUpperCase();
                                
                                return (
                                    <div key={message.id} className={`flex ${alignRight ? 'justify-end' : 'justify-start'} gap-2`}>
                                        {shouldShowAvatar && (
                                            <div className="flex-shrink-0 pt-1">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-semibold flex items-center justify-center shadow-sm">
                                                    {avatarInitial}
                                                </div>
                                            </div>
                                        )}
                                        <div className={`max-w-[75%] ${alignRight ? 'order-first' : ''}`}>
                                            {showNameTag && (
                                                <span className="text-[11px] font-medium text-gray-500 px-1 mb-1 block">
                                                    {displayName}
                                                </span>
                                            )}
                                            <div 
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                                    alignRight 
                                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md' 
                                                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md'
                                                }`}
                                            >
                                                {isEditing ? (
                                                    <div className="space-y-2">
                                                        <textarea 
                                                            value={editingDraft} 
                                                            onChange={(e) => setEditingDraft(e.target.value)} 
                                                            className="w-full rounded-xl border border-gray-200 bg-white text-sm text-gray-800 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-200" 
                                                            rows={2} 
                                                        />
                                                        <div className="flex justify-end gap-2">
                                                            <button type="button" onClick={cancelEditing} className="text-xs font-semibold text-gray-500 hover:text-gray-700">Cancel</button>
                                                            <button type="button" onClick={saveEditing} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><Check size={14} /> Save</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-line break-words">{message.text}</p>
                                                )}
                                                {(canEdit || canDelete) && !isEditing && (
                                                    <div className={`mt-2 flex justify-end gap-2 text-xs ${alignRight ? 'text-white/70' : 'text-gray-400'}`}>
                                                        {canEdit && (
                                                            <button type="button" onClick={() => startEditing(message)} className={`hover:${alignRight ? 'text-white' : 'text-gray-600'}`} aria-label="Edit message">
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                        {canDelete && (
                                                            <button type="button" onClick={() => handleDelete(message.id)} className={`hover:${alignRight ? 'text-white' : 'text-gray-600'}`} aria-label="Delete message">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={`text-[10px] text-gray-400 mt-1 px-1 ${alignRight ? 'text-right' : 'text-left'}`}>
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {message.editedAt ? ' • Edited' : ''}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                    {displayMessages.length === 0 && <div ref={messagesEndRef} />}
                </div>

                {/* Input Area - Clean and minimal */}
                <div className="px-4 pb-4 pt-3 bg-white border-t border-gray-100">
                    {chatEnabled || !isCustomerView ? (
                        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all duration-200">
                            <div className="relative">
                                <button 
                                    type="button" 
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                                    className={`p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition ${showEmojiPicker ? 'text-emerald-500 bg-emerald-50' : ''}`} 
                                    aria-label="Add emoji"
                                >
                                    <Smile size={20} />
                                </button>
                                {showEmojiPicker && (
                                    <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 z-50 grid grid-cols-8 gap-1 w-72">
                                        {emojis.map((emoji, idx) => (
                                            <button key={`${emoji}-${idx}`} onClick={() => handleEmojiClick(emoji)} className="text-xl hover:bg-gray-100 p-1.5 rounded-lg transition hover:scale-110" title={emoji}>{emoji}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <input 
                                type="text" 
                                value={draft} 
                                onChange={(e) => setDraft(e.target.value)} 
                                onKeyDown={handleKeyDown} 
                                placeholder={composerPlaceholder} 
                                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400" 
                            />
                            <button 
                                onClick={handleSend} 
                                className={`p-2.5 rounded-full transition-all duration-200 ${
                                    canSend 
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95' 
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`} 
                                aria-label="Send message" 
                                disabled={!canSend}
                            >
                                <Send size={18} className={canSend ? '-rotate-45' : ''} />
                            </button>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600 space-y-3">
                            <p>Need urgent help? You can still reach us via the options below:</p>
                            {whatsappFallbackLink && (
                                <a href={whatsappFallbackLink} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-500 text-green-700 py-2 font-semibold">
                                    <MessageCircle size={16} /> Chat on WhatsApp
                                </a>
                            )}
                            <p className="text-xs text-gray-400">Leave your message and we will respond once we are online.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StoreChatModal;