import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PhoneNumber } from './PhoneNumber';
import { Contact } from './Contact';
import { Message } from './Message';

/**
 * WebhookLog Model
 * Stores all incoming webhooks for debugging, audit trail, and idempotency
 */
@Entity('webhook_logs')
export class WebhookLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Webhook Event Information
  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  @Index()
  eventType: string; // 'messages', 'message_status', 'customer_identity_changed', etc.

  // Phone Number Association
  @Column({ name: 'phone_number_id', type: 'uuid', nullable: true })
  phoneNumberId: string | null;

  @ManyToOne(() => PhoneNumber, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber: PhoneNumber | null;

  // Webhook Payload
  @Column({ name: 'webhook_payload', type: 'jsonb' })
  webhookPayload: any; // Complete webhook body

  // Processing Status
  @Column({ name: 'processing_status', type: 'varchar', length: 20, default: 'pending' })
  @Index()
  processingStatus: 'pending' | 'processing' | 'success' | 'failed' | 'skipped';

  // Processing Details
  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'processing_duration_ms', type: 'integer', nullable: true })
  processingDurationMs: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'error_stack', type: 'text', nullable: true })
  errorStack: string | null;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount: number;

  // Message Reference (if applicable)
  @Column({ name: 'message_id', type: 'uuid', nullable: true })
  messageId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'message_id' })
  message: Message | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @Index()
  wamid: string | null; // WhatsApp message ID from webhook

  // Contact Reference (if applicable)
  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @ManyToOne(() => Contact, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact | null;

  @Column({ name: 'wa_id', type: 'varchar', length: 20, nullable: true })
  @Index()
  waId: string | null; // WhatsApp ID from webhook

  // Status Update Information (for message_status events)
  @Column({ name: 'status_event_type', type: 'varchar', length: 20, nullable: true })
  statusEventType: string | null; // 'sent', 'delivered', 'read', 'failed', 'deleted'

  @Column({ name: 'status_timestamp', type: 'timestamp', nullable: true })
  statusTimestamp: Date | null;

  // Request Information
  @Column({ name: 'request_headers', type: 'jsonb', nullable: true })
  requestHeaders: any | null;

  @Column({ name: 'request_ip', type: 'varchar', length: 45, nullable: true })
  requestIp: string | null;

  @Column({ name: 'request_user_agent', type: 'text', nullable: true })
  requestUserAgent: string | null;

  @Column({ name: 'webhook_signature', type: 'varchar', length: 255, nullable: true })
  webhookSignature: string | null; // For webhook verification

  // Idempotency
  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  idempotencyKey: string | null; // To prevent duplicate processing

  // Timestamps
  @Column({ name: 'received_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  receivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
