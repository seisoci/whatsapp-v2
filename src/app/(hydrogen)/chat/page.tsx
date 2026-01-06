'use client';

/**
 * WhatsApp Chat Page
 * Real-time chat interface with WhatsApp Business API integration
 */

import { Avatar, Button, Input, ActionIcon, Drawer, Textarea, Popover, Select } from 'rizzui';
import {
  PiPaperclip,
  PiPhone,
  PiSmiley,
  PiVideo,
  PiArrowLeft,
  PiImage,
  PiPaperPlaneTilt,
  PiEnvelope,
  PiMapPin,
  PiCalendar,
  PiUser,
  PiX,
  PiShareNetwork,
  PiTrash,
  PiExport,
  PiWarning,
  PiFolder,
  PiFileText,
  PiFilePdf,
  PiStar,
  PiGlobe,
  PiLightning,
  PiCheck,
  PiChecks,
  PiXCircle,
  PiPlayCircle,
  PiDownload,
  PiFileDoc,
  PiPause,
  PiArrowsOut,
  PiHeadset,
} from 'react-icons/pi';
import React, { useState, useRef, useEffect } from 'react';
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import { getChatContacts, getChatMessages, sendChatMessage, markConversationAsRead, type Contact, type Message } from '@/lib/api/chat';
import { chatWebSocket } from '@/lib/websocket/chat-websocket';
import { getAllPhoneNumbers } from '@/lib/api/phone-numbers';
import { formatDistanceToNow } from 'date-fns';

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

const quickReplies = [
  { id: 1, text: 'Saya berminat dengan potongan harga 10% yang ditawarkan', value: 'DISC10' },
  { id: 2, text: 'Apakah bisa mendapatkan potongan harga 20% untuk pembelian ini?', value: 'DISC20' },
  { id: 3, text: 'Saya tertarik dengan penawaran diskon 30%, mohon info lebih lanjut', value: 'DISC30' },
  { id: 4, text: 'Bisakah memberikan potongan harga hingga 50% untuk transaksi ini?', value: 'DISC50' },
  { id: 5, text: 'Saya akan melakukan pembayaran secara penuh sekarang', value: 'FULL' },
  { id: 6, text: 'Apakah bisa melakukan pembayaran bertahap atau cicilan?', value: 'PARTIAL' },
  { id: 7, text: 'Terima kasih banyak atas informasi dan bantuannya', value: 'Thanks' },
  { id: 8, text: 'Iya benar, saya setuju dengan penawaran tersebut', value: 'Yes' },
  { id: 9, text: 'Tidak, terima kasih. Saya pertimbangkan dulu', value: 'No' },
  { id: 10, text: 'Mohon kirimkan informasi lengkap mengenai produk dan harga', value: 'MoreInfo' },
  { id: 11, text: 'Tolong hubungi saya kembali nanti, saya sedang sibuk sekarang', value: 'CallLater' },
  { id: 12, text: 'Boleh minta dikirimkan katalog produk lengkap beserta harganya?', value: 'SendCatalog' },
];

export default function ChatPage() {
  // State
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [selectedPhoneNumberId, setSelectedPhoneNumberId] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'favorite'>('all');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlides, setLightboxSlides] = useState<any[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPage, setContactPage] = useState(1);
  const [hasMoreContacts, setHasMoreContacts] = useState(true);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickReplyRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load phone numbers on mount
  useEffect(() => {
    loadPhoneNumbers();
    connectWebSocket();
  }, []);

  // Load contacts when phone number selected
  useEffect(() => {
    if (selectedPhoneNumberId) {
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
  }, [selectedPhoneNumberId]);

  // Load messages when contact selected
  useEffect(() => {
    if (selectedContact) {
      loadMessages();
    }
  }, [selectedContact?.id]);

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
        
        // Format message to match frontend state structure (for Chat Window)
        const formattedMessage = {
          id: rawMessage.id,
          role: rawMessage.direction === 'outgoing' ? 'user' : 'assistant',
          // Map to textBody and messageType as expected by the rendering loop
          textBody: rawMessage.textBody || rawMessage.mediaCaption || (rawMessage.mediaUrl ? rawMessage.mediaUrl : ''),
          status: rawMessage.status,
          timestamp: rawMessage.timestamp,
          messageType: rawMessage.messageType,
          mediaUrl: rawMessage.mediaUrl,
          mediaType: rawMessage.mediaMimeType,
          fileName: rawMessage.mediaFilename,
          fileSize: rawMessage.mediaFileSize,
          // Keep content/type as fallback if needed by other components, but main usage is messageType/textBody
          content: rawMessage.textBody || rawMessage.mediaCaption || (rawMessage.mediaUrl ? rawMessage.mediaUrl : ''),
          type: rawMessage.messageType,
          direction: rawMessage.direction, // Add direction for isOwn check
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
                // Content will now contain mediaUrl if caption is empty. Use it, or fallback to type.
                textBody: formattedMessage.content || `[${rawMessage.messageType}]`,
                mediaCaption: rawMessage.mediaCaption || null,
                direction: rawMessage.direction,
                timestamp: rawMessage.timestamp,
                status: rawMessage.status || 'delivered',
              },
              lastMessageTimestamp: rawMessage.timestamp,
              // Increment unread count if message is incoming and not currently selected
              unreadCount: (rawMessage.direction === 'incoming' && selectedContact?.id !== contactId)
                ? (prevContacts[contactIndex].unreadCount || 0) + 1
                : prevContacts[contactIndex].unreadCount
            };
            
            // Remove from old position and add to top
            const newContacts = [...prevContacts];
            newContacts.splice(contactIndex, 1);
            return [updatedContact, ...newContacts];
          } 
          // If new contact (not in list), reload specific contact or full list
          // For safety, reload all for now if we miss a contact
          else {
            loadContacts();
            return prevContacts;
          }
        });

        // If this contact's conversation is open, add message
        if (event.data.contactId === selectedContact?.id) {
          console.log('[WS] Adding message to current conversation:', formattedMessage);
          setMessages(prev => [...prev, formattedMessage]);
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
      const response = await getAllPhoneNumbers();
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
      const response = await getChatContacts({
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
      const response = await getChatMessages({
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
      await markConversationAsRead(contact.id);
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
    if (!messageInput.trim() || !selectedContact || sending) return;

    const optimisticMessage = {
      id: `temp-${Date.now()}`, // Temporary ID
      wamid: null,
      contactId: selectedContact.id,
      messageType: 'text',
      textBody: messageInput.trim(),
      mediaUrl: null,
      mediaCaption: null,
      mediaFilename: null,
      mediaMimeType: null,
      direction: 'outgoing' as const,
      timestamp: new Date().toISOString(),
      status: 'pending',
      readAt: null,
    };

    const messageToSend = messageInput.trim();
    setMessageInput(''); // Clear input immediately
    setMessages(prev => [...prev, optimisticMessage]); // Add to UI optimistically

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setSending(true);
    try {
      const result = await sendChatMessage({
        contactId: selectedContact.id,
        phoneNumberId: selectedPhoneNumberId,
        type: 'text',
        text: {
          body: messageToSend,
        },
      });

      // Update optimistic message with real data (keep temp ID until it's replaced by DB data)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, wamid: result.data?.messages?.[0]?.id || null, status: 'sent' }
            : msg
        )
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
      
      alert(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleQuickReply = (text: string) => {
    setMessageInput(text);
    setShowQuickReplies(false);
  };

  const toggleQuickReplies = () => {
    setShowQuickReplies((prev) => !prev);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    };

    if (showEmojiPicker || showQuickReplies) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker, showQuickReplies]);

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
      <div className="@container fixed inset-0 top-[60px]">
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
                className="flex-1 overflow-y-auto min-h-0"
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

                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
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
                            {formatDistanceToNow(new Date(contact.lastMessage.timestamp), { addSuffix: true })}
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
              <div className="flex h-full w-full flex-col">
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
                      <p className="text-xs text-gray-500">
                        {selectedContact.isSessionActive ? (
                          <span className="text-green-600">
                            Session: {Math.floor(selectedContact.sessionRemainingSeconds / 3600)}h left
                          </span>
                        ) : (
                          <span className="text-red-600">Session expired</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 min-h-0">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.direction === 'outgoing';
                      return (
                        <div
                          key={msg.id}
                          className={`group flex items-start ${isOwn ? 'flex-row-reverse' : ''}`}
                        >
                          <div className={`max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                            <p className="mb-1 text-xs text-gray-500">
                              {isOwn ? 'You' : selectedContact.profileName || selectedContact.phoneNumber},{' '}
                              {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                            </p>

                            {/* Message Content */}
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                isOwn ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {msg.mediaUrl ? (
                                <div>
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
                                      className="text-blue-600 hover:underline"
                                    >
                                      📄 {msg.mediaFilename || 'Document'}
                                    </a>
                                  )}
                                  {msg.mediaCaption && <p className="text-sm mt-2">{msg.mediaCaption}</p>}
                                </div>
                              ) : (
                                <div className="flex items-end gap-2">
                                  <p className="text-sm flex-1">{msg.textBody}</p>
                                  {isOwn && <span className="flex-shrink-0">{getStatusIcon(msg.status)}</span>}
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

                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        ref={textareaRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder={selectedContact.isSessionActive ? "Type a message..." : "Session expired"}
                        disabled={sending || !selectedContact.isSessionActive}
                        className="w-full resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
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
                      disabled={!messageInput.trim() || sending || !selectedContact.isSessionActive}
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
                            onClick={() => handleQuickReply(reply.text)}
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
