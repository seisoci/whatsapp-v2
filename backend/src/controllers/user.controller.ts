import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { paginationSchema } from '../validators/common.validator';
import { withPermissions } from '../utils/controller.decorator';

export class UserController {
  /**
   * Permission definitions (mirip Laravel constructor middleware)
   */
  static permissions = {
    index: 'user-index',
    show: 'user-index',
    store: 'user-store',
    update: 'user-update',
    destroy: 'user-destroy',
    resetPassword: 'user-update',
  };

  /**
   * Get all users with pagination
   */
  static async index(c: Context) {
    try {
      const query = c.req.query();

      // Validate pagination parameters
      const validatedQuery = paginationSchema.parse({
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 10,
        search: query.search,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      const userRepository = AppDataSource.getRepository(User);

      // Build query
      const queryBuilder = userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.role', 'role')
        .select([
          'user.id',
          'user.email',
          'user.username',
          'user.isActive',
          'user.emailVerified',
          'user.createdAt',
          'user.updatedAt',
          'role.id',
          'role.name',
          'role.slug',
        ]);

      // Apply search filter
      if (validatedQuery.search) {
        queryBuilder.where(
          '(user.email ILIKE :search OR user.username ILIKE :search)',
          { search: `%${validatedQuery.search}%` }
        );
      }

      // Apply sorting
      if (validatedQuery.sortBy) {
        const order = validatedQuery.sortOrder === 'desc' ? 'DESC' : 'ASC';
        queryBuilder.orderBy(`user.${validatedQuery.sortBy}`, order);
      } else {
        queryBuilder.orderBy('user.createdAt', 'DESC');
      }

      // Apply pagination
      const skip = (validatedQuery.page - 1) * validatedQuery.limit;
      queryBuilder.skip(skip).take(validatedQuery.limit);

      // Execute query
      const [users, total] = await queryBuilder.getManyAndCount();

      return c.json(
        {
          success: true,
          data: users,
          meta: {
            page: validatedQuery.page,
            limit: validatedQuery.limit,
            total,
            totalPages: Math.ceil(total / validatedQuery.limit),
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Get users error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Get single user by ID
   */
  static async show(c: Context) {
    try {
      const { id } = c.req.param();

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({
        where: { id },
        relations: ['role', 'role.permissions', 'role.menus'],
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          role: {
            id: true,
            name: true,
            slug: true,
            permissions: true,
            menus: true,
          },
        },
      });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'User tidak ditemukan.',
          },
          404
        );
      }

      return c.json(
        {
          success: true,
          data: user,
        },
        200
      );
    } catch (error: any) {
      console.error('Get user error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Create new user
   */
  static async store(c: Context) {
    try {
      const body = await c.req.json();

      const userRepository = AppDataSource.getRepository(User);

      // Check if email already exists
      const existingUser = await userRepository.findOne({
        where: { email: body.email }
      });

      if (existingUser) {
        return c.json(
          {
            success: false,
            message: 'Email sudah digunakan.',
          },
          400
        );
      }

      // Create new user
      const user = userRepository.create({
        username: body.username,
        email: body.email,
        password: body.password,
        roleId: body.roleId,
        isActive: body.isActive !== undefined ? body.isActive : true,
        emailVerified: body.emailVerified !== undefined ? body.emailVerified : false,
      });

      await userRepository.save(user);

      return c.json(
        {
          success: true,
          message: 'User berhasil dibuat.',
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            roleId: user.roleId,
          },
        },
        201
      );
    } catch (error: any) {
      console.error('Create user error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Update user
   */
  static async update(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'User tidak ditemukan.',
          },
          404
        );
      }

      // Update fields
      if (body.username) user.username = body.username;
      if (body.email) user.email = body.email;
      if (body.isActive !== undefined) user.isActive = body.isActive;
      if (body.emailVerified !== undefined) user.emailVerified = body.emailVerified;
      if (body.roleId) user.roleId = body.roleId;

      await userRepository.save(user);

      return c.json(
        {
          success: true,
          message: 'User berhasil diupdate.',
          data: {
            id: user.id,
            email: user.email,
            username: user.username,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Update user error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Delete user
   */
  static async destroy(c: Context) {
    try {
      const { id } = c.req.param();

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'User tidak ditemukan.',
          },
          404
        );
      }

      // Prevent deleting super admin
      if (user.roleId === 1) {
        return c.json(
          {
            success: false,
            message: 'Super Admin tidak dapat dihapus.',
          },
          403
        );
      }

      await userRepository.remove(user);

      return c.json(
        {
          success: true,
          message: 'User berhasil dihapus.',
        },
        200
      );
    } catch (error: any) {
      console.error('Delete user error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  /**
   * Reset user password
   */
  static async resetPassword(c: Context) {
    try {
      const { id } = c.req.param();
      const body = await c.req.json();

      if (!body.newPassword) {
        return c.json(
          {
            success: false,
            message: 'Password baru harus disediakan.',
          },
          400
        );
      }

      if (body.newPassword.length < 8) {
        return c.json(
          {
            success: false,
            message: 'Password harus minimal 8 karakter.',
          },
          400
        );
      }

      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ where: { id } });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'User tidak ditemukan.',
          },
          404
        );
      }

      // Update password (akan di-hash otomatis oleh User entity @BeforeInsert/@BeforeUpdate)
      user.password = body.newPassword;

      // Reset login attempts jika ada
      user.resetLoginAttempts();

      await userRepository.save(user);

      return c.json(
        {
          success: true,
          message: 'Password berhasil direset.',
        },
        200
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }
}

// Export wrapped controller dengan permission checks
export const UserControllerWithPermissions = withPermissions(
  UserController,
  UserController.permissions
);

