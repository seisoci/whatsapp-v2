import { Context } from 'hono';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { JWTService } from '../utils/jwt';
import { loginSchema, refreshTokenSchema } from '../validators';
import { LoginResponse } from '../types';
import { randomBytes } from 'crypto';

export class AuthController {


  static async login(c: Context) {
    try {
      const body = c.get('sanitizedBody') || (await c.req.json());

      // Validasi input
      const validatedData = loginSchema.parse(body);

      const userRepository = AppDataSource.getRepository(User);

      // Cari user berdasarkan email
      const user = await userRepository.findOne({
        where: { email: validatedData.email },
        select: ['id', 'email', 'username', 'password', 'isActive', 'loginAttempts', 'lockUntil', 'createdAt'],
      });

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Email atau password salah.',
          },
          401
        );
      }

      // Cek apakah akun terkunci
      if (user.isLocked()) {
        const lockTime = Math.ceil((user.lockUntil!.getTime() - Date.now()) / 60000);
        return c.json(
          {
            success: false,
            message: `Akun terkunci. Silakan coba lagi dalam ${lockTime} menit.`,
          },
          423
        );
      }

      // Verifikasi password
      const isPasswordValid = await user.comparePassword(validatedData.password);

      if (!isPasswordValid) {
        await user.incrementLoginAttempts();
        await userRepository.save(user);

        return c.json(
          {
            success: false,
            message: 'Email atau password salah.',
          },
          401
        );
      }

      // Reset login attempts
      if (user.loginAttempts > 0 || user.lockUntil) {
        user.resetLoginAttempts();
      }

      // Update last login info
      user.lastLoginAt = new Date();
      user.lastLoginIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null;
      await userRepository.save(user);

      // Generate tokens
      const accessToken = JWTService.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      const tokenId = randomBytes(32).toString('hex');
      const refreshTokenString = JWTService.generateRefreshToken({
        userId: user.id,
        tokenId,
      });

      // Simpan refresh token ke database
      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
      const refreshToken = refreshTokenRepository.create({
        userId: user.id,
        token: refreshTokenString,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
        ipAddress: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || null,
        userAgent: c.req.header('user-agent') || null,
      });

      await refreshTokenRepository.save(refreshToken);

      const response: LoginResponse = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
        },
        tokens: {
          accessToken,
          refreshToken: refreshTokenString,
        },
      };

      return c.json(
        {
          success: true,
          message: 'Login berhasil.',
          data: response,
        },
        200
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json(
          {
            success: false,
            message: 'Validasi gagal.',
            errors: error.errors,
          },
          400
        );
      }

      console.error('Login error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  static async refreshToken(c: Context) {
    try {
      const body = c.get('sanitizedBody') || (await c.req.json());

      // Validasi input
      const validatedData = refreshTokenSchema.parse(body);

      // Verifikasi refresh token
      const decoded = JWTService.verifyRefreshToken(validatedData.refreshToken);

      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

      // Cari refresh token di database
      const refreshToken = await refreshTokenRepository.findOne({
        where: { token: validatedData.refreshToken },
        relations: ['user'],
      });

      if (!refreshToken) {
        return c.json(
          {
            success: false,
            message: 'Refresh token tidak valid.',
          },
          401
        );
      }

      // Cek apakah token valid
      if (!refreshToken.isValid()) {
        return c.json(
          {
            success: false,
            message: 'Refresh token sudah tidak valid atau kadaluarsa.',
          },
          401
        );
      }

      // Generate access token baru
      const accessToken = JWTService.generateAccessToken({
        userId: refreshToken.user.id,
        email: refreshToken.user.email,
      });

      return c.json(
        {
          success: true,
          message: 'Token berhasil diperbarui.',
          data: {
            accessToken,
          },
        },
        200
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return c.json(
          {
            success: false,
            message: 'Validasi gagal.',
            errors: error.errors,
          },
          400
        );
      }

      console.error('Refresh token error:', error);
      return c.json(
        {
          success: false,
          message: error.message || 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  static async logout(c: Context) {
    try {
      const body = c.get('sanitizedBody') || (await c.req.json());

      const { refreshToken: refreshTokenString } = body;

      if (!refreshTokenString) {
        return c.json(
          {
            success: false,
            message: 'Refresh token harus disediakan.',
          },
          400
        );
      }

      const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);

      // Cari refresh token di database
      const refreshToken = await refreshTokenRepository.findOne({
        where: { token: refreshTokenString },
      });

      if (refreshToken) {
        // Revoke refresh token
        refreshToken.isRevoked = true;
        refreshToken.revokedAt = new Date();
        await refreshTokenRepository.save(refreshToken);
      }

      return c.json(
        {
          success: true,
          message: 'Logout berhasil.',
        },
        200
      );
    } catch (error: any) {
      console.error('Logout error:', error);
      return c.json(
        {
          success: false,
          message: 'Terjadi kesalahan pada server.',
        },
        500
      );
    }
  }

  static async me(c: Context) {
    try {
      const user = c.get('user');

      const userRepository = AppDataSource.getRepository(User);
      const userData = await userRepository.findOne({
        where: { id: user.userId },
        relations: ['role', 'role.permissions', 'role.menus'],
      });

      if (!userData) {
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
          data: {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            isActive: userData.isActive,
            emailVerified: userData.emailVerified,
            role: userData.role ? {
              id: userData.role.id,
              name: userData.role.name,
              slug: userData.role.slug,
              permissions: userData.role.permissions || [],
              menus: userData.role.menus || [],
            } : null,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          },
        },
        200
      );
    } catch (error: any) {
      console.error('Me error:', error);
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
