/**
 * WhatsApp Messaging Service
 * Handles message sending with session management and validation
 */

import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { PhoneNumber } from '../models/PhoneNumber';
import {WhatsAppService } from './whatsapp.service';

const WHATSAPP_API_BASE_URL = process.env.WHATSAPP_API_VERSION 
  ? `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION}`
  : 'https://graph.facebook.com/v18.0';

interface SessionStatus {
  canSend: boolean;
  isSessionActive: boolean;
  sessionRemainingSeconds: number | null;
  reason?: string;
}

export class WhatsAppMessagingService {
  /**
   * Check if we can send a message to this contact
   * based on 24-hour session window
   */
  static async checkSessionStatus(contactId: string): Promise<SessionStatus> {
    const contactRepo = AppDataSource.getRepository(Contact);
    const contact = await contactRepo.findOne({ where: { id: contactId } });

    if (!contact) {
      return {
        canSend: false,
        isSessionActive: false,
        sessionRemainingSeconds: null,
        reason: 'Contact not found',
      };
    }

    // Check computed column
    if (contact.isSessionActive && contact.sessionRemainingSeconds > 0) {
      return {
        canSend: true,
        isSessionActive: true,
        sessionRemainingSeconds: contact.sessionRemainingSeconds,
      };
    }

    return {
      canSend: false,
      isSessionActive: false,
      sessionRemainingSeconds: 0,
      reason: 'Session expired. Use template message instead.',
    };
  }

  /**
   * Update contact session when customer sends message
   */
  static async updateCustomerSession(contactId: string, messageTimestamp: Date): Promise<void> {
    const contactRepo = AppDataSource.getRepository(Contact);
    const contact = await contactRepo.findOne({ where: { id: contactId } });

    if (!contact) {
      throw new Error('Contact not found');
    }

    // Update session timestamps
    contact.lastCustomerMessageAt = messageTimestamp;
    // Session expires 24 hours after customer message
    contact.sessionExpiresAt = new Date(messageTimestamp.getTime() + 24 * 60 * 60 * 1000);
    
    if (!contact.firstMessageAt) {
      contact.firstMessageAt = messageTimestamp;
    }
    
    contact.lastMessageAt = messageTimestamp;

    await contactRepo.save(contact);
  }

  /**
   * Send text message
   */
  static async sendTextMessage(params: {
    phoneNumberId: string;  // WhatsApp numeric ID for API
    internalPhoneNumberId?: string;  // Internal UUID for database
    accessToken: string;
    to: string;
    text: string;
    contactId?: string;
    preview_url?: boolean;
    userId?: string;  // User who sent the message
  }): Promise<any> {
    // Validate session if contactId provided
    if (params.contactId) {
      const sessionStatus = await this.checkSessionStatus(params.contactId);
      if (!sessionStatus.canSend) {
        throw new Error(
          sessionStatus.reason || 'Cannot send message. Session expired. Use template message.'
        );
      }
    }

    const response = await fetch(`${WHATSAPP_API_BASE_URL}/${params.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'text',
        text: {
          body: params.text,
          preview_url: params.preview_url || false,
        },
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Failed to send message');
    }

    const result: any = await response.json();

    // Store message in database (don't fail send if this fails)
    let savedMessage = null;
    if (params.contactId) {
      try {
        savedMessage = await this.storeOutgoingMessage({
          contactId: params.contactId,
          phoneNumberId: params.internalPhoneNumberId || params.phoneNumberId,
          wamid: result?.messages?.[0]?.id || null,
          toNumber: params.to,
          fromNumber: params.to,
          messageType: 'text',
          textBody: params.text,
          status: 'sent',
          userId: params.userId,  // Add userId
        });
        console.log('✅ Outgoing message saved to database');
      } catch (dbError: any) {
        console.error('❌ Failed to store outgoing message:', dbError.message);
        console.error('Full error:', dbError);
      }
    }

    // Return both WhatsApp API response and saved message
    return {
      ...result,
      savedMessage,
    };
  }

  /**
   * Send template message (for messages outside 24-hour window)
   */
  static async sendTemplateMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    templateName: string;
    templateLanguage: string;
    components?: any[];
    contactId?: string;
    internalPhoneNumberId?: string; // Add internalPhoneNumberId for DB storage
    userId?: string; // Add userId
  }): Promise<any> {
    const response = await fetch(`${WHATSAPP_API_BASE_URL}/${params.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: 'template',
        template: {
          name: params.templateName,
          language: {
            code: params.templateLanguage,
          },
          components: params.components || [],
        },
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Failed to send template message');
    }

    const result: any = await response.json();

    // Store message in database
    if (params.contactId) {
      await this.storeOutgoingMessage({
        contactId: params.contactId,
        phoneNumberId: params.internalPhoneNumberId || params.phoneNumberId,
        wamid: result.messages[0].id,
        toNumber: params.to,
        fromNumber: params.phoneNumberId,
        messageType: 'template',
        templateName: params.templateName,
        templateLanguage: params.templateLanguage,
        templateComponents: params.components,
        status: 'sent',
        userId: params.userId, // Pass userId
      });
    }

    return result;
  }

  /**
   * Send media message (image, video, document, audio)
   */
  static async sendMediaMessage(params: {
    phoneNumberId: string;
    internalPhoneNumberId?: string;  // Internal UUID for database
    accessToken: string;
    to: string;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaId?: string;
    mediaUrl?: string;
    caption?: string;
    filename?: string;
    contactId?: string;
    userId?: string;  // User who sent the message
  }): Promise<any> {
    // Validate session if contactId provided
    if (params.contactId) {
      const sessionStatus = await this.checkSessionStatus(params.contactId);
      if (!sessionStatus.canSend) {
        throw new Error(sessionStatus.reason || 'Session expired');
      }
    }

    const mediaObject: any = {};
    if (params.mediaId) {
      mediaObject.id = params.mediaId;
    } else if (params.mediaUrl) {
      mediaObject.link = params.mediaUrl;
    }

    if (params.caption) {
      mediaObject.caption = params.caption;
    }

    if (params.filename && params.mediaType === 'document') {
      mediaObject.filename = params.filename;
    }

    const response = await fetch(`${WHATSAPP_API_BASE_URL}/${params.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: params.to,
        type: params.mediaType,
        [params.mediaType]: mediaObject,
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.error?.message || 'Failed to send media message');
    }

    const result: any = await response.json();

    // Store message in database (don't fail send if this fails)
    let savedMessage = null;
    if (params.contactId) {
      try {
        savedMessage = await this.storeOutgoingMessage({
          contactId: params.contactId,
          phoneNumberId: params.internalPhoneNumberId || params.phoneNumberId,
          wamid: result?.messages?.[0]?.id || null,
          toNumber: params.to,
          fromNumber: params.to,
          messageType: params.mediaType,
          textBody: params.caption,
          mediaUrl: params.mediaUrl,
          mediaId: params.mediaId,
          mediaFilename: params.filename,
          status: 'sent',
          userId: params.userId,  // Add userId
        });
        console.log('✅ Outgoing media message saved to database');
      } catch (dbError: any) {
        console.error('❌ Failed to store outgoing media message:', dbError.message);
        console.error('Full error:', dbError);
      }
    }

    // Return both WhatsApp API response and saved message
    return {
      ...result,
      savedMessage,
    };
  }

  /**
   * Store outgoing message in database
   */
  private static async storeOutgoingMessage(params: {
    contactId: string;
    phoneNumberId: string;
    wamid: string;
    toNumber: string;
    fromNumber: string;
    messageType: string;
    textBody?: string;
    templateName?: string;
    templateLanguage?: string;
    templateComponents?: any;
    mediaUrl?: string;
    mediaId?: string;
    mediaFilename?: string;
    status: string;
    userId?: string;  // User who sent the message
  }): Promise<Message> {
    const messageRepo = AppDataSource.getRepository(Message);
    const contactRepo = AppDataSource.getRepository(Contact);

    console.log('💾 Storing message with userId:', params.userId);

    // Create and save message
    const message = messageRepo.create({
      wamid: params.wamid,
      contactId: params.contactId,
      phoneNumberId: params.phoneNumberId,
      userId: params.userId,  // Add userId
      direction: 'outgoing',
      messageType: params.messageType as any,
      status: params.status as any,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      textBody: params.textBody,
      templateName: params.templateName,
      templateLanguage: params.templateLanguage,
      templateComponents: params.templateComponents,
      mediaUrl: params.mediaUrl,
      mediaId: params.mediaId,
      mediaFilename: params.mediaFilename,
      timestamp: new Date(),
      sentAt: new Date(),
    });

    const savedMessage = await messageRepo.save(message);

    // Update contact's lastMessageAt to ensure it moves to top
    // Run this async to not block the response if needed, but here we wait for consistency
    try {
      await contactRepo.update(
        { id: params.contactId },
        {
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      );
      console.log(`Updated lastMessageAt for contact ${params.contactId}`);
    } catch (error) {
       console.error(`Failed to update contact lastMessageAt:`, error);
    }

    // Reload message with user relation
    const messageWithUser = await messageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['user'],
    });

    return messageWithUser || savedMessage;
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(params: {
    wamid: string;
    status: 'sent' | 'delivered' | 'read' | 'failed' | 'played';
    timestamp: Date;
    errorCode?: number;
    errorMessage?: string;
  }): Promise<void> {
    const messageRepo = AppDataSource.getRepository(Message);
    
    const message = await messageRepo.findOne({ where: { wamid: params.wamid } });
    if (!message) {
      console.warn(`Message not found for wamid: ${params.wamid}`);
      return;
    }

    // Status Hierarchy Logic to prevent race conditions (e.g. 'delivered' arriving before 'sent')
    const statusPriority: Record<string, number> = {
      'pending': 0,
      'sent': 1,
      'delivered': 2,
      'read': 3,
      'failed': 4,
      'played': 5 // Highest priority as per user request
    };

    const currentPriority = statusPriority[message.status as keyof typeof statusPriority] || 0;
    const newPriority = statusPriority[params.status as keyof typeof statusPriority] || 0;

    // Special case: Allow 'failed' to overwrite 'sent' or 'delivered' but not 'read' or 'played'
    // General rule: Only update if new priority is higher
    if (newPriority <= currentPriority && message.status !== 'failed') {
      console.log(`[Status] Ignoring update ${params.status} for message ${message.wamid} (Current: ${message.status})`);
      return;
    }

    message.status = params.status;
    
    switch (params.status) {
      case 'sent':
        // Only update if sentAt is not already set (preserve original sent time)
        if (!message.sentAt) message.sentAt = params.timestamp;
        break;
      case 'delivered':
        if (!message.deliveredAt) message.deliveredAt = params.timestamp;
        break;
      case 'read':
        if (!message.readAt) message.readAt = params.timestamp;
        break;
      case 'played':
        // Treated same as read, but specific for media
        if (!message.readAt) message.readAt = params.timestamp;
        break;
      case 'failed':
        if (!message.failedAt) message.failedAt = params.timestamp;
        message.errorCode = params.errorCode || null;
        message.errorMessage = params.errorMessage || null;
        break;
    }

    await messageRepo.save(message);
  }
}
