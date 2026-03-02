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
import { Tag } from '../models/Tag';
import { ApiEndpoint } from '../models/ApiEndpoint';
import { MessageQueue } from '../models/MessageQueue';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'auth_db',
  synchronize: false, // Disable auto-sync, use migrations instead
  // logging: process.env.NODE_ENV === 'development',
  logging: false,
  entities: [
    User,
    RefreshToken,
    Role,
    Permission,
    MenuManager,
    PhoneNumber,
    Contact,
    Message,
    MessageStatusUpdate,
    WebhookLog,
    QuickReply,
    Tag,
    ApiEndpoint,
    MessageQueue,
  ],
  migrations: [__dirname + '/../migrations/**/*.ts'],
  migrationsRun: false, // Run migrations manually in index.ts
  subscribers: [],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    timezone: 'Asia/Jakarta',
    // PostgreSQL session-level timeouts (milliseconds):
    //
    // statement_timeout — kill any single query running longer than 30s.
    //   Prevents INSERT/UPDATE/SELECT from hanging forever at 100% CPU.
    //
    // lock_timeout — kill immediately if waiting for a row/table lock > 10s.
    //   Prevents the "speculative insert spin" where two backends wait on each
    //   other's idempotency_key lock and burn CPU for minutes.
    //
    // idle_in_transaction_session_timeout — kill a connection that has opened
    //   a transaction but gone idle for more than 60s (e.g. app crash mid-tx).
    //   Prevents phantom transactions holding locks and blocking other queries.
    options:
      '-c statement_timeout=30000' +
      ' -c lock_timeout=10000' +
      ' -c idle_in_transaction_session_timeout=60000',
  },
});
