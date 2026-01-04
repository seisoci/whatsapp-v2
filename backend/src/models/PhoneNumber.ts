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
