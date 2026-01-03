import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Role } from './Role';
import type { Permission } from './Permission';

/**
 * Menu Manager Entity
 * Menyimpan data menu untuk sistem navigasi dan RBAC
 */
@Entity('menu_managers')
export class MenuManager {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'smallint', default: 0 })
  parentId: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  slug: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  pathUrl: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string | null;

  @Column({
    type: 'enum',
    enum: ['module', 'header', 'line', 'static'],
  })
  type: 'module' | 'header' | 'line' | 'static';

  @Column({ type: 'varchar', length: 255, nullable: true })
  position: string | null;

  @Column({ type: 'int' })
  sort: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  // Relations
  @ManyToMany('Role', 'menus')
  roles: Role[];

  @OneToMany('Permission', 'menu')
  permissions: Permission[];

  /**
   * Check if menu is accessible by role
   */
  isAccessibleBy(role: Role): boolean {
    if (!this.roles) return false;
    return this.roles.some((r) => r.id === role.id);
  }

  /**
   * Get menu permissions
   */
  getPermissions(): Permission[] {
    return this.permissions || [];
  }
}
