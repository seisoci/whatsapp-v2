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
  Unique,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { PhoneNumber } from './PhoneNumber';
import { Tag } from './Tag';

/**
 * Contact Model
 * Represents WhatsApp contacts/customers with 24-hour session window tracking
 * Each contact is unique per WhatsApp Business Number (composite key: waId + phoneNumberId)
 */
@Entity('contacts')
@Unique(['waId', 'phoneNumberId']) // Composite unique constraint
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // WhatsApp Identifiers
  @Column({ name: 'wa_id', length: 20 })
  @Index()
  waId: string; // WhatsApp ID (phone number without +)

  @Column({ name: 'phone_number', length: 20 })
  phoneNumber: string; // Full phone number with country code

  // Link to WhatsApp Business Number
  @Column({ name: 'phone_number_id', type: 'uuid' })
  @Index()
  phoneNumberId: string;

  @ManyToOne(() => PhoneNumber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber_: PhoneNumber;

  // Contact Profile Information
  @Column({ name: 'profile_name', type: 'varchar', length: 255, nullable: true })
  profileName: string | null; // Name from WhatsApp profile

  @Column({ name: 'business_name', type: 'varchar', length: 255, nullable: true })
  businessName: string | null; // For business contacts

  @Column({ name: 'profile_picture_url', type: 'text', nullable: true })
  profilePictureUrl: string | null; // WhatsApp profile picture URL

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

  /**
   * Computed property: Check if session is currently active
   * Computed at runtime instead of database generated column
   */
  get isSessionActive(): boolean {
    if (!this.sessionExpiresAt) return false;
    return this.sessionExpiresAt > new Date();
  }

  /**
   * Computed property: Get remaining seconds in session
   * Computed at runtime instead of database generated column
   */
  get sessionRemainingSeconds(): number {
    if (!this.sessionExpiresAt) return 0;
    const now = new Date();
    if (this.sessionExpiresAt <= now) return 0;
    return Math.floor((this.sessionExpiresAt.getTime() - now.getTime()) / 1000);
  }

  // Denormalized unread count (auto-updated via PostgreSQL trigger)
  @Column({ name: 'unread_count', type: 'integer', default: 0 })
  unreadCount: number;

  // Archive status for chat tabs feature
  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  // Additional Fields
  @ManyToMany(() => Tag, (tag) => tag.contacts, { cascade: true })
  @JoinTable({
    name: 'contact_tags',
    joinColumn: { name: 'contact_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

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
