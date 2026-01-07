'use client';

/**
 * WhatsApp Chat Page
 * Real-time chat interface with WhatsApp Business API integration
 */

import { Avatar, Button, Input, ActionIcon, Textarea, Select } from 'rizzui';
import {
  PiSmiley,
  PiArrowLeft,
  PiImage,
  PiPaperPlaneTilt,
  PiEnvelope,
  PiX,
  PiFileText,
  PiLightning,
  PiCheck,
  PiChecks,
  PiXCircle,
  PiDownload,
  PiPaperclipHorizontal,
  PiMicrophone,
  PiVideoCamera,
} from 'react-icons/pi';
import React, { useState, useRef, useEffect } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { chatApi, type Contact, type Message } from '@/lib/api/chat';
import { uploadApi } from '@/lib/api-client';
import { chatWebSocket } from '@/lib/websocket/chat-websocket';
import { phoneNumbersApi } from '@/lib/api/phone-numbers';
import { quickReplyApi, type QuickReply } from '@/lib/api/quick-replies';
import { formatDistanceToNow, format, differenceInCalendarDays } from 'date-fns';
import { useDebounce } from '@/hooks/use-debounce';
import ContactTags from '@/app/shared/chat/contact-tags';
import SessionTimer from './session-timer';
import { useLayout } from '@/layouts/use-layout';
import { LAYOUT_OPTIONS } from '@/config/enums';
import { useBerylliumSidebars } from '@/layouts/beryllium/beryllium-utils';

const defaultEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
  '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
  '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
  '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
  '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
  '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖',
  '🔥', '⭐', '✨', '💫', '💥', '💯', '✅', '❌',
];



export default function ChatPage() {
  const { layout } = useLayout();
  const { expandedLeft } = useBerylliumSidebars();
  
  // Calculate sidebar offset based on layout
  const getSidebarOffset = () => {
    if (layout === LAYOUT_OPTIONS.BERYLLIUM) {
      // Beryllium: 88px fixed + (414px expanded OR 110px collapsed)
      return expandedLeft 
        ? 'xl:left-[502px]'  // 88 + 414
        : 'xl:left-[198px]'; // 88 + 110
    }
    
    // Hydrogen, Helium, Carbon, Boron: 270px/288px
    if ([
      LAYOUT_OPTIONS.HYDROGEN,
      LAYOUT_OPTIONS.HELIUM,
      LAYOUT_OPTIONS.CARBON,
      LAYOUT_OPTIONS.BORON,
    ].includes(layout)) {
      return 'xl:left-[270px] 2xl:left-72';
    }
    
    // Lithium: no sidebar
    return '';
  };

  // State
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [, setQuickRepliesLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [filteredQuickReplies, setFilteredQuickReplies] = useState<QuickReply[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorite'>('all');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [contactPage, setContactPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);

  // Attachment state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [pendingAttachment, setPendingAttachment] = useState<{
    file: File;
    preview?: string;
    type: 'image' | 'video' | 'document' | 'audio';
  } | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickReplyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load phone numbers on mount
  useEffect(() => {
    loadPhoneNumbers();
    connectWebSocket();
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (selectedPhoneNumberId) {
      // Don't trigger on initial empty search if already handled by phone number selection
      // But we generally want to reload when search changes.
      // If search becomes empty, we reload all.
      setContactPage(1);
      // Pass the specific search query to ensure we use the debounced value
      // Note: loadContacts currently uses searchQuery state (closure), which matches debounced value at this point
      loadContacts(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedPhoneNumberId]);

  // Load contacts when phone number selected
  useEffect(() => {
    if (selectedPhoneNumberId) {
      setSearchQuery(''); // Reset search when switching numbers (will trigger debounce effect with empty, reloading contacts)
      console.log('[WS] Subscribing to phone number:', selectedPhoneNumberId);
      loadContacts();

      // Wait for WebSocket to be connected before subscribing
      const subscribeWhenReady = () => {
        if (chatWebSocket.isConnected()) {
          chatWebSocket.subscribe(selectedPhoneNumberId);
        } else {
          console.log('[WS] Not connected yet, waiting...');
          setTimeout(subscribeWhenReady, 500);
        }
      };
      subscribeWhenReady();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoneNumberId]);

  // Load messages when contact selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages();
      // Auto-focus textarea for immediate typing
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?.id]);

  // Load quick replies on mount
  useEffect(() => {
    const fetchQuickReplies = async () => {
      try {
        setQuickRepliesLoading(true);
        const response = await quickReplyApi.getAll();
        // API client returns { data: QuickReply[] }
        const replies: QuickReply[] = Array.isArray(response) ? response as QuickReply[] : ((response as any).data || []);
        setQuickReplies(replies);
        setFilteredQuickReplies(replies); // Initialize filtered list
      } catch (error) {
        console.error('Failed to load quick replies:', error);
      } finally {
        setQuickRepliesLoading(false);
      }
    };
    
    fetchQuickReplies();
  }, []);

  // WebSocket event listeners
  useEffect(() => {
    const handleConnectionSuccess = (event: any) => {
      console.log('[WS] ✅ Connection established:', event);
    };

    const handleSubscribeSuccess = (event: any) => {
      console.log('[WS] ✅ Subscribed to room:', event.data.phoneNumberId);
    };

    const handleNewMessage = (event: any) => {
      console.log('[WS] Received message:new event:', event);
      
      if (event.phoneNumberId === selectedPhoneNumberId) {
        const rawMessage = event.data.message;
        
        // Format message to match Message interface from lib/api/chat.ts
        const formattedMessage = {
          id: rawMessage.id,
          wamid: rawMessage.wamid,
          contactId: event.data.contactId,
          messageType: rawMessage.messageType,
          textBody: rawMessage.textBody || null,
          mediaUrl: rawMessage.mediaUrl || null,
          mediaCaption: rawMessage.mediaCaption || null,
          mediaFilename: rawMessage.mediaFilename || null,
          mediaMimeType: rawMessage.mediaMimeType || null,
          direction: rawMessage.direction,
          timestamp: rawMessage.timestamp,
          status: rawMessage.status,
          readAt: rawMessage.readAt || null,
          reactionEmoji: rawMessage.reactionEmoji || null,
          reactionMessageId: rawMessage.reactionMessageId || null,
          // User info (for outgoing messages)
          userId: rawMessage.userId || null,
          user: rawMessage.user || null,
        };

        // Update contact list locally without full reload
        setContacts(prevContacts => {
          const contactId = event.data.contactId;
          const contactIndex = prevContacts.findIndex(c => c.id === contactId);

          // If contact exists, update it and move to top
          if (contactIndex !== -1) {
            const updatedContact = {
              ...prevContacts[contactIndex],
              // lastMessage must fully match the Contact interface from lib/api/chat.ts
              lastMessage: {
                id: rawMessage.id,
                messageType: rawMessage.messageType,
                textBody: rawMessage.textBody || rawMessage.mediaCaption || `[${rawMessage.messageType}]`,
                mediaCaption: rawMessage.mediaCaption || null,
                direction: rawMessage.direction,
                timestamp: rawMessage.timestamp,
                status: rawMessage.status || 'delivered',
              },
              lastMessageTimestamp: rawMessage.timestamp,
              // Update session info if available in event
              ...(event.data.contact || {}),
              // Increment unread count if message is incoming and not currently selected
              unreadCount: (rawMessage.direction === 'incoming' && selectedContact?.id !== contactId)
                ? (prevContacts[contactIndex].unreadCount || 0) + 1
                : prevContacts[contactIndex].unreadCount
            };

            // Also update selectedContact if it matches
            if (selectedContact?.id === contactId && event.data.contact) {
                 setSelectedContact(prev => prev ? ({ ...prev, ...event.data.contact }) : null);
            }

            // Remove from old position and add to top
            const newContacts = [...prevContacts];
            newContacts.splice(contactIndex, 1);
            return [updatedContact, ...newContacts];
          }

          // Contact not found - keep current state, will reload outside
          return prevContacts;
        });

        // If contact doesn't exist, reload all contacts (done outside setContacts to avoid conflicts)
        if (!contacts.find(c => c.id === event.data.contactId)) {
          console.log('[WS] New contact detected, reloading contact list');
          loadContacts();
        }

        // If this contact's conversation is open, add message
        if (event.data.contactId === selectedContact?.id) {
          console.log('[WS] Adding message to current conversation:', formattedMessage);
          
          setMessages(prev => {
            // Check if message already exists (by ID or WAMID)
            const exists = prev.some(m => 
              m.id === formattedMessage.id || 
              (m.wamid && formattedMessage.wamid && m.wamid === formattedMessage.wamid)
            );

            if (exists) {
              console.log('[WS] Message already exists, skipping add:', formattedMessage.id);
              return prev;
            }

            // Check for potential optimistic duplicate (same text, outgoing, recent)
            // This prevents race condition where optimistic message hasn't been updated with real ID yet
            // but WebSocket event arrives with real ID.
            if (formattedMessage.direction === 'outgoing') {
               const potentialDuplicate = prev.find(m => 
                 m.id.startsWith('temp-') && 
                 m.direction === 'outgoing' &&
                 m.textBody === formattedMessage.textBody &&
                 Math.abs(new Date(m.timestamp).getTime() - new Date(formattedMessage.timestamp).getTime()) < 10000 // 10s window
               );

               if (potentialDuplicate) {
                 console.log('[WS] Found optimistic match, updating it instead of adding new:', potentialDuplicate.id);
                 return prev.map(m => m.id === potentialDuplicate.id ? formattedMessage : m);
               }
            }

            return [...prev, formattedMessage];
          });
          scrollToBottom();
          
          // If we are viewing this contact, mark as read immediately in UI (backend should handle actual read receipts)
        }
      }
    };

    const handleStatusUpdate = (event: any) => {
      console.log('[WS] Received message:status event:', JSON.stringify(event, null, 2));
      
      // Only check contactId - phoneNumberId is implicit in WebSocket subscription
      if (event.data.contactId === selectedContact?.id) {
        console.log('[WS] Contact match! Updating message status:', event.data.status);
        console.log('[WS] Target WAMID:', event.data.wamid);
        console.log('[WS] Target DB ID:', event.data.messageId);

        setMessages(prev =>
          prev.map(msg => {
            // Robust Matching Logic:
            let isMatch = false;
            
            // 1. Match by WAMID (Best for optimistic messages that have been updated with WAMID)
            if (msg.wamid && event.data.wamid && msg.wamid === event.data.wamid) {
              isMatch = true;
              console.log('✅ MATCH by WAMID:', msg.wamid);
            }
            // 2. Match by Database ID (Standard match)
            else if (msg.id === event.data.messageId) {
              isMatch = true;
              console.log('✅ MATCH by DB ID:', msg.id);
            }
            // 3. Fallback: Fuzzy Match by Content + Destination (For optimistic messages if WAMID missing)
            // Sometimes status update arrives before WAMID is set in UI state
            else if (msg.direction === 'outgoing' && msg.id.startsWith('temp-') && !msg.wamid) {
               // We don't have body content in event, but we can assume if it's the most recent outgoing message 
               // and we just got a status update for this contact, it's likely this one.
               // (Simplified logic: Update the most recent pending outgoing message)
               const timeDiff = Math.abs(new Date(msg.timestamp).getTime() - new Date().getTime());
               if (timeDiff < 60000) { // Created within last minute
                 isMatch = true;
                 console.log('⚠️ FUZZY MATCH by Recency (Optimistic):', msg.id);
               }
            }

            if (isMatch) {
               console.log(`[WS] Updating ${msg.id} status: ${msg.status} -> ${event.data.status}`);
               return { 
                 ...msg, 
                 status: event.data.status,
                 // Also ensure it has the correct real ID if available
                 ...(event.data.messageId ? { id: event.data.messageId } : {}),
                 ...(event.data.wamid ? { wamid: event.data.wamid } : {})
               };
            }
            return msg;
          })
        );
      } else {
        console.log('[WS] Ignoring status update for different contact:', event.data.contactId);
      }
    };

    chatWebSocket.on('connection:success', handleConnectionSuccess);
    chatWebSocket.on('subscribe:success', handleSubscribeSuccess);
    chatWebSocket.on('message:new', handleNewMessage);
    chatWebSocket.on('message:status', handleStatusUpdate);

    return () => {
      chatWebSocket.off('connection:success', handleConnectionSuccess);
      chatWebSocket.off('subscribe:success', handleSubscribeSuccess);
      chatWebSocket.off('message:new', handleNewMessage);
      chatWebSocket.off('message:status', handleStatusUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPhoneNumberId, selectedContact?.id]);

  const connectWebSocket = async () => {
    try {
      if (!chatWebSocket.isConnected()) {
        await chatWebSocket.connect();
        console.log('✅ WebSocket connected');
      }
    } catch (error) {
      console.error('WebSocket connection failed:', error);
    }
  };

  const loadPhoneNumbers = async () => {
    try {
      const response = await phoneNumbersApi.getAll();
      const numbers = Array.isArray(response) ? response : (response.data || []);
      setPhoneNumbers(numbers);
      
      // Auto-select first number
      if (numbers.length > 0 && !selectedPhoneNumberId) {
        setSelectedPhoneNumberId(numbers[0].id);
      }
    } catch (error) {
      console.error('Failed to load phone numbers:', error);
    }
  };

  const loadContacts = async (page: number = 1, append: boolean = false) => {
    if (!selectedPhoneNumberId) return;
    
    console.log('Loading contacts for phone number:', selectedPhoneNumberId, 'page:', page);
    if (!append) setLoading(true);
    try {
      const response = await chatApi.getContacts({
        phoneNumberId: selectedPhoneNumberId,
        search: searchQuery || undefined,
        page,
        limit: 50,
      });
      console.log('Contacts response:', response);
      
      // API client already unwraps response.data, so response IS the array
      const newContacts = Array.isArray(response) ? response : (response.data || []);
      
      if (append) {
        setContacts(prev => [...prev, ...newContacts]);
      } else {
        setContacts(newContacts);
      }
      
      // Check if there are more contacts
      setHasMoreContacts(newContacts.length === 50);
      setContactPage(page);
    } catch (error: any) {
      console.error('Failed to load contacts:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (contact?: Contact) => {
    const targetContact = contact || selectedContact;
    if (!targetContact) return;
    
    console.log('[DEBUG] Loading messages for contact:', targetContact.id);
    setLoading(true);
    try {
      const response = await chatApi.getMessages({
        contactId: targetContact.id,
        limit: 50,
      });
      console.log('[DEBUG] Messages response:', response);
      
      // API client already unwraps response.data
      const msgs = Array.isArray(response) ? response : (response.data || []);
      
      // DEBUG: Log all message statuses
      console.log('[DEBUG] Loaded message statuses:', msgs.map(m => ({
        id: m.id,
        wamid: m.wamid,
        direction: m.direction,
        status: m.status,
        textBody: m.textBody?.substring(0, 20),
      })));
      
      // Preserve optimistic messages (messages with temp- IDs) when merging with API data
      setMessages(prevMessages => {
        const optimisticMessages = prevMessages.filter(msg => msg.id?.toString().startsWith('temp-'));
        
        // Deduplicate: Filter out optimistic messages that are already in the loaded messages (match by WAMID)
        const loadedWamids = new Set(msgs.map(m => m.wamid).filter(Boolean));
        
        console.log('[DEBUG] Deduplication check:');
        console.log('  - Loaded WAMIDs:', Array.from(loadedWamids));
        console.log('  - Optimistic messages:', optimisticMessages.map(m => ({ id: m.id, wamid: m.wamid, status: m.status, text: m.textBody })));

        const uniqueOptimisticMessages = optimisticMessages.filter(optMsg => {
          // 1. Strict Deduplication by WAMID
          if (optMsg.wamid && loadedWamids.has(optMsg.wamid)) {
             return false; // Drop strict duplicate
          }
          
          // 2. Fuzzy Deduplication: Match by content + direction + timestamp (within 60s window)
          // This handles cases where optimistic message doesn't have WAMID yet but API returns the saved message.
          const isFuzzyDuplicate = msgs.some(loadedMsg => {
            if (loadedMsg.direction !== optMsg.direction) return false;
            // Check body text (trimmed)
            if (loadedMsg.textBody?.trim() !== optMsg.textBody?.trim()) return false;
            
            // Check timestamp proximity (if both exist)
            if (loadedMsg.createdAt && optMsg.timestamp) {
              const loadedTime = new Date(loadedMsg.createdAt).getTime();
              const optTime = new Date(optMsg.timestamp).getTime();
              const diff = Math.abs(loadedTime - optTime);
              // 60 seconds tolerance
              return diff < 60000;
            }
            return false;
          });

          if (isFuzzyDuplicate) {
             console.log(`[Dedupe] Dropping fuzzy duplicate ${optMsg.id} ("${optMsg.textBody?.substring(0, 10)}...")`);
             return false;
          }

          return true; // Keep if no duplicate found
        });

        console.log('[DEBUG] Preserving', uniqueOptimisticMessages.length, 'unique optimistic messages (deduplicated from', optimisticMessages.length, ')');
        console.log('[DEBUG] Loaded', msgs.length, 'messages from API');
        
        // Merge: API messages + unique optimistic messages (in chronological order)
        return [...msgs, ...uniqueOptimisticMessages];
      });
      
      scrollToBottom();
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactClick = async (contact: Contact) => {
    setSelectedContact(contact);
    setShowChat(true);
    
    // Reset unread count for this contact (mark as read)
    setContacts(prevContacts =>
      prevContacts.map(c =>
        c.id === contact.id ? { ...c, unreadCount: 0 } : c
      )
    );
    
    // Load messages immediately with contact parameter to avoid race condition
    loadMessages(contact);
    
    // Mark conversation as read in backend (persist to database)
    try {
      await chatApi.markConversationAsRead(contact.id);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      // Don't show error to user - the UI already updated optimistically
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedContact(null); // Clear selected contact for 'no conversation' state
  };

  const handleSendMessage = async () => {
    // Allow sending if there's text OR an attachment
    if ((!messageInput.trim() && !pendingAttachment) || !selectedContact || sending) return;

    const hasAttachment = !!pendingAttachment;
    const messageText = messageInput.trim();
    
    // Determine message type
    const messageType = hasAttachment ? pendingAttachment.type : 'text';
    
    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      wamid: null,
      contactId: selectedContact.id,
      messageType: messageType,
      textBody: hasAttachment ? (messageText || null) : messageText, // Caption for media or text body
      mediaUrl: pendingAttachment?.preview || null,
      mediaCaption: hasAttachment ? messageText : null,
      mediaFilename: pendingAttachment?.file?.name || null,
      mediaMimeType: pendingAttachment?.file?.type || null,
      direction: 'outgoing' as const,
      timestamp: new Date().toISOString(),
      status: 'pending',
      readAt: null,
    };

    const messageToSend = messageText;
    const attachmentToSend = pendingAttachment;
    
    setMessageInput(''); // Clear input immediately
    setPendingAttachment(null); // Clear attachment
    setMessages(prev => [...prev, optimisticMessage]); // Add to UI optimistically
    
    // Update contact list order: Move active contact to top and update last message
    setContacts(prev => {
      const contactIndex = prev.findIndex(c => c.id === selectedContact.id);
      if (contactIndex === -1) return prev;
      
      const lastMessageText = hasAttachment 
        ? (messageToSend ? `📎 ${messageToSend}` : `📎 ${attachmentToSend?.type}`)
        : messageToSend;
      
      const updatedContact = { 
        ...prev[contactIndex], 
        lastMessage: {
          ...prev[contactIndex].lastMessage,
          textBody: lastMessageText,
          timestamp: optimisticMessage.timestamp,
          status: 'pending'
        }
      };
      
      const newContacts = [...prev];
      newContacts.splice(contactIndex, 1);
      newContacts.unshift(updatedContact);
      return newContacts;
    });

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setSending(true);
    setUploadingAttachment(hasAttachment);
    
    try {
      let mediaUrl: string | null = null;
      let mediaFilename: string | null = null;

      // Step 1: Upload attachment if present
      if (attachmentToSend) {
        setUploadingAttachment(true);
        try {
          const uploadResult = await uploadApi.uploadFile(attachmentToSend.file);
          if (!uploadResult.success || !uploadResult.data) {
            throw new Error('Upload failed');
          }
          mediaUrl = uploadResult.data.fileUrl || uploadResult.data.url;
          mediaFilename = uploadResult.data.fileName || attachmentToSend.file.name;
        } finally {
          setUploadingAttachment(false);
        }
      }

      // Step 2: Send message via chat API
      let sendPayload: any;
      
      if (hasAttachment && attachmentToSend) {
        // Send media message - payload must match backend sendMessageSchema
        sendPayload = {
          contactId: selectedContact.id,
          phoneNumberId: selectedPhoneNumberId,
          type: attachmentToSend.type,
          media: {
            mediaUrl: mediaUrl,
            caption: messageToSend || undefined,
            filename: attachmentToSend.type === 'document' ? mediaFilename : undefined,
          },
        };
      } else {
        // Send text message
        sendPayload = {
          contactId: selectedContact.id,
          phoneNumberId: selectedPhoneNumberId,
          type: 'text',
          text: {
            body: messageToSend,
          },
        };
      }

      const result = await chatApi.sendMessage(sendPayload);

      console.log('📨 Send message result:', result);
      console.log('💾 Saved message from backend:', result.message);
      console.log('👤 User info:', result.message?.user);

      // Update optimistic message with real data from backend
      // result is already unwrapped: { whatsapp: {...}, message: {...} }
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === optimisticMessage.id) {
            const updated = {
              ...msg,
              // Override with saved message from backend (includes user info)
              ...(result.message || {}),
              // Only override these if they're not in the backend response
              ...(mediaUrl && !result.message?.mediaUrl ? { mediaUrl } : {}),
            };
            console.log('🔄 Updated message:', updated);
            console.log('👤 Updated message user:', updated.user);
            return updated;
          }
          return msg;
        })
      );

      scrollToBottom();
    } catch (error: any) {
      console.error('Failed to send message:', error);
      
      // Mark optimistic message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: 'failed' }
            : msg
        )
      );
      
      alert(error.response?.data?.message || error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploadingAttachment(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleQuickReply = (quickReply: QuickReply) => {
    setMessageInput(quickReply.text);
    setShowQuickReplies(false);
    setShowSuggestions(false);
    // Focus textarea after selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const toggleQuickReplies = () => {
    setShowQuickReplies((prev) => !prev);
  };

  // Handle input change and detect slash command for suggestions
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check if user typed "/" to trigger suggestions
    if (value.startsWith('/')) {
      const searchTerm = value.slice(1).toLowerCase();
      
      // Filter quick replies based on shortcut or text
      const filtered = quickReplies.filter(qr => 
        qr.shortcut.toLowerCase().includes(searchTerm) ||
        qr.text.toLowerCase().includes(searchTerm)
      );
      
      setFilteredQuickReplies(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedSuggestionIndex(0); // Reset selection
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestions dropdown first
    if (showSuggestions && filteredQuickReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < filteredQuickReplies.length - 1 ? prev + 1 : prev
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        return;
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const selected = filteredQuickReplies[selectedSuggestionIndex];
        if (selected) {
          handleQuickReply(selected);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Handle Enter key to send message (when suggestions are not shown)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }, 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <PiCheck className="h-4 w-4" />;
      case 'delivered':
        return <PiChecks className="h-4 w-4" />;
      case 'read':
      case 'played': // Played is essentially read (blue ticks) for media
        return <PiChecks className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <PiXCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (quickReplyRef.current && !quickReplyRef.current.contains(event.target as Node)) {
        setShowQuickReplies(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };

    if (showEmojiPicker || showQuickReplies || showAttachmentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showQuickReplies, showAttachmentMenu]);

  // Handle file selection for attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'document' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview for images
    let preview: string | undefined;
    if (type === 'image' && file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    setPendingAttachment({ file, preview, type });
    setShowAttachmentMenu(false);
    
    // Clear input value to allow re-selecting same file
    e.target.value = '';
  };

  // Handle paste event for images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const preview = URL.createObjectURL(file);
          setPendingAttachment({ file, preview, type: 'image' });
        }
        break;
      }
    }
  };

  // Cancel pending attachment
  const cancelAttachment = () => {
    if (pendingAttachment?.preview) {
      URL.revokeObjectURL(pendingAttachment.preview);
    }
    setPendingAttachment(null);
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedContact && !sending) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!selectedContact || sending) return;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0]; // Only handle first file
    const mimeType = file.type;

    // Determine file type
    let type: 'image' | 'video' | 'document' | 'audio';
    if (mimeType.startsWith('image/')) {
      type = 'image';
    } else if (mimeType.startsWith('video/')) {
      type = 'video';
    } else if (mimeType.startsWith('audio/')) {
      type = 'audio';
    } else {
      type = 'document';
    }

    // Create preview for images
    let preview: string | undefined;
    if (type === 'image') {
      preview = URL.createObjectURL(file);
    }

    setPendingAttachment({ file, preview, type });
  };

  // Toggle attachment menu
  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
    setShowEmojiPicker(false);
    setShowQuickReplies(false);
  };

  // ESC key handler to exit chat room (like WhatsApp)
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedContact) {
        handleBackToList();
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact]);

  const filteredContacts = contacts.filter((contact) => {
    if (chatFilter === 'unread') return contact.unreadCount > 0;
    if (chatFilter === 'favorite') return false; // No favorite field in Contact
    return true;
  });

  console.log('[DEBUG] Contacts state:', {
    totalContacts: contacts.length,
    filteredContacts: filteredContacts.length,
    chatFilter,
    selectedPhoneNumberId,
  });

  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        /* Custom Scrollbar Styles (Slim - Contact List) */
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
          height: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(var(--primary-default));
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgb(var(--primary-dark));
        }

        /* Custom Scrollbar Styles (Wide - Message Thread) */
        .custom-scrollbar-message::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
        .custom-scrollbar-message::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar-message::-webkit-scrollbar-thumb {
          background-color: rgb(var(--primary-default));
          border-radius: 20px;
        }
        .custom-scrollbar-message::-webkit-scrollbar-thumb:hover {
          background-color: rgb(var(--primary-dark));
        }
      `}</style>
      <div className={`@container fixed inset-0 top-[60px] ${getSidebarOffset()}`}>
        <div className="grid grid-cols-12 gap-0 h-full overflow-hidden bg-white dark:bg-gray-50">
          {/* Sidebar - Contact List */}
          <div
            className={`col-span-12 border-r border-gray-200 dark:border-gray-300 @lg:col-span-4 @xl:col-span-3 h-full min-h-0 ${
              showChat ? 'hidden @lg:block' : 'block'
            }`}
          >
            <div className="flex h-full flex-col">
              {/* Header with Phone Number Selector */}
              <div className="border-b border-gray-200 p-4">
                <div className="mb-4">
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    WhatsApp Number
                  </label>
                  <Select
                    value={selectedPhoneNumberId}
                    onChange={(selected: any) => {
                      console.log('Selected:', selected);
                      const value = typeof selected === 'string' ? selected : selected?.value;
                      console.log('Setting phoneNumberId:', value);
                      setSelectedPhoneNumberId(value || '');
                    }}
                    options={phoneNumbers.map((phone) => ({
                      label: phone.verifiedName || phone.displayPhoneNumber,
                      value: phone.id,
                      phoneNumber: phone.displayPhoneNumber,
                      status: phone.qualityRating,
                    }))}
                    displayValue={(option: any) => {
                      const phoneNumber = typeof option === 'string' 
                        ? phoneNumbers.find(p => p.id === option)?.displayPhoneNumber 
                        : option?.phoneNumber;
                      return (
                        <span className="flex items-center gap-2">
                          <span className="text-green-600">📱</span>
                          <span className="font-medium">{phoneNumber}</span>
                        </span>
                      );
                    }}
                    getOptionDisplayValue={(option: any) => (
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.phoneNumber}</div>
                        </div>
                      </div>
                    )}
                    placeholder="Select WhatsApp Number"
                    className="w-full"
                  />
                </div>
                <Input
                  type="search"
                  placeholder="Search Contact"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Contact List */}
              <div 
                className="flex-1 overflow-y-auto min-h-0 custom-scrollbar"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  // Trigger when within 10px of bottom
                  const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 10;
                  if (isNearBottom && hasMoreContacts && !loading) {
                    console.log('[DEBUG] Loading more contacts, page:', contactPage + 1);
                    loadContacts(contactPage + 1, true);
                  }
                }}
              >
                <div className="flex gap-2 border-b border-gray-200 px-4 py-3">
                  <Button
                    size="sm"
                    variant={chatFilter === 'all' ? 'solid' : 'outline'}
                    onClick={() => setChatFilter('all')}
                    className="flex-1"
                  >
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={chatFilter === 'unread' ? 'solid' : 'outline'}
                    onClick={() => setChatFilter('unread')}
                    className="flex-1"
                  >
                    Unread
                  </Button>
                </div>

                {(loading && contacts.length === 0) ? (
                  // Initial Loading Skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border-b border-gray-100 animate-pulse">
                      <div className="h-10 w-10 rounded-full bg-gray-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded" />
                        <div className="h-3 w-1/2 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))
                ) : filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations</div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactClick(contact)}
                      className={`flex w-full items-center gap-2 border-b border-gray-100 p-2 text-left transition-colors hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <Avatar
                        src={contact.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.profileName || contact.phoneNumber)}`}
                        name={contact.profileName || contact.phoneNumber}
                        className="h-10 w-10"
                      />
                      <div className="flex-1 min-w-0">
                        <h6 className="text-xs font-semibold truncate">
                          {contact.profileName || contact.phoneNumber}
                        </h6>
                        <p className="text-[10px] text-gray-500 truncate">
                          {contact.phoneNumber}
                        </p>
                        <p className="truncate text-[10px] text-gray-600">
                          {contact.lastMessage?.textBody || `[${contact.lastMessage?.messageType}]` || 'No messages'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {contact.lastMessage && (
                          <span className="text-[10px] text-gray-500">
                            {(() => {
                              const date = new Date(contact.lastMessage.timestamp);
                              const now = new Date();
                              const diff = differenceInCalendarDays(now, date);
                              
                              if (diff >= 1) {
                                return format(date, 'dd/MM/yyyy');
                              }
                              
                              return formatDistanceToNow(date, { addSuffix: true })
                                .replace('about ', '')
                                .replace('less than a minute ago', 'just now');
                            })()}
                          </span>
                        )}
                        {contact.unreadCount > 0 && (
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                            {contact.unreadCount}
                          </span>
                        )}
                        {contact.isSessionActive && (
                          <span className="text-[10px] text-green-600">
                            ⏱ {Math.floor(contact.sessionRemainingSeconds / 3600)}h
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Chat Area - Will continue in next part... */}
          <div
            className={`col-span-12 @lg:col-span-8 @xl:col-span-9 h-full min-h-0 ${
              !showChat && !selectedContact ? 'hidden @lg:flex' : 'flex'
            }`}
          >
            {selectedContact ? (
              <div 
                className="flex h-full w-full flex-col relative"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Drop Zone Overlay */}
                {isDragging && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary rounded-lg">
                    <div className="text-center">
                      <PiPaperclipHorizontal className="h-16 w-16 mx-auto text-primary mb-2" />
                      <p className="text-lg font-semibold text-primary">Drop file here</p>
                      <p className="text-sm text-gray-600">Image, Video, Audio, or Document</p>
                    </div>
                  </div>
                )}
                {/* Chat Header */}
                <div className="flex items-center justify-between border-b border-gray-200 p-4 flex-shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="text"
                      className="@lg:hidden p-0 h-auto hover:bg-transparent"
                      onClick={handleBackToList}
                    >
                      <PiArrowLeft className="h-6 w-6" />
                    </Button>
                    <Avatar
                      src={selectedContact.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedContact.profileName || selectedContact.phoneNumber)}`}
                      name={selectedContact.profileName || selectedContact.phoneNumber}
                      className="h-10 w-10"
                    />
                    <div>
                      <h6 className="text-sm font-semibold">{selectedContact.profileName || selectedContact.phoneNumber}</h6>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">
                          {selectedContact.isSessionActive && selectedContact.sessionExpiresAt ? (
                            <span className="text-green-600 font-bold tabular-nums">
                              Session: <SessionTimer expiresAt={selectedContact.sessionExpiresAt} />
                            </span>
                          ) : (
                            <span className="text-red-600">Session expired</span>
                          )}
                        </p>
                        <span className="text-gray-300">|</span>
                        <ContactTags 
                          contact={selectedContact} 
                          onUpdate={(updatedContact) => {
                            // Update local contact state and list
                            setSelectedContact(updatedContact);
                            setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0 custom-scrollbar-message">
                  <div className="space-y-1">
                    {messages.map((msg) => {
                      const isOwn = msg.direction === 'outgoing';
                      return (
                        <div
                          key={msg.id}
                          className={`group flex items-start gap-1 ${isOwn ? 'flex-row-reverse' : ''} animate-fade-in-up`}
                        >
                          <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                            {/* User name for outgoing messages */}
                            {isOwn && msg.user && (
                              <div className={`text-[10px] font-medium mb-0.5 px-2 ${
                                isOwn
                                  ? 'text-blue-600 dark:text-blue-400 text-right'
                                  : 'text-gray-600 dark:text-gray-400 text-left'
                              }`}>
                                {msg.user.username}
                              </div>
                            )}

                            {/* Message Content */}
                            <div
                              className={`rounded-2xl px-3 py-1.5 ${
                                isOwn
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 shadow-sm'
                              } relative transition-all hover:shadow-lg`}
                            >
                              {msg.messageType === 'reaction' ? (
                                // Reaction message - just show the emoji
                                <div className="flex items-center gap-2">
                                  <span className="text-3xl">{msg.reactionEmoji || '👍'}</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                  </div>
                                </div>
                              ) : msg.mediaUrl ? (
                                <div className="flex flex-col">
                                  {msg.messageType === 'image' && (
                                    <img 
                                      src={msg.mediaUrl} 
                                      alt="Image" 
                                      className="max-w-sm rounded mb-2 cursor-pointer hover:opacity-90 transition-opacity" 
                                      onClick={() => {
                                        setLightboxSlides([{
                                          src: msg.mediaUrl,
                                          alt: 'Image',
                                        }]);
                                        setLightboxOpen(true);
                                      }}
                                    />
                                  )}
                                  {msg.messageType === 'sticker' && (
                                    <img src={msg.mediaUrl} alt="Sticker" className="max-w-[200px] mb-2" />
                                  )}
                                  {msg.messageType === 'video' && (
                                    <video 
                                      src={msg.mediaUrl} 
                                      controls 
                                      className="max-w-sm rounded mb-2 cursor-pointer"
                                      onClick={(e) => {
                                        // If clicking on video (not controls), open in lightbox
                                        if (e.target === e.currentTarget) {
                                          setLightboxSlides([{
                                            type: 'video',
                                            sources: [{
                                              src: msg.mediaUrl,
                                              type: 'video/mp4',
                                            }],
                                          }]);
                                          setLightboxOpen(true);
                                        }
                                      }}
                                    />
                                  )}
                                  {msg.messageType === 'audio' && (
                                    <audio src={msg.mediaUrl} controls className="mb-2" />
                                  )}
                                  {msg.messageType === 'document' && (
                                    <a
                                      href={msg.mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`flex items-center gap-3 p-3 rounded-lg mb-2 transition-colors ${
                                        isOwn 
                                          ? 'bg-blue-400/30 hover:bg-blue-400/40' 
                                          : 'bg-gray-200/80 hover:bg-gray-300/80'
                                      }`}
                                    >
                                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                                        isOwn ? 'bg-blue-300/50' : 'bg-gray-300'
                                      }`}>
                                        <PiFileText className="w-5 h-5 text-gray-700" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${
                                          isOwn ? 'text-white' : 'text-gray-800'
                                        }`}>
                                          {msg.mediaFilename || 'Document'}
                                        </p>
                                        <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                          PDF • Tap to open
                                        </p>
                                      </div>
                                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                        isOwn ? 'bg-blue-300/50' : 'bg-gray-300'
                                      }`}>
                                        <PiDownload className="w-4 h-4 text-gray-700" />
                                      </div>
                                    </a>
                                  )}
                                  {(msg.mediaCaption || msg.textBody) && <p className="text-sm mb-1 whitespace-pre-wrap">{msg.mediaCaption || msg.textBody}</p>}
                                  
                                  {/* Timestamp & Status for Media */}
                                  <div className="flex justify-end items-center gap-1 mt-1">
                                     <span className={`text-[10px] ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                    {isOwn && <span className={isOwn ? 'text-white' : ''}>{getStatusIcon(msg.status)}</span>}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-end gap-2 flex-wrap">
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.textBody}</p>
                                  <div className="flex-1 min-w-[60px]" />
                                  <div className="flex items-center gap-1.5 select-none flex-shrink-0">
                                    <span className={`text-[10px] font-medium leading-none ${
                                      isOwn
                                        ? 'text-white opacity-90'
                                        : 'text-gray-500 dark:text-gray-400'
                                    }`}>
                                      {format(new Date(msg.timestamp), 'HH:mm')}
                                    </span>
                                    {isOwn && (
                                      <span className="flex-shrink-0 leading-none opacity-90">
                                        {getStatusIcon(msg.status)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
                  {!selectedContact.isSessionActive && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                      ⚠️ Session expired. You can only send template messages.
                    </div>
                  )}

                  {/* Attachment Preview */}
                  {pendingAttachment && (
                    <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                      {pendingAttachment.preview ? (
                        <img 
                          src={pendingAttachment.preview} 
                          alt="Preview" 
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          {pendingAttachment.type === 'video' && <PiVideoCamera className="h-6 w-6 text-gray-500" />}
                          {pendingAttachment.type === 'audio' && <PiMicrophone className="h-6 w-6 text-gray-500" />}
                          {pendingAttachment.type === 'document' && <PiFileText className="h-6 w-6 text-gray-500" />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pendingAttachment.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(pendingAttachment.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <ActionIcon variant="text" onClick={cancelAttachment}>
                        <PiX className="h-5 w-5" />
                      </ActionIcon>
                    </div>
                  )}

                  {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'image')}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'video')}
                  />
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'audio')}
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'document')}
                  />

                  <div className="flex items-end gap-2">
                    {/* Attachment Button */}
                    <div className="relative" ref={attachmentMenuRef}>
                      <ActionIcon
                        variant="text"
                        onClick={toggleAttachmentMenu}
                        disabled={!selectedContact.isSessionActive}
                      >
                        <PiPaperclipHorizontal className="h-6 w-6" />
                      </ActionIcon>
                      
                      {showAttachmentMenu && (
                        <div className="absolute bottom-full left-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <PiImage className="h-4 w-4" /> Photo
                          </button>
                          <button
                            onClick={() => videoInputRef.current?.click()}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <PiVideoCamera className="h-4 w-4" /> Video
                          </button>
                          <button
                            onClick={() => documentInputRef.current?.click()}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <PiFileText className="h-4 w-4" /> Document
                          </button>
                          <button
                            onClick={() => audioInputRef.current?.click()}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                          >
                            <PiMicrophone className="h-4 w-4" /> Audio
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 relative">
                      {/* Suggestions Dropdown */}
                      {showSuggestions && filteredQuickReplies.length > 0 && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                          {filteredQuickReplies.map((qr, index) => (
                            <button
                              key={qr.id}
                              onClick={() => handleQuickReply(qr)}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                                index === selectedSuggestionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
                              }`}
                            >
                              <div className="font-medium text-sm">/{qr.shortcut}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{qr.text}</div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <Textarea
                        ref={textareaRef}
                        value={messageInput}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        onPaste={handlePaste}
                        placeholder={selectedContact.isSessionActive ? "Type a message..." : "Session expired. User must reply to open 24h window."}
                        disabled={sending || !selectedContact.isSessionActive}
                        className="w-full resize-none"
                        rows={1}
                      />
                    </div>

                    {/* Emoji Button */}
                    <div className="relative" ref={emojiPickerRef}>
                      <ActionIcon
                        variant="text"
                        onClick={toggleEmojiPicker}
                        disabled={!selectedContact.isSessionActive}
                      >
                        <PiSmiley className="h-6 w-6" />
                      </ActionIcon>
                      
                      {showEmojiPicker && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-8 gap-1">
                          {defaultEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiClick(emoji)}
                              className="text-2xl hover:bg-gray-100 rounded p-1"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Send Button */}
                    <Button
                      onClick={handleSendMessage}
                      disabled={(!messageInput?.trim() && !pendingAttachment) || sending || !selectedContact.isSessionActive}
                      size="sm"
                    >
                      {sending ? 'Sending...' : <PiPaperPlaneTilt className="h-5 w-5" />}
                    </Button>
                  </div>

                  {/* Quick Replies */}
                  <div className="mt-2 relative" ref={quickReplyRef}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleQuickReplies}
                      disabled={!selectedContact.isSessionActive}
                      className="gap-2"
                    >
                      <PiLightning className="h-4 w-4" />
                      Quick Replies
                    </Button>

                    {showQuickReplies && (
                      <div className="absolute bottom-full left-0 mb-2 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 space-y-1">
                        {quickReplies.map((reply) => (
                          <button
                            key={reply.id}
                            onClick={() => handleQuickReply(reply)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
                          >
                            {reply.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <PiEnvelope className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-lg font-medium">Select a conversation</p>
                  <p className="mt-1 text-sm">Choose a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for images/videos */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        plugins={[Video, Zoom]}
      />
    </>
  );
}
