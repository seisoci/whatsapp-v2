import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
  Index,
} from 'typeorm';
import { PhoneNumber } from './PhoneNumber';

/**
 * Contact Model
 * Represents WhatsApp contacts/customers with 24-hour session window tracking
 */
@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // WhatsApp Identifiers
  @Column({ name: 'wa_id', unique: true, length: 20 })
  @Index()
  waId: string; // WhatsApp ID (phone number without +)

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string; // Full phone number with country code

  // Contact Profile Information
  @Column({ name: 'profile_name', type: 'varchar', length: 255, nullable: true })
  profileName: string | null; // Name from WhatsApp profile

  @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
  businessName: string | null; // For business contacts

  // Relationship with phone numbers (internal WA number)
  @Column({ name: 'phone_number_id', type: 'uuid', nullable: true })
  phoneNumberId: string | null;

  @ManyToOne(() => PhoneNumber, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber_: PhoneNumber | null;

  // Contact Status
  @Column({ name: 'is_business_account', default: false })
  isBusinessAccount: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  // Metadata
  @Column({ name: 'first_message_at', type: 'timestamp', nullable: true })
  firstMessageAt: Date | null;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  @Index()
  lastMessageAt: Date | null;

  // Session Window Tracking (24-hour window)
  @Column({ name: 'last_customer_message_at', type: 'timestamp', nullable: true })
  lastCustomerMessageAt: Date | null; // Last time customer sent message

  @Column({ name: 'session_expires_at', type: 'timestamp', nullable: true })
  @Index()
  sessionExpiresAt: Date | null; // Timestamp when 24-hour window expires

  // Computed columns for session tracking
  @Column({
    name: 'is_session_active',
    type: 'boolean',
    generatedType: 'STORED',
    asExpression: 'session_expires_at IS NOT NULL AND session_expires_at > NOW()',
    insert: false,
    update: false,
  })
  isSessionActive: boolean;

  @Column({
    name: 'session_remaining_seconds',
    type: 'integer',
    generatedType: 'STORED',
    asExpression: `CASE WHEN session_expires_at > NOW() THEN EXTRACT(EPOCH FROM (session_expires_at - NOW()))::INTEGER ELSE 0 END`,
    insert: false,
    update: false,
  })
  sessionRemainingSeconds: number;

  // Additional Fields
  @Column({ type: 'jsonb', default: '[]' })
  tags: any[]; // For contact categorization

  @Column({ name: 'custom_fields', type: 'jsonb', default: '{}' })
  customFields: Record<string, any>; // Custom metadata

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
