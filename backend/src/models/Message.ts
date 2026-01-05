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
import { PhoneNumber } from './PhoneNumber';
import { Contact } from './Contact';

/**
 * Message Model
 * Stores all WhatsApp messages with support for multiple message types
 */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // WhatsApp Message ID
  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  @Index()
  wamid: string | null; // WhatsApp message ID (wamid.xxx)

  // Relationships
  @Column({ name: 'phone_number_id', type: 'uuid' })
  phoneNumberId: string;

  @ManyToOne(() => PhoneNumber, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber: PhoneNumber;

  @Column({ name: 'contact_id', type: 'uuid' })
  contactId: string;

  @ManyToOne(() => Contact, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contact_id' })
  contact: Contact;

  // Message Direction
  @Column({
    type: 'varchar',
    length: 10,
  })
  @Index()
  direction: 'incoming' | 'outgoing';

  // Message Type
  @Column({ name: 'message_type', type: 'varchar', length: 20 })
  @Index()
  messageType:
    | 'text'
    | 'image'
    | 'video'
    | 'audio'
    | 'document'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'interactive'
    | 'template'
    | 'reaction'
    | 'unsupported'
    | 'button'
    | 'order'
    | 'system';

  // Message Status (for outgoing messages)
  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'deleted' | 'pending' | null;

  // Sender/Recipient Information
  @Column({ name: 'from_number', type: 'varchar', length: 20 })
  fromNumber: string; // Sender's phone number

  @Column({ name: 'to_number', type: 'varchar', length: 20 })
  toNumber: string; // Recipient's phone number

  // Message Content (Type-specific payloads)
  // TEXT
  @Column({ name: 'text_body', type: 'text', nullable: true })
  textBody: string | null;

  // MEDIA (image, video, audio, document, sticker)
  @Column({ name: 'media_id', type: 'varchar', length: 255, nullable: true })
  mediaId: string | null; // WhatsApp media ID

  @Column({ name: 'media_url', type: 'text', nullable: true })
  mediaUrl: string | null; // URL to media file

  @Column({ name: 'media_mime_type', type: 'varchar', length: 100, nullable: true })
  mediaMimeType: string | null;

  @Column({ name: 'media_sha256', type: 'varchar', length: 64, nullable: true })
  mediaSha256: string | null;

  @Column({ name: 'media_file_size', type: 'bigint', nullable: true })
  mediaFileSize: number | null;

  @Column({ name: 'media_caption', type: 'text', nullable: true })
  mediaCaption: string | null;

  @Column({ name: 'media_filename', type: 'varchar', length: 255, nullable: true })
  mediaFilename: string | null;

  // LOCATION
  @Column({ name: 'location_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLatitude: number | null;

  @Column({ name: 'location_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLongitude: number | null;

  @Column({ name: 'location_name', type: 'varchar', length: 255, nullable: true })
  locationName: string | null;

  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress: string | null;

  @Column({ name: 'location_url', type: 'text', nullable: true })
  locationUrl: string | null;

  // INTERACTIVE (buttons, lists, product messages)
  @Column({ name: 'interactive_type', type: 'varchar', length: 50, nullable: true })
  interactiveType: string | null; // 'button', 'list', 'product', 'product_list'

  @Column({ name: 'interactive_payload', type: 'jsonb', nullable: true })
  interactivePayload: any | null; // Full interactive message structure

  // TEMPLATE
  @Column({ name: 'template_name', type: 'varchar', length: 255, nullable: true })
  templateName: string | null;

  @Column({ name: 'template_language', type: 'varchar', length: 10, nullable: true })
  templateLanguage: string | null;

  @Column({ name: 'template_namespace', type: 'varchar', length: 255, nullable: true })
  templateNamespace: string | null;

  @Column({ name: 'template_components', type: 'jsonb', nullable: true })
  templateComponents: any | null; // Template component parameters

  // CONTACTS (vCard)
  @Column({ name: 'contacts_payload', type: 'jsonb', nullable: true })
  contactsPayload: any | null; // Array of contact objects

  // REACTION
  @Column({ name: 'reaction_message_id', type: 'varchar', length: 255, nullable: true })
  reactionMessageId: string | null; // Message being reacted to

  @Column({ name: 'reaction_emoji', type: 'varchar', length: 10, nullable: true })
  reactionEmoji: string | null;

  // BUTTON REPLY
  @Column({ name: 'button_payload', type: 'varchar', length: 255, nullable: true })
  buttonPayload: string | null; // Button ID clicked

  @Column({ name: 'button_text', type: 'varchar', length: 255, nullable: true })
  buttonText: string | null; // Button text

  // CONTEXT (Reply/Forward)
  @Column({ name: 'context_message_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  contextMessageId: string | null; // ID of message being replied to

  @Column({ name: 'context_from', type: 'varchar', length: 20, nullable: true })
  contextFrom: string | null; // Original sender

  @Column({ name: 'is_forwarded', default: false })
  isForwarded: boolean;

  @Column({ name: 'forwarded_times', default: 0 })
  forwardedTimes: number;

  // Error Information (for failed messages)
  @Column({ name: 'error_code', type: 'integer', nullable: true })
  errorCode: number | null;

  @Column({ name: 'error_title', type: 'varchar', length: 255, nullable: true })
  errorTitle: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'error_details', type: 'jsonb', nullable: true })
  errorDetails: any | null;

  // Pricing Information
  @Column({ name: 'conversation_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  conversationId: string | null; // WhatsApp conversation ID

  @Column({ name: 'conversation_category', type: 'varchar', length: 50, nullable: true })
  conversationCategory: string | null; // 'business_initiated', 'customer_initiated', 'referral_conversion'

  @Column({ name: 'conversation_expiration_timestamp', type: 'timestamp', nullable: true })
  conversationExpirationTimestamp: Date | null;

  @Column({ name: 'is_billable', default: true })
  isBillable: boolean;

  @Column({ name: 'pricing_model', type: 'varchar', length: 50, nullable: true })
  pricingModel: string | null;

  // Raw Payload
  @Column({ name: 'raw_payload', type: 'jsonb', nullable: true })
  rawPayload: any | null; // Complete webhook payload for reference

  // Timestamps
  @Column({ type: 'timestamp' })
  @Index()
  timestamp: Date; // Message timestamp from WhatsApp

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null; // When message was sent (outgoing)

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date | null; // When message was delivered (outgoing)

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null; // When message was read (outgoing)

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date | null; // When message failed (outgoing)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
