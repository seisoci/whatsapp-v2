import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { MenuManager } from '../models/MenuManager';
import { PhoneNumber } from '../models/PhoneNumber';
import { Contact } from '../models/Contact';
import { Message } from '../models/Message';
import { MessageStatusUpdate } from '../models/MessageStatusUpdate';
import { WebhookLog } from '../models/WebhookLog';
import { QuickReply } from '../models/QuickReply';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'auth_db',
  synchronize: false, // Disable auto-sync, use migrations instead
  logging: process.env.NODE_ENV === 'development',
  entities: [User, RefreshToken, Role, Permission, MenuManager, PhoneNumber, Contact, Message, MessageStatusUpdate, WebhookLog, QuickReply],
  migrations: [__dirname + '/../migrations/**/*.ts'],
  migrationsRun: false, // Run migrations manually in index.ts
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
});
