/**
 * useChat - Chat state and handlers extracted from App.tsx
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage, User, WebsiteConfig } from '../types';
import { DataService } from '../services/DataService';
import { isAdminRole } from '../utils/appHelpers';

interface UseChatOptions {
  activeTenantId: string;
  isLoading: boolean;
  user: User | null;
  websiteConfig?: WebsiteConfig;
  isTenantSwitching?: boolean;
}

export function useChat({ activeTenantId, isLoading, user, websiteConfig, isTenantSwitching = false }: UseChatOptions) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminChatOpen, setIsAdminChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hasUnreadChat, setHasUnreadChat] = useState(false);

  // Refs for sync
  const chatGreetingSeedRef = useRef<string | null>(null);
  const chatMessagesRef = useRef<ChatMessage[]>([]);
  const isAdminChatOpenRef = useRef(false);
  const chatSyncLockRef = useRef(false);
  const skipNextChatSaveRef = useRef(false);
  const chatMessagesLoadedRef = useRef(false);
  const userRef = useRef<User | null>(user);
  const chatPollingActiveRef = useRef(false);

  // Update refs
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);
  useEffect(() => { isAdminChatOpenRef.current = isAdminChatOpen; }, [isAdminChatOpen]);
  useEffect(() => { chatGreetingSeedRef.current = null; }, [activeTenantId]);

  // Chat greeting
  useEffect(() => {
    if (!websiteConfig?.chatGreeting) return;
    if (chatMessages.length > 0) return;
    const tenantKey = activeTenantId || 'default';
    if (chatGreetingSeedRef.current === tenantKey) return;
    const greetingMessage: ChatMessage = {
      id: `greeting-${Date.now()}`,
      sender: 'admin',
      text: websiteConfig.chatGreeting,
      timestamp: Date.now(),
    };
    setChatMessages([greetingMessage]);
    chatGreetingSeedRef.current = tenantKey;
  }, [websiteConfig?.chatGreeting, chatMessages.length, activeTenantId]);

  // Chat persistence
  useEffect(() => {
    if (isLoading || !activeTenantId || !chatMessagesLoadedRef.current || isTenantSwitching) return;
    if (skipNextChatSaveRef.current) {
      skipNextChatSaveRef.current = false;
      return;
    }

    const persistChats = async () => {
      chatSyncLockRef.current = true;
      try {
        await DataService.save('chat_messages', chatMessages, activeTenantId);
      } catch (error) {
        console.warn('Unable to save chat messages', error);
      } finally {
        chatSyncLockRef.current = false;
      }
    };

    persistChats();
  }, [chatMessages, isLoading, activeTenantId, isTenantSwitching]);

  // Chat polling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!activeTenantId || isLoading) return;
    
    const shouldPoll = isChatOpen || isAdminChatOpen || isAdminRole(user?.role);
    if (!shouldPoll) {
      chatPollingActiveRef.current = false;
      return;
    }

    chatPollingActiveRef.current = true;
    let isMounted = true;
    let isFetching = false;

    const syncChatFromRemote = async () => {
      if (!isMounted || isFetching || chatSyncLockRef.current || !chatPollingActiveRef.current) return;
      isFetching = true;
      try {
        const latest = await DataService.getChatMessages(activeTenantId);
        if (!isMounted) return;
        const normalized = Array.isArray(latest) ? [...latest] : [];
        normalized.sort((a, b) => (a?.timestamp || 0) - (b?.timestamp || 0));

        const localMessages = chatMessagesRef.current;
        const prevIds = new Set(localMessages.map((message) => message.id));
        const newMessages = normalized.filter((message) => !prevIds.has(message.id));

        const hasDifference =
          localMessages.length !== normalized.length ||
          localMessages.some((message, index) => {
            const comparison = normalized[index];
            if (!comparison) return true;
            return (
              message.id !== comparison.id ||
              message.text !== comparison.text ||
              message.timestamp !== comparison.timestamp ||
              message.sender !== comparison.sender ||
              (message.editedAt || 0) !== (comparison.editedAt || 0)
            );
          });

        if (hasDifference) {
          skipNextChatSaveRef.current = true;
          setChatMessages(normalized);
        }

        const shouldNotify = newMessages.some((message) => message.sender === 'customer');
        if (shouldNotify && isAdminRole(userRef.current?.role) && !isAdminChatOpenRef.current) {
          setHasUnreadChat(true);
        }
      } catch (error) {
        console.warn('Unable to sync chat messages', error);
      } finally {
        isFetching = false;
      }
    };

    const intervalId = window.setInterval(syncChatFromRemote, 5000);
    syncChatFromRemote();

    return () => {
      isMounted = false;
      chatPollingActiveRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [activeTenantId, isLoading, isChatOpen, isAdminChatOpen, user?.role]);

  // Handlers
  const appendChatMessage = useCallback((sender: ChatMessage['sender'], text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const authorName = userRef.current?.name || (sender === 'customer' ? 'Visitor' : 'Support Agent');
    const authorEmail = userRef.current?.email || undefined;
    const authorRole = userRef.current?.role;
    const messageId = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const message: ChatMessage = {
      id: messageId,
      sender,
      text: trimmed,
      timestamp: Date.now(),
      customerName: sender === 'customer' ? (userRef.current?.name || 'Visitor') : undefined,
      customerEmail: sender === 'customer' ? userRef.current?.email : undefined,
      authorName,
      authorEmail,
      authorRole,
    };
    chatSyncLockRef.current = true;
    setChatMessages((prev) => [...prev, message]);
  }, []);

  const handleCustomerSendChat = useCallback((text: string) => {
    appendChatMessage('customer', text);
    if (!isAdminChatOpen) {
      setHasUnreadChat(true);
    }
  }, [appendChatMessage, isAdminChatOpen]);

  const handleAdminSendChat = useCallback((text: string) => {
    appendChatMessage('admin', text);
  }, [appendChatMessage]);

  const handleEditChatMessage = useCallback((messageId: string, updatedText: string) => {
    const trimmed = updatedText.trim();
    if (!trimmed) return;
    const existing = chatMessagesRef.current.find((message) => message.id === messageId);
    if (!existing || existing.text === trimmed) return;
    chatSyncLockRef.current = true;
    setChatMessages((prev) => prev.map((message) => 
      message.id === messageId ? { ...message, text: trimmed, editedAt: Date.now() } : message
    ));
  }, []);

  const handleDeleteChatMessage = useCallback((messageId: string) => {
    const exists = chatMessagesRef.current.some((message) => message.id === messageId);
    if (!exists) return;
    chatSyncLockRef.current = true;
    setChatMessages((prev) => prev.filter((message) => message.id !== messageId));
  }, []);

  const handleOpenChat = useCallback(() => {
    setIsAdminChatOpen(false);
    setIsChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const handleOpenAdminChat = useCallback(() => {
    setIsAdminChatOpen(true);
    setIsChatOpen(false);
    setHasUnreadChat(false);
  }, []);

  const handleCloseAdminChat = useCallback(() => {
    setIsAdminChatOpen(false);
  }, []);

  // Exported setters for external loading
  const loadChatMessages = useCallback((messages: ChatMessage[], tenantKey?: string) => {
    const hydratedMessages = Array.isArray(messages) ? messages : [];
    skipNextChatSaveRef.current = true;
    chatMessagesLoadedRef.current = true;
    setChatMessages(hydratedMessages);
    chatGreetingSeedRef.current = hydratedMessages.length ? (tenantKey || 'default') : null;
    setHasUnreadChat(false);
    setIsAdminChatOpen(false);
  }, []);

  const resetChatLoaded = useCallback(() => {
    chatMessagesLoadedRef.current = false;
  }, []);

  return {
    // State
    isChatOpen,
    isAdminChatOpen,
    chatMessages,
    hasUnreadChat,
    // Handlers
    handleCustomerSendChat,
    handleAdminSendChat,
    handleEditChatMessage,
    handleDeleteChatMessage,
    handleOpenChat,
    handleCloseChat,
    handleOpenAdminChat,
    handleCloseAdminChat,
    // Setters for external use
    loadChatMessages,
    resetChatLoaded,
    setChatMessages,
    setHasUnreadChat,
    // Refs exposed for data refresh handler
    skipNextChatSaveRef,
    chatMessagesRef,
    isAdminChatOpenRef,
  };
}
