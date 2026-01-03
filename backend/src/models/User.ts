import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import type { RefreshToken } from './RefreshToken';
import type { Role } from './Role';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  @Index()
  email: string;

  @Column({ unique: true, length: 50 })
  @Index()
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockUntil: Date | null;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date | null;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  roleId: string | null;

  @OneToMany('RefreshToken', 'user')
  refreshTokens: RefreshToken[];

  @ManyToOne('Role', 'users', {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
      this.password = await bcrypt.hash(this.password, rounds);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeUsername() {
    if (this.username) {
      this.username = this.username.toLowerCase().trim();
    }
  }

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }

  async incrementLoginAttempts(): Promise<void> {
    const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
    const lockTime = parseInt(process.env.LOCK_TIME || '15');

    if (this.lockUntil && this.lockUntil < new Date()) {
      this.loginAttempts = 1;
      this.lockUntil = null;
    } else {
      this.loginAttempts += 1;
      if (this.loginAttempts >= maxAttempts && !this.isLocked()) {
        this.lockUntil = new Date(Date.now() + lockTime * 60 * 1000);
      }
    }
  }

  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockUntil = null;
  }

  /**
   * Permission Helper Methods (mirip Laravel HasPermissionsTrait)
   */

  /**
   * Check if user has specific permission (through role)
   * @param permissionSlug - Permission slug to check
   */
  hasPermissionTo(permissionSlug: string): boolean {
    if (!this.role || !this.role.permissions) return false;
    return this.role.hasPermission(permissionSlug);
  }

  /**
   * Check if user has any of the permissions
   * @param permissionSlugs - Array of permission slugs
   */
  hasAnyPermission(permissionSlugs: string[]): boolean {
    if (!this.role || !this.role.permissions) return false;
    return this.role.hasAnyPermission(permissionSlugs);
  }

  /**
   * Check if user has all permissions
   * @param permissionSlugs - Array of permission slugs
   */
  hasAllPermissions(permissionSlugs: string[]): boolean {
    if (!this.role || !this.role.permissions) return false;
    return this.role.hasAllPermissions(permissionSlugs);
  }

  /**
   * Check if user has specific role
   * @param roleSlug - Role slug to check
   */
  hasRole(roleSlug: string): boolean {
    if (!this.role) return false;
    return this.role.slug === roleSlug;
  }

  /**
   * Check if user has any of the roles
   * @param roleSlugs - Array of role slugs
   */
  hasAnyRole(roleSlugs: string[]): boolean {
    if (!this.role) return false;
    return roleSlugs.includes(this.role.slug);
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.roleId === '1' || this.hasRole('super-admin');
  }

  /**
   * Get all permission slugs for this user
   */
  getPermissionSlugs(): string[] {
    if (!this.role) return [];
    return this.role.getPermissionSlugs();
  }

  /**
   * Check if user has permission through their role
   * Alias for hasPermissionTo for Laravel compatibility
   */
  hasPermissionThroughRole(permissionSlug: string): boolean {
    return this.hasPermissionTo(permissionSlug);
  }

  toJSON() {
    const { password, passwordResetToken, passwordResetExpires, ...user } = this;
    return user;
  }
}

