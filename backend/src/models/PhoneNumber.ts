import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

/**
 * Phone Number Model
 * Hanya menyimpan credentials untuk koneksi ke WhatsApp Cloud API
 * Data real-time seperti quality rating, messaging limits, dll akan di-fetch dari WhatsApp API
 */
@Entity('phone_numbers')
export class PhoneNumber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // WhatsApp Credentials (HANYA INI YANG DISIMPAN)
  @Column({ name: 'phone_number_id', unique: true })
  phoneNumberId: string; // WhatsApp Phone Number ID dari Meta Developer

  @Column({ name: 'access_token', type: 'text' })
  accessToken: string; // Permanent Access Token dari Meta

  @Column({ name: 'waba_id' })
  wabaId: string; // WhatsApp Business Account ID

  // Optional fields untuk user experience
  @Column({ type: 'text', nullable: true })
  name: string | null; // Nama/label untuk phone number ini (untuk kemudahan identifikasi)

  @Column({ name: 'is_active', default: true })
  isActive: boolean; // Status aktif/non-aktif di sistem kita

  // Cached fields dari WhatsApp API (di-sync secara berkala)
  @Column({ name: 'display_phone_number', type: 'varchar', nullable: true })
  displayPhoneNumber: string | null;

  @Column({ name: 'verified_name', type: 'varchar', nullable: true })
  verifiedName: string | null;

  @Column({ name: 'quality_rating', type: 'varchar', nullable: true, default: 'UNKNOWN' })
  qualityRating: string | null;

  @Column({ name: 'messaging_limit_tier', type: 'varchar', nullable: true, default: 'TIER_NOT_SET' })
  messagingLimitTier: string | null;

  @Column({ name: 'is_official_business_account', type: 'boolean', nullable: true, default: false })
  isOfficialBusinessAccount: boolean | null;

  @Column({ name: 'last_sync_at', type: 'timestamp', nullable: true })
  lastSyncAt: Date | null;

  // Audit fields
  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
