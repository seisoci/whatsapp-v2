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
 * API Endpoint Model
 * Menyimpan konfigurasi API endpoint eksternal dengan status dan webhook URL
 */
@Entity('api_endpoints')
export class ApiEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'webhook_url', type: 'varchar', length: 500 })
  webhookUrl: string;

  @Column({ name: 'api_key', type: 'varchar', length: 255, nullable: true })
  apiKey: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

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
