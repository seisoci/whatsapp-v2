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
  isArchived: boolean;
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
  // Template fields
  templateName?: string | null;
  templateLanguage?: string | null;
  templateComponents?: TemplateComponent[] | null;
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

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | 'header' | 'body' | 'footer' | 'buttons';
  parameters?: TemplateParameter[];
  sub_type?: string;
  index?: number;
  text?: string; // For rendered text
}

export interface TemplateParameter {
  type: 'text' | 'image' | 'video' | 'document' | 'currency' | 'date_time' | 'payload';
  text?: string;
  image?: { link?: string; id?: string };
  video?: { link?: string; id?: string };
  document?: { link?: string; id?: string; filename?: string };
  currency?: { code: string; amount_1000: number; fallback_value: string };
  date_time?: { fallback_value: string };
  payload?: string;
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
