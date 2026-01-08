import { Context, Next } from 'hono';
import { JWTService } from '../utils/jwt';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          message: 'Token tidak ditemukan. Silakan login terlebih dahulu.',
        },
        401
      );
    }

    const token = authHeader.substring(7);

    if (!token) {
      return c.json(
        {
          success: false,
          message: 'Token tidak valid.',
        },
        401
      );
    }

    const decoded = JWTService.verifyAccessToken(token);

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: decoded.userId },
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: 'User tidak ditemukan.',
        },
        401
      );
    }

    if (!user.isActive) {
      return c.json(
        {
          success: false,
          message: 'Akun Anda telah dinonaktifkan.',
        },
        403
      );
    }

    console.log('🔐 [Auth] Setting user context:', { userId: decoded.userId, email: decoded.email });
    c.set('user', decoded);

    await next();
  } catch (error: any) {
    return c.json(
      {
        success: false,
        message: error.message || 'Token tidak valid atau sudah kadaluarsa.',
      },
      401
    );
  }
};
