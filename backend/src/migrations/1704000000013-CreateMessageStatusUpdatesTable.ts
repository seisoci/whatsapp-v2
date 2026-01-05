import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMessageStatusUpdatesTable1704000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'message_status_updates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'message_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status_timestamp',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'error_code',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'raw_payload',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create indexes
    await queryRunner.createIndex(
      'message_status_updates',
      new TableIndex({
        name: 'IDX_MESSAGE_STATUS_UPDATES_MESSAGE_ID',
        columnNames: ['message_id'],
      })
    );

    await queryRunner.createIndex(
      'message_status_updates',
      new TableIndex({
        name: 'IDX_MESSAGE_STATUS_UPDATES_STATUS',
        columnNames: ['status'],
      })
    );

    await queryRunner.createIndex(
      'message_status_updates',
      new TableIndex({
        name: 'IDX_MESSAGE_STATUS_UPDATES_TIMESTAMP',
        columnNames: ['status_timestamp'],
      })
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'message_status_updates',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('message_status_updates');
  }
}
