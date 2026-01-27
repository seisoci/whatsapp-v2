import { cacheService } from './cache.service';
import { AppDataSource } from '../config/database';
import { PhoneNumber } from '../models/PhoneNumber';
import { WhatsAppService } from './whatsapp.service';

/**
 * Template definition from WhatsApp API
 */
interface TemplateDefinition {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: string;
  text?: string;
  buttons?: TemplateButton[];
  example?: {
    body_text?: string[][];
    header_text?: string[];
    header_handle?: string[];
  };
}

interface TemplateButton {
  type: string;
  text: string;
  url?: string;
  phone_number?: string;
}

/**
 * Template Cache Service
 * Caches WhatsApp message template definitions in Redis
 */
class TemplateCacheService {
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'template:';

  /**
   * Get cache key for template
   */
  private getCacheKey(wabaId: string, templateName: string, language: string): string {
    return `${this.CACHE_PREFIX}${wabaId}:${templateName}:${language}`;
  }

  /**
   * Get template definition from cache or fetch from API
   */
  async getTemplate(
    wabaId: string,
    accessToken: string,
    templateName: string,
    language: string
  ): Promise<TemplateDefinition | null> {
    const cacheKey = this.getCacheKey(wabaId, templateName, language);

    // Try to get from cache first
    const cached = await cacheService.get<TemplateDefinition>(cacheKey);
    if (cached) {
      console.log(`[TemplateCache] Cache HIT for ${templateName}:${language}`);
      return cached;
    }

    console.log(`[TemplateCache] Cache MISS for ${templateName}:${language}, fetching from API...`);

    // Fetch from API
    try {
      const result = await WhatsAppService.getMessageTemplates(wabaId, accessToken, {
        name: templateName,
        limit: 100,
      });

      if (result.data && Array.isArray(result.data)) {
        // Find template with matching name and language
        const template = result.data.find(
          (t: any) => t.name === templateName && t.language === language
        );

        if (template) {
          // Cache the template
          await cacheService.set(cacheKey, template, this.CACHE_TTL);
          console.log(`[TemplateCache] Cached template ${templateName}:${language}`);
          return template;
        }
      }

      console.warn(`[TemplateCache] Template not found: ${templateName}:${language}`);
      return null;
    } catch (error) {
      console.error(`[TemplateCache] Error fetching template:`, error);
      return null;
    }
  }

  /**
   * Get template by phone number ID (looks up wabaId and accessToken)
   */
  async getTemplateByPhoneNumber(
    phoneNumberId: string,
    templateName: string,
    language: string
  ): Promise<TemplateDefinition | null> {
    const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
    const phoneNumber = await phoneNumberRepo.findOne({
      where: { id: phoneNumberId },
      select: ['wabaId', 'accessToken'],
    });

    if (!phoneNumber) {
      console.error(`[TemplateCache] Phone number not found: ${phoneNumberId}`);
      return null;
    }

    return this.getTemplate(
      phoneNumber.wabaId,
      phoneNumber.accessToken,
      templateName,
      language
    );
  }

  /**
   * Render template body with parameters
   * Replaces {{1}}, {{2}}, etc. with actual values
   */
  renderTemplateBody(
    template: TemplateDefinition,
    components: any[]
  ): { header?: string; body?: string; footer?: string } {
    const result: { header?: string; body?: string; footer?: string } = {};

    // Find BODY component in template definition
    const bodyDef = template.components.find((c) => c.type === 'BODY');
    const headerDef = template.components.find((c) => c.type === 'HEADER');
    const footerDef = template.components.find((c) => c.type === 'FOOTER');

    // Find parameter components from sent message
    const bodyParams = components?.find((c: any) => c.type?.toUpperCase() === 'BODY');
    const headerParams = components?.find((c: any) => c.type?.toUpperCase() === 'HEADER');

    // Render body text
    if (bodyDef?.text) {
      let bodyText = bodyDef.text;
      const params = bodyParams?.parameters || [];

      // Replace placeholders {{1}}, {{2}}, etc.
      params.forEach((param: any, index: number) => {
        const placeholder = `{{${index + 1}}}`;
        const value = param.text || param.currency?.fallback_value || param.date_time?.fallback_value || '';
        bodyText = bodyText.replace(placeholder, value);
      });

      result.body = bodyText;
    }

    // Render header text (if text type)
    if (headerDef?.text && headerDef.format !== 'IMAGE' && headerDef.format !== 'VIDEO' && headerDef.format !== 'DOCUMENT') {
      let headerText = headerDef.text;
      const params = headerParams?.parameters || [];

      params.forEach((param: any, index: number) => {
        const placeholder = `{{${index + 1}}}`;
        const value = param.text || '';
        headerText = headerText.replace(placeholder, value);
      });

      result.header = headerText;
    }

    // Footer doesn't have variables, just copy text
    if (footerDef?.text) {
      result.footer = footerDef.text;
    }

    return result;
  }

  /**
   * Invalidate template cache
   */
  async invalidateCache(wabaId: string, templateName?: string): Promise<void> {
    if (templateName) {
      // Invalidate specific template (all languages)
      await cacheService.invalidatePattern(`${this.CACHE_PREFIX}${wabaId}:${templateName}:*`);
    } else {
      // Invalidate all templates for this WABA
      await cacheService.invalidatePattern(`${this.CACHE_PREFIX}${wabaId}:*`);
    }
    console.log(`[TemplateCache] Invalidated cache for ${wabaId}${templateName ? `:${templateName}` : ''}`);
  }

  /**
   * Preload templates for a phone number
   */
  async preloadTemplates(phoneNumberId: string): Promise<number> {
    const phoneNumberRepo = AppDataSource.getRepository(PhoneNumber);
    const phoneNumber = await phoneNumberRepo.findOne({
      where: { id: phoneNumberId },
    });

    if (!phoneNumber) {
      return 0;
    }

    try {
      const result = await WhatsAppService.getMessageTemplates(
        phoneNumber.wabaId,
        phoneNumber.accessToken,
        { limit: 1000 }
      );

      if (result.data && Array.isArray(result.data)) {
        for (const template of result.data) {
          const cacheKey = this.getCacheKey(
            phoneNumber.wabaId,
            template.name,
            template.language
          );
          await cacheService.set(cacheKey, template, this.CACHE_TTL);
        }
        console.log(`[TemplateCache] Preloaded ${result.data.length} templates for ${phoneNumberId}`);
        return result.data.length;
      }

      return 0;
    } catch (error) {
      console.error(`[TemplateCache] Error preloading templates:`, error);
      return 0;
    }
  }
}

// Export singleton instance
export const templateCacheService = new TemplateCacheService();
