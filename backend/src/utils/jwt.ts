import { sign, verify, decode } from 'hono/jwt';
import { JWTPayload, RefreshTokenPayload } from '../types';
import { env } from '../config/env';

export class JWTService {
  static async generateAccessToken(payload: JWTPayload): Promise<string> {
    return await sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.parseDuration(env.JWT_EXPIRES_IN), // exp takes seconds
      iss: 'auth-api',
      aud: 'auth-api-users',
    }, env.JWT_SECRET, 'HS256');
  }

  static async generateRefreshToken(payload: RefreshTokenPayload): Promise<string> {
    return await sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + this.parseDuration(env.JWT_REFRESH_EXPIRES_IN),
      iss: 'auth-api',
      aud: 'auth-api-users',
    }, env.JWT_REFRESH_SECRET, 'HS256');
  }

  static async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = await verify(token, env.JWT_SECRET, 'HS256');
      return decoded as unknown as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  static async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const decoded = await verify(token, env.JWT_REFRESH_SECRET, 'HS256');
      return decoded as unknown as RefreshTokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  static decodeToken(token: string): any {
    const { payload } = decode(token);
    return payload;
  }

  private static parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 0;
    }
  }
}
