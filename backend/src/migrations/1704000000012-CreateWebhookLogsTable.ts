import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateWebhookLogsTable1704000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'webhook_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'phone_number_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'webhook_payload',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'processing_status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
          },
          {
            name: 'processed_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'processing_duration_ms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_stack',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'message_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'wamid',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'wa_id',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'status_event_type',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'status_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'request_headers',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'request_ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'request_user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'webhook_signature',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'received_at',
            type: 'timestamp',
            default: 'now()',
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
    const indexes = [
      { name: 'IDX_WEBHOOK_LOGS_EVENT_TYPE', columns: ['event_type'] },
      { name: 'IDX_WEBHOOK_LOGS_PHONE_NUMBER_ID', columns: ['phone_number_id'] },
      { name: 'IDX_WEBHOOK_LOGS_PROCESSING_STATUS', columns: ['processing_status'] },
      { name: 'IDX_WEBHOOK_LOGS_WAMID', columns: ['wamid'] },
      { name: 'IDX_WEBHOOK_LOGS_WA_ID', columns: ['wa_id'] },
      { name: 'IDX_WEBHOOK_LOGS_RECEIVED_AT', columns: ['received_at'] },
      { name: 'IDX_WEBHOOK_LOGS_IDEMPOTENCY_KEY', columns: ['idempotency_key'] },
    ];

    for (const index of indexes) {
      await queryRunner.createIndex(
        'webhook_logs',
        new TableIndex({
          name: index.name,
          columnNames: index.columns,
        })
      );
    }

    // Create foreign keys
    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['phone_number_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'phone_numbers',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['message_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'messages',
        onDelete: 'SET NULL',
      })
    );

    await queryRunner.createForeignKey(
      'webhook_logs',
      new TableForeignKey({
        columnNames: ['contact_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'SET NULL',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('webhook_logs');
  }
}
