import type { Context } from 'hono';
import { In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Contact } from '../models/Contact';
import { PhoneNumber } from '../models/PhoneNumber';
import { User } from '../models/User';
import { indexContact, deleteContactFromIndex } from '../services/meilisearch.service';
import { getUserAllowedPhoneNumberIds, isPhoneNumberAllowed } from '../utils/phone-access';

async function loadUser(c: Context): Promise<User | null> {
  const decoded = c.get('user');
  if (!decoded?.userId) return null;
  return AppDataSource.getRepository(User).findOne({
    where: { id: decoded.userId },
    relations: ['role'],
  });
}

export class ContactController {
  static async index(c: Context) {
    try {
      const contactRepository = AppDataSource.getRepository(Contact);
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '10');
      const search = c.req.query('search');
      const phoneNumberId = c.req.query('phoneNumberId');

      const user = await loadUser(c);
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const allowedIds = await getUserAllowedPhoneNumberIds(user);

      const queryBuilder = contactRepository.createQueryBuilder('contact')
        .leftJoinAndSelect('contact.phoneNumber_', 'phoneNumber')
        .leftJoinAndSelect('contact.tags', 'tags')
        .orderBy('contact.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      if (phoneNumberId) {
        if (!isPhoneNumberAllowed(allowedIds, phoneNumberId)) {
          return c.json({ success: false, message: 'Akses ke nomor telepon ini tidak diizinkan.' }, 403);
        }
        queryBuilder.andWhere('contact.phoneNumberId = :phoneNumberId', { phoneNumberId });
      } else if (allowedIds !== null) {
        // Filter to only contacts from phone numbers the user can access
        if (allowedIds.size === 0) {
          return c.json({ success: true, data: [], meta: { total: 0, page, limit, last_page: 0 } });
        }
        queryBuilder.andWhere('contact.phoneNumberId IN (:...ids)', { ids: [...allowedIds] });
      }

      if (search) {
        queryBuilder.andWhere(
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
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  static async store(c: Context) {
    try {
      const body = await c.req.json();
      const { waId, phoneNumberId, profileName, businessName, email } = body;

      if (!waId || !phoneNumberId) {
        return c.json({ success: false, message: 'WhatsApp ID and Phone Number ID are required' }, 400);
      }

      const user = await loadUser(c);
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const allowedIds = await getUserAllowedPhoneNumberIds(user);
      if (!isPhoneNumberAllowed(allowedIds, phoneNumberId)) {
        return c.json({ success: false, message: 'Akses ke nomor telepon ini tidak diizinkan.' }, 403);
      }

      const phoneNumberRepository = AppDataSource.getRepository(PhoneNumber);
      const phoneNumber = await phoneNumberRepository.findOne({ where: { id: phoneNumberId } });

      if (!phoneNumber) {
        return c.json({ success: false, message: 'Invalid Phone Number ID' }, 400);
      }

      const contactRepository = AppDataSource.getRepository(Contact);

      const existingContact = await contactRepository.findOne({ where: { waId, phoneNumberId } });
      if (existingContact) {
        return c.json({ success: true, message: 'Contact already exists', data: existingContact }, 200);
      }

      const contact = new Contact();
      contact.waId = waId;
      contact.phoneNumber = waId;
      contact.phoneNumberId = phoneNumberId;
      contact.profileName = profileName;
      contact.businessName = businessName;
      if (email) {
        contact.customFields = { ...contact.customFields, email };
      }

      await contactRepository.save(contact);

      indexContact({
        id: contact.id,
        waId: contact.waId,
        phoneNumber: contact.phoneNumber,
        profileName: contact.profileName,
        businessName: contact.businessName ?? null,
        phoneNumberId: contact.phoneNumberId,
        isArchived: false,
        unreadCount: 0,
        lastMessageAt: null,
        createdAt: contact.createdAt.getTime(),
      }).catch((err) => console.warn('[Meilisearch] Sync error:', err));

      return c.json({ success: true, message: 'Contact created successfully', data: contact });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
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
        return c.json({ success: false, message: 'Contact not found' }, 404);
      }

      const user = await loadUser(c);
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const allowedIds = await getUserAllowedPhoneNumberIds(user);
      if (!isPhoneNumberAllowed(allowedIds, contact.phoneNumberId)) {
        return c.json({ success: false, message: 'Akses ke nomor telepon ini tidak diizinkan.' }, 403);
      }

      return c.json({ success: true, data: contact });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
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
        return c.json({ success: false, message: 'Contact not found' }, 404);
      }

      const user = await loadUser(c);
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const allowedIds = await getUserAllowedPhoneNumberIds(user);
      if (!isPhoneNumberAllowed(allowedIds, contact.phoneNumberId)) {
        return c.json({ success: false, message: 'Akses ke nomor telepon ini tidak diizinkan.' }, 403);
      }

      if (profileName !== undefined) contact.profileName = profileName;
      if (businessName !== undefined) contact.businessName = businessName;
      if (notes !== undefined) contact.notes = notes;
      if (isBlocked !== undefined) contact.isBlocked = isBlocked;
      if (email) {
        contact.customFields = { ...contact.customFields, email };
      }

      await contactRepository.save(contact);

      indexContact({
        id: contact.id,
        waId: contact.waId,
        phoneNumber: contact.phoneNumber,
        profileName: contact.profileName,
        businessName: contact.businessName ?? null,
        phoneNumberId: contact.phoneNumberId,
        isArchived: contact.isArchived,
        unreadCount: contact.unreadCount || 0,
        lastMessageAt: contact.lastMessageAt ? contact.lastMessageAt.getTime() : null,
        createdAt: contact.createdAt.getTime(),
      }).catch((err) => console.warn('[Meilisearch] Sync error:', err));

      return c.json({ success: true, message: 'Contact updated successfully', data: contact });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }

  static async destroy(c: Context) {
    try {
      const id = c.req.param('id');
      const contactRepository = AppDataSource.getRepository(Contact);
      const contact = await contactRepository.findOne({ where: { id } });

      if (!contact) {
        return c.json({ success: false, message: 'Contact not found' }, 404);
      }

      const user = await loadUser(c);
      if (!user) return c.json({ success: false, message: 'Unauthorized' }, 401);

      const allowedIds = await getUserAllowedPhoneNumberIds(user);
      if (!isPhoneNumberAllowed(allowedIds, contact.phoneNumberId)) {
        return c.json({ success: false, message: 'Akses ke nomor telepon ini tidak diizinkan.' }, 403);
      }

      await contactRepository.remove(contact);

      deleteContactFromIndex(id).catch((err) => console.warn('[Meilisearch] Delete error:', err));

      return c.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error: any) {
      return c.json({ success: false, message: error.message }, 500);
    }
  }
}
