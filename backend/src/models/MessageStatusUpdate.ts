import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Message } from './Message';

/**
 * MessageStatusUpdate Model
 * Tracks message status history for audit trail
 */
@Entity('message_status_updates')
export class MessageStatusUpdate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'message_id', type: 'uuid' })
  messageId: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  @Index()
  message: Message;

  // Status Information
  @Column({ type: 'varchar', length: 20 })
  @Index()
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted';

  // Timing
  @Column({ name: 'status_timestamp', type: 'timestamp' })
  @Index()
  statusTimestamp: Date;

  // Error Information (for failed status)
  @Column({ name: 'error_code', type: 'integer', nullable: true })
  errorCode: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  // Raw Webhook Data
  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload: any | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
