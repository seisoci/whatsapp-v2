import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './Message';
import { ApiEndpoint } from './ApiEndpoint';
import { PhoneNumber } from './PhoneNumber';
import { Contact } from './Contact';
import { User } from './User';

@Entity('message_queues')
export class MessageQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // === Referensi ===

  @Column({ name: 'message_id', type: 'uuid', nullable: true })
  messageId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'message_id' })
  message: Message | null;

  @Column({ name: 'api_endpoint_id', type: 'uuid', nullable: true })
  @Index('IDX_mq_api_endpoint_id')
  apiEndpointId: string | null;

  @ManyToOne(() => ApiEndpoint, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'api_endpoint_id' })
  apiEndpoint: ApiEndpoint | null;

  @Column({ name: 'phone_number_id', type: 'uuid' })
  phoneNumberId: string;

  @ManyToOne(() => PhoneNumber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber: PhoneNumber;

  @Column({ name: 'contact_id', type: 'uuid', nullable: true })
  contactId: string | null;

  @ManyToOne(() => Contact, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // === Payload ===

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20 })
  recipientPhone: string;

  @Column({ name: 'template_name', type: 'varchar', length: 255 })
  @Index('IDX_mq_template_name')
  templateName: string;

  @Column({ name: 'template_language', type: 'varchar', length: 10, default: 'id' })
  templateLanguage: string;

  @Column({ name: 'template_components', type: 'jsonb', nullable: true })
  templateComponents: any | null;

  // === Request Metadata ===

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'api_key_masked', type: 'varchar', length: 50, nullable: true })
  apiKeyMasked: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'device_info', type: 'varchar', length: 255, nullable: true })
  deviceInfo: string | null;

  @Column({ name: 'request_headers', type: 'jsonb', nullable: true })
  requestHeaders: Record<string, string | null> | null;

  // === Status ===

  @Column({ name: 'queue_status', type: 'varchar', length: 20, default: 'pending' })
  @Index('IDX_mq_queue_status')
  queueStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

  @Column({ name: 'message_status', type: 'varchar', length: 20, nullable: true })
  messageStatus: 'sent' | 'delivered' | 'read' | 'failed' | null;

  @Column({ name: 'wamid', type: 'varchar', length: 255, nullable: true })
  wamid: string | null;

  // === Template Category (Meta: MARKETING | UTILITY | AUTHENTICATION) ===

  @Column({ name: 'template_category', type: 'varchar', length: 50, nullable: true })
  templateCategory: string | null;

  // === Billing ===

  @Column({ name: 'is_billable', type: 'boolean', default: true })
  @Index('IDX_mq_is_billable')
  isBillable: boolean;

  // === Error ===

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 50, nullable: true })
  errorCode: string | null;

  // === Retry ===

  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', type: 'int', default: 3 })
  maxAttempts: number;

  @Column({ name: 'next_retry_at', type: 'timestamp', nullable: true })
  nextRetryAt: Date | null;

  // === Timestamps ===

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt: Date | null;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index('IDX_mq_created_at')
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
