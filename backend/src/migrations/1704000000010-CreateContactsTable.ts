import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateContactsTable1704000000010 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'contacts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'wa_id',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'phone_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'profile_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'business_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'phone_number_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_business_account',
            type: 'boolean',
            default: false,
          },
          {
            name: 'is_blocked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'first_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_customer_message_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'session_expires_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'jsonb',
            default: "'[]'",
          },
          {
            name: 'custom_fields',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Note: Session tracking (is_session_active, session_remaining_seconds) 
    // will be computed in application layer instead of database generated columns
    // because PostgreSQL generated columns require IMMUTABLE expressions,
    // but NOW() is VOLATILE (non-deterministic)

    // Create indexes
    await queryRunner.createIndex(
      'contacts',
      new TableIndex({
        name: 'IDX_CONTACTS_WA_ID',
        columnNames: ['wa_id'],
      })
    );

    await queryRunner.createIndex(
      'contacts',
      new TableIndex({
        name: 'IDX_CONTACTS_PHONE_NUMBER_ID',
        columnNames: ['phone_number_id'],
      })
    );

    await queryRunner.createIndex(
      'contacts',
      new TableIndex({
        name: 'IDX_CONTACTS_SESSION_EXPIRES',
        columnNames: ['session_expires_at'],
      })
    );

    await queryRunner.createIndex(
      'contacts',
      new TableIndex({
        name: 'IDX_CONTACTS_LAST_MESSAGE',
        columnNames: ['last_message_at'],
      })
    );

    // Create foreign key to phone_numbers table
    await queryRunner.createForeignKey(
      'contacts',
      new TableForeignKey({
        columnNames: ['phone_number_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'phone_numbers',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contacts');
  }
}
