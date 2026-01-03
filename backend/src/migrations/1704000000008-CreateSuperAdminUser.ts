import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcryptjs';

export class CreateSuperAdminUser1704000000008 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Hash password for super admin (default: "admin123")
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert super admin user
    await queryRunner.query(`
      INSERT INTO users (email, username, password, "isActive", "emailVerified", "roleId")
      VALUES (
        'superadmin@example.com',
        'superadmin',
        '${hashedPassword}',
        true,
        true,
        1
      )
      ON CONFLICT (email) DO NOTHING
    `);

    console.log('✅ Super Admin user created:');
    console.log('   Email: superadmin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: Super Admin (ID: 1)');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM users WHERE email = 'superadmin@example.com'
    `);
  }
}
