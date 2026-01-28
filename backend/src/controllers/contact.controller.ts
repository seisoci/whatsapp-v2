import type { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { PhoneNumber } from '../models/PhoneNumber';

export class ContactController {
  static async index(c: Context) {
    try {
      const contactRepository = AppDataSource.getRepository(Contact);
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const search = c.req.query('search');

      const queryBuilder = contactRepository.createQueryBuilder('contact')
        .leftJoinAndSelect('contact.phoneNumber_', 'phoneNumber')
        .leftJoinAndSelect('contact.tags', 'tags')
        .orderBy('contact.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      if (search) {
        queryBuilder.where(
          '(contact.profileName ILIKE :search OR contact.waId ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      const [contacts, total] = await queryBuilder.getManyAndCount();

      return c.json({
        success: true,
        data: contacts,
        meta: {
          total,
          page,
          limit,
          last_page: Math.ceil(total / limit),
        },
      });
    } catch (error: any) {
      return c.json({
        success: false,
        message: error.message,
      }, 500);
    }
  }

  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const { waId, phoneNumberId, profileName, businessName, email } = body;

      // Validate required fields
      if (!waId || !phoneNumberId) {
        return c.json({
          success: false,
          message: 'WhatsApp ID and Phone Number ID are required',
        }, 400);
      }

      // Check if phone number exists
      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id: phoneNumberId } });

      if (!phoneNumber) {
        return c.json({
          success: false,
          message: 'Invalid Phone Number ID',
        }, 400);
      }

      const contactRepository = AppDataSource.getRepository(Contact);
      
      // Check for existing contact
      const existingContact = await contactRepository.findOne({
        where: { waId, phoneNumberId }
      });

      if (existingContact) {
        return c.json({
          success: false,
          message: 'Contact already exists for this phone number',
        }, 409);
      }

      const contact = new Contact();
      contact.waId = waId;
      contact.phoneNumberId = phoneNumberId;
      contact.profileName = profileName;
      contact.businessName = businessName;
      // customFor email if needed, store in customFields or notes as existing schema doesn't have email column directly
      // Schema has customFields
      if (email) {
        contact.customFields = { ...contact.customFields, email };
      }

      await contactRepository.save(contact);

      return c.json({
        success: true,
        message: 'Contact created successfully',
        data: contact,
      });
    } catch (error: any) {
      return c.json({
        success: false,
        message: error.message,
      }, 500);
    }
  }

  static async show(c: Context) {
    try {
      const id = c.req.param('id');
      const contactRepository = AppDataSource.getRepository(Contact);
      const contact = await contactRepository.findOne({
        where: { id },
        relations: ['phoneNumber_', 'tags'],
      });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      return c.json({
        success: true,
        data: contact,
      });
    } catch (error: any) {
      return c.json({
        success: false,
        message: error.message,
      }, 500);
    }
  }

  static async update(c: Context) {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const { profileName, businessName, email, notes, isBlocked } = body;

      const contactRepository = AppDataSource.getRepository(Contact);
      const contact = await contactRepository.findOne({ where: { id } });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      if (profileName !== undefined) contact.profileName = profileName;
      if (businessName !== undefined) contact.businessName = businessName;
      if (notes !== undefined) contact.notes = notes;
      if (isBlocked !== undefined) contact.isBlocked = isBlocked;
      
      if (email) {
        contact.customFields = { ...contact.customFields, email };
      }

      await contactRepository.save(contact);

      return c.json({
        success: true,
        message: 'Contact updated successfully',
        data: contact,
      });
    } catch (error: any) {
      return c.json({
        success: false,
        message: error.message,
      }, 500);
    }
  }

  static async destroy(c: Context) {
    try {
      const id = c.req.param('id');
      const contactRepository = AppDataSource.getRepository(Contact);
      const contact = await contactRepository.findOne({ where: { id } });

      if (!contact) {
        return c.json({
          success: false,
          message: 'Contact not found',
        }, 404);
      }

      await contactRepository.remove(contact);

      return c.json({
        success: true,
        message: 'Contact deleted successfully',
      });
    } catch (error: any) {
      return c.json({
        success: false,
        message: error.message,
      }, 500);
    }
  }
}
