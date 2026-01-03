import { Context } from 'hono';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface AuthContext extends Context {
  user?: JWTPayload;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    createdAt: Date;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
