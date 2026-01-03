import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import type { Permission } from './Permission';
import type { MenuManager } from './MenuManager';
import type { User } from './User';

/**
 * Role Entity
 * Menyimpan data role/peran untuk sistem RBAC
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToMany('Permission', 'roles', { cascade: true })
  @JoinTable({
    name: 'permission_role',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ManyToMany('MenuManager', 'roles', { cascade: true })
  @JoinTable({
    name: 'menu_manager_role',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'menu_manager_id', referencedColumnName: 'id' },
  })
  menus: MenuManager[];

  @OneToMany('User', 'role')
  users: User[];

  /**
   * Check if role has specific permission
   */
  hasPermission(permissionSlug: string): boolean {
    if (!this.permissions) return false;
    return this.permissions.some((p) => p.slug === permissionSlug);
  }

  /**
   * Check if role has any of the permissions
   */
  hasAnyPermission(permissionSlugs: string[]): boolean {
    if (!this.permissions) return false;
    return this.permissions.some((p) => permissionSlugs.includes(p.slug));
  }

  /**
   * Check if role has all permissions
   */
  hasAllPermissions(permissionSlugs: string[]): boolean {
    if (!this.permissions) return false;
    return permissionSlugs.every((slug) => this.permissions.some((p) => p.slug === slug));
  }

  /**
   * Get all permission slugs
   */
  getPermissionSlugs(): string[] {
    if (!this.permissions) return [];
    return this.permissions.map((p) => p.slug);
  }
}
