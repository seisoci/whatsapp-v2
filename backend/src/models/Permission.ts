import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Role } from './Role';
import type { MenuManager } from './MenuManager';

/**
 * Permission Entity
 * Menyimpan data permission untuk akses CRUD
 * Format: menu-action (contoh: user-index, user-store, user-update, user-destroy)
 */
@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'bigint', unsigned: true })
  menuManagerId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToOne('MenuManager', 'permissions', {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'menuManagerId' })
  menu: MenuManager;

  @ManyToMany('Role', 'permissions')
  roles: Role[];

  /**
   * Extract action from permission slug
   * Example: "user-store" => "store"
   */
  getAction(): string {
    const parts = this.slug.split('-');
    return parts[parts.length - 1];
  }

  /**
   * Extract resource from permission slug
   * Example: "user-store" => "user"
   */
  getResource(): string {
    const parts = this.slug.split('-');
    parts.pop(); // Remove last part (action)
    return parts.join('-');
  }

  /**
   * Check if permission is CRUD action
   */
  isCrudAction(): boolean {
    const action = this.getAction();
    return ['index', 'store', 'update', 'destroy', 'show'].includes(action);
  }
}
