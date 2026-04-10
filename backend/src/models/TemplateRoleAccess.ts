import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Role } from './Role';
import type { PhoneNumber } from './PhoneNumber';

/**
 * TemplateRoleAccess Entity
 * Menyimpan akses role ke WhatsApp template (many-to-many)
 * Template tidak memiliki tabel sendiri, ID berasal dari WhatsApp API
 */
@Entity('template_role_access')
export class TemplateRoleAccess {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255, name: 'template_id' })
  templateId: string; // ID template dari WhatsApp API

  @Column({ type: 'varchar', length: 255, name: 'template_name' })
  templateName: string; // Nama template (untuk display)

  @Column({ type: 'varchar', length: 255, name: 'waba_id' })
  wabaId: string; // WABA ID dari WhatsApp

  @Column({ type: 'uuid', name: 'phone_number_id' })
  phoneNumberDbId: string; // FK ke phone_numbers.id (UUID)

  @ManyToOne('PhoneNumber', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'phone_number_id' })
  phoneNumber: PhoneNumber;

  @Column({ type: 'bigint', name: 'role_id' })
  roleId: string; // FK ke roles.id (bigint)

  @ManyToOne('Role', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
