/**
 * Chat Types
 * Type definitions for chat functionality
 */

export interface Contact {
  id: string;
  waId: string;
  phoneNumber: string;
  profileName: string | null;
  businessName: string | null;
  profilePictureUrl: string | null;
  isBusinessAccount: boolean;
  isBlocked: boolean;
  tags: Tag[];
  notes: string | null;
  sessionExpiresAt: string | null;
  isSessionActive: boolean;
  sessionRemainingSeconds: number;
  lastMessage: {
    id: string;
    messageType: string;
    textBody: string | null;
    mediaCaption: string | null;
    direction: string;
    timestamp: string;
    status: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  wamid: string;
  contactId: string;
  messageType: string;
  textBody: string | null;
  mediaUrl: string | null;
  mediaCaption: string | null;
  mediaFilename: string | null;
  mediaMimeType: string | null;
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  status: string;
  readAt: string | null;
  reactionEmoji?: string | null;
  reactionMessageId?: string | null;
  // User info (for outgoing messages)
  userId?: string | null;
  user?: {
    id: string;
    username: string;
    email: string;
    isActive: boolean;
    emailVerified: boolean;
    roleId: string;
  } | null;
}

export interface SendMessageRequest {
  contactId: string;
  phoneNumberId: string;
  type: 'text' | 'template' | 'image' | 'video' | 'document' | 'audio';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language?: string;
    components?: any[];
  };
  media?: {
    mediaId?: string;
    mediaUrl?: string;
    caption?: string;
    filename?: string;
  };
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}
