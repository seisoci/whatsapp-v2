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
    if (params.contactId) {
      try {
        await this.storeOutgoingMessage({
          contactId: params.contactId,
          phoneNumberId: params.internalPhoneNumberId || params.phoneNumberId,
          wamid: result?.messages?.[0]?.id || null,
          toNumber: params.to,
          fromNumber: params.to,
          messageType: 'text',
          textBody: params.text,
          status: 'sent',
        });
        console.log('✅ Outgoing message saved to database');
      } catch (dbError: any) {
        console.error('❌ Failed to store outgoing message:', dbError.message);
        console.error('Full error:', dbError);
      }
    }

    return result;
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
        phoneNumberId: params.phoneNumberId,
        wamid: result.messages[0].id,
        toNumber: params.to,
        fromNumber: params.phoneNumberId,
        messageType: 'template',
        templateName: params.templateName,
        templateLanguage: params.templateLanguage,
        templateComponents: params.components,
        status: 'sent',
      });
    }

    return result;
  }

  /**
   * Send media message (image, video, document, audio)
   */
  static async sendMediaMessage(params: {
    phoneNumberId: string;
    accessToken: string;
    to: string;
    mediaType: 'image' | 'video' | 'document' | 'audio';
    mediaId?: string;
    mediaUrl?: string;
    caption?: string;
    filename?: string;
    contactId?: string;
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

    return await response.json();
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
    status: string;
  }): Promise<Message> {
    const messageRepo = AppDataSource.getRepository(Message);
    
    const message = messageRepo.create({
      wamid: params.wamid,
      contactId: params.contactId,
      phoneNumberId: params.phoneNumberId,
      direction: 'outgoing',
      messageType: params.messageType as any,
      status: params.status as any,
      fromNumber: params.fromNumber,
      toNumber: params.toNumber,
      textBody: params.textBody,
      templateName: params.templateName,
      templateLanguage: params.templateLanguage,
      templateComponents: params.templateComponents,
      timestamp: new Date(),
      sentAt: new Date(),
    });

    return await messageRepo.save(message);
  }

  /**
   * Update message status
   */
  static async updateMessageStatus(params: {
    wamid: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
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

    message.status = params.status;
    
    switch (params.status) {
      case 'sent':
        message.sentAt = params.timestamp;
        break;
      case 'delivered':
        message.deliveredAt = params.timestamp;
        break;
      case 'read':
        message.readAt = params.timestamp;
        break;
      case 'failed':
        message.failedAt = params.timestamp;
        message.errorCode = params.errorCode || null;
        message.errorMessage = params.errorMessage || null;
        break;
    }

    await messageRepo.save(message);
  }
}
