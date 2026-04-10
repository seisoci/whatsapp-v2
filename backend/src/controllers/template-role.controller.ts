import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { TemplateRoleAccess } from '../models/TemplateRoleAccess';
import { Role } from '../models/Role';
import { PhoneNumber } from '../models/PhoneNumber';
import { withPermissions } from '../utils/controller.decorator';

export class TemplateRoleController {
  static permissions = {
    index: 'template-role-index',
    getByTemplate: 'template-role-index',
    assign: 'template-role-update',
    destroy: 'template-role-update',
  };

  /**
   * GET /template-roles
   * Ambil semua template role access, di-group berdasarkan template
   */
  static async index(c: Context) {
    try {
      const repo = AppDataSource.getRepository(TemplateRoleAccess);

      const records = await repo.find({
        relations: ['role', 'phoneNumber'],
        order: { templateName: 'ASC', createdAt: 'ASC' },
      });

      // Group by templateId + phoneNumberDbId
      const grouped: Record<string, any> = {};
      for (const record of records) {
        const key = `${record.templateId}_${record.phoneNumberDbId}`;
        if (!grouped[key]) {
          grouped[key] = {
            templateId: record.templateId,
            templateName: record.templateName,
            wabaId: record.wabaId,
            phoneNumberDbId: record.phoneNumberDbId,
            phoneNumber: record.phoneNumber,
            roles: [],
          };
        }
        grouped[key].roles.push({
          id: record.role.id,
          name: record.role.name,
          slug: record.role.slug,
          accessId: record.id,
        });
      }

      return c.json({
        success: true,
        data: Object.values(grouped),
      });
    } catch (error) {
      console.error('Get template roles error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * GET /template-roles/:templateId
   * Ambil roles yang bisa menggunakan template tertentu
   * Query: phoneNumberDbId (required)
   */
  static async getByTemplate(c: Context) {
    try {
      const templateId = c.req.param('templateId');
      const phoneNumberDbId = c.req.query('phoneNumberDbId');

      if (!phoneNumberDbId) {
        return c.json({ success: false, message: 'phoneNumberDbId query param is required' }, 400);
      }

      const repo = AppDataSource.getRepository(TemplateRoleAccess);
      const records = await repo.find({
        where: { templateId, phoneNumberDbId },
        relations: ['role'],
      });

      return c.json({
        success: true,
        data: records.map((r) => ({
          accessId: r.id,
          roleId: r.roleId,
          roleName: r.role?.name,
          roleSlug: r.role?.slug,
        })),
      });
    } catch (error) {
      console.error('Get template roles by template error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * PUT /template-roles/:templateId
   * Set (replace) roles untuk template tertentu
   * Body: { phoneNumberDbId, wabaId, templateName, roleIds: string[] }
   */
  static async assign(c: Context) {
    try {
      const templateId = c.req.param('templateId');
      const body = await c.req.json();
      const { phoneNumberDbId, wabaId, templateName, roleIds } = body;

      if (!phoneNumberDbId || !wabaId || !templateName || !Array.isArray(roleIds)) {
        return c.json(
          { success: false, message: 'phoneNumberDbId, wabaId, templateName, dan roleIds diperlukan' },
          400
        );
      }

      const repo = AppDataSource.getRepository(TemplateRoleAccess);
      const roleRepo = AppDataSource.getRepository(Role);
      const phoneRepo = AppDataSource.getRepository(PhoneNumber);

      // Validasi phone number
      const phoneNumber = await phoneRepo.findOne({ where: { id: phoneNumberDbId } });
      if (!phoneNumber) {
        return c.json({ success: false, message: 'Phone number tidak ditemukan' }, 404);
      }

      // Validasi semua role id ada
      if (roleIds.length > 0) {
        const roles = await roleRepo.findByIds(roleIds);
        if (roles.length !== roleIds.length) {
          return c.json({ success: false, message: 'Beberapa role tidak ditemukan' }, 404);
        }
      }

      // Hapus akses lama untuk template ini
      await repo.delete({ templateId, phoneNumberDbId });

      // Insert akses baru
      if (roleIds.length > 0) {
        const newRecords = roleIds.map((roleId: string) =>
          repo.create({
            templateId,
            templateName,
            wabaId,
            phoneNumberDbId,
            roleId,
          })
        );
        await repo.save(newRecords);
      }

      // Reload
      const updated = await repo.find({
        where: { templateId, phoneNumberDbId },
        relations: ['role'],
      });

      return c.json({
        success: true,
        message: 'Role akses template berhasil diperbarui',
        data: updated.map((r) => ({
          accessId: r.id,
          roleId: r.roleId,
          roleName: r.role?.name,
          roleSlug: r.role?.slug,
        })),
      });
    } catch (error) {
      console.error('Assign template roles error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }

  /**
   * DELETE /template-roles/:templateId
   * Hapus semua akses role dari template
   * Query: phoneNumberDbId (required)
   */
  static async destroy(c: Context) {
    try {
      const templateId = c.req.param('templateId');
      const phoneNumberDbId = c.req.query('phoneNumberDbId');

      if (!phoneNumberDbId) {
        return c.json({ success: false, message: 'phoneNumberDbId query param is required' }, 400);
      }

      const repo = AppDataSource.getRepository(TemplateRoleAccess);
      await repo.delete({ templateId, phoneNumberDbId });

      return c.json({ success: true, message: 'Akses template berhasil dihapus' });
    } catch (error) {
      console.error('Delete template role access error:', error);
      return c.json({ success: false, message: 'Internal server error' }, 500);
    }
  }
}

export const TemplateRoleControllerWithPermissions = withPermissions(
  TemplateRoleController,
  TemplateRoleController.permissions
);
