import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration: Add profile_picture_url column to contacts table
 * Adds support for storing WhatsApp profile pictures
 */
export class AddProfilePictureUrlToContacts1704000000021 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'contacts',
      new TableColumn({
        name: 'profile_picture_url',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('contacts', 'profile_picture_url');
  }
}
