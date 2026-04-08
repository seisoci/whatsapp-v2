import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCachedFieldsToPhoneNumbers1704000000035 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('phone_numbers', [
      new TableColumn({
        name: 'display_phone_number',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'verified_name',
        type: 'varchar',
        length: '255',
        isNullable: true,
        default: null,
      }),
      new TableColumn({
        name: 'quality_rating',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'UNKNOWN'",
      }),
      new TableColumn({
        name: 'messaging_limit_tier',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'TIER_NOT_SET'",
      }),
      new TableColumn({
        name: 'is_official_business_account',
        type: 'boolean',
        isNullable: true,
        default: false,
      }),
      new TableColumn({
        name: 'last_sync_at',
        type: 'timestamp',
        isNullable: true,
        default: null,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('phone_numbers', 'display_phone_number');
    await queryRunner.dropColumn('phone_numbers', 'verified_name');
    await queryRunner.dropColumn('phone_numbers', 'quality_rating');
    await queryRunner.dropColumn('phone_numbers', 'messaging_limit_tier');
    await queryRunner.dropColumn('phone_numbers', 'is_official_business_account');
    await queryRunner.dropColumn('phone_numbers', 'last_sync_at');
  }
}
