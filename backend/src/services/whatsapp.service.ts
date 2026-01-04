/**
 * WhatsApp Cloud API Service
 * Handles communication with Meta WhatsApp Business Platform
 */

import { env } from '../config/env';

const WHATSAPP_API_BASE_URL = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;

interface WhatsAppPhoneNumberInfo {
  id: string;
  display_phone_number: string;
  verified_name: string;
  quality_rating: string;
  messaging_limit_tier?: string;
  is_official_business_account?: boolean;
}

interface WhatsAppBusinessAccount {
  id: string;
  name: string;
  timezone_id: string;
  message_template_namespace?: string;
}

export class WhatsAppService {
  /**
   * Get Phone Number information from WhatsApp Cloud API
   */
  static async getPhoneNumberInfo(
    phoneNumberId: string,
    accessToken: string
  ): Promise<WhatsAppPhoneNumberInfo> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating,messaging_limit_tier,is_official_business_account`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get phone number info');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Get WhatsApp Business Account information
   */
  static async getBusinessAccountInfo(
    wabaId: string,
    accessToken: string
  ): Promise<WhatsAppBusinessAccount> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${wabaId}?fields=id,name,timezone_id,message_template_namespace`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get business account info');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Verify WhatsApp credentials
   */
  static async verifyCredentials(
    phoneNumberId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      await this.getPhoneNumberInfo(phoneNumberId, accessToken);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Register phone number (after verification)
   */
  static async registerPhoneNumber(
    phoneNumberId: string,
    accessToken: string,
    pin: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/register`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            pin: pin,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to register phone number');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Send test message to verify phone number is working
   */
  static async sendTestMessage(
    phoneNumberId: string,
    accessToken: string,
    toPhoneNumber: string,
    message: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: toPhoneNumber,
            type: 'text',
            text: {
              body: message,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send message');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Get messaging limits for phone number
   */
  static async getMessagingLimits(
    phoneNumberId: string,
    accessToken: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}?fields=messaging_limit_tier`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get messaging limits');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Request verification code (SMS or Voice)
   * Used when registering a new phone number
   */
  static async requestVerificationCode(
    phoneNumberId: string,
    accessToken: string,
    codeMethod: 'SMS' | 'VOICE' = 'SMS',
    language: string = 'en_US'
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/request_code`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code_method: codeMethod,
            language: language,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to request verification code');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Verify the code received via SMS or Voice
   */
  static async verifyCode(
    phoneNumberId: string,
    accessToken: string,
    code: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/verify_code`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to verify code');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Set two-step verification PIN
   * Adds an extra layer of security to WhatsApp Business Account
   */
  static async setTwoStepVerificationCode(
    phoneNumberId: string,
    accessToken: string,
    pin: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pin: pin,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to set two-step verification');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Get display name status (Beta)
   * Check the approval status of display name change request
   */
  static async getDisplayNameStatus(
    phoneNumberId: string,
    accessToken: string
  ): Promise<any> {
    try {
      const fields = 'about,address,description,email,profile_picture_url,websites,vertical,messaging_product';
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/whatsapp_business_profile?fields=${fields}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get display name status');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Update WhatsApp Business Profile
   * Can update display name, description, address, email, websites, etc.
   */
  static async updateBusinessProfile(
    phoneNumberId: string,
    accessToken: string,
    profileData: {
      about?: string;
      address?: string;
      description?: string;
      email?: string;
      profile_picture_handle?: string;
      websites?: string[];
      vertical?: string;
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/whatsapp_business_profile`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            ...profileData,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update business profile');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Upload media (image) to WhatsApp
   * Returns media handle (h) to be used in profile picture update
   */
  static async uploadMedia(
    phoneNumberId: string,
    accessToken: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<any> {
    try {
      // Create FormData for multipart upload
      const FormData = (await import('form-data')).default;
      const form = new FormData();

      form.append('messaging_product', 'whatsapp');
      form.append('file', fileBuffer, {
        filename: fileName,
        contentType: mimeType,
      });

      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...form.getHeaders(),
          },
          body: form as any,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to upload media');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Delete profile picture from WhatsApp Business Profile
   */
  static async deleteProfilePicture(
    phoneNumberId: string,
    accessToken: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${phoneNumberId}/whatsapp_business_profile`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete profile picture');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Get Message Templates from WhatsApp Business Account
   * Fetches all message templates for a given WABA ID
   */
  static async getMessageTemplates(
    wabaId: string,
    accessToken: string,
    params?: { limit?: number; after?: string }
  ): Promise<any> {
    try {
      let url = `${WHATSAPP_API_BASE_URL}/${wabaId}/message_templates`;

      if (params) {
        const queryParams = new URLSearchParams();
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.after) queryParams.append('after', params.after);

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get message templates');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Get Single Message Template by ID
   */
  static async getMessageTemplateById(
    templateId: string,
    accessToken: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${templateId}?fields=id,name,language,status,category,components`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get message template');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Create Message Template
   */
  static async createMessageTemplate(
    wabaId: string,
    accessToken: string,
    templateData: {
      name: string;
      language: string;
      category: string;
      components: any[];
    }
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${wabaId}/message_templates`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to create message template');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Update Message Template
   * Note: Only certain fields can be updated after creation
   */
  static async updateMessageTemplate(
    templateId: string,
    accessToken: string,
    templateData: any
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${templateId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update message template');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }

  /**
   * Delete Message Template
   */
  static async deleteMessageTemplate(
    wabaId: string,
    templateName: string,
    accessToken: string
  ): Promise<any> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_BASE_URL}/${wabaId}/message_templates?name=${templateName}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete message template');
      }

      return await response.json();
    } catch (error: any) {
      console.error('WhatsApp API Error:', error);
      throw new Error(`WhatsApp API Error: ${error.message}`);
    }
  }
}
