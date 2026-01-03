import jwt from 'jsonwebtoken';
import { JWTPayload, RefreshTokenPayload } from '../types';
import { env } from '../config/env';

export class JWTService {
  static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'auth-api',
      audience: 'auth-api-users',
    });
  }

  static generateRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'auth-api',
      audience: 'auth-api-users',
    });
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'auth-api',
        audience: 'auth-api-users',
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: 'auth-api',
        audience: 'auth-api-users',
      }) as RefreshTokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}
