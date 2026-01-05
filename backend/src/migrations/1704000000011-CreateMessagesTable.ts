import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMessagesTable1704000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'wamid',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: true,
          },
          {
            name: 'phone_number_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'contact_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'direction',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'message_type',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'from_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'to_number',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          // TEXT
          {
            name: 'text_body',
            type: 'text',
            isNullable: true,
          },
          // MEDIA
          {
            name: 'media_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'media_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'media_mime_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'media_sha256',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'media_file_size',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'media_caption',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'media_filename',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // LOCATION
          {
            name: 'location_latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'location_longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'location_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'location_address',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'location_url',
            type: 'text',
            isNullable: true,
          },
          // INTERACTIVE
          {
            name: 'interactive_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'interactive_payload',
            type: 'jsonb',
            isNullable: true,
          },
          // TEMPLATE
          {
            name: 'template_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'template_language',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'template_namespace',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'template_components',
            type: 'jsonb',
            isNullable: true,
          },
          // CONTACTS
          {
            name: 'contacts_payload',
            type: 'jsonb',
            isNullable: true,
          },
          // REACTION
          {
            name: 'reaction_message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'reaction_emoji',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          // BUTTON
          {
            name: 'button_payload',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'button_text',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          // CONTEXT
          {
            name: 'context_message_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'context_from',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'is_forwarded',
            type: 'boolean',
            default: false,
          },
          {
            name: 'forwarded_times',
            type: 'integer',
            default: 0,
          },
          // ERROR
          {
            name: 'error_code',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'error_title',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error_details',
            type: 'jsonb',
            isNullable: true,
          },
          // PRICING
          {
            name: 'conversation_id',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'conversation_category',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'conversation_expiration_timestamp',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_billable',
            type: 'boolean',
            default: true,
          },
          {
            name: 'pricing_model',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          // RAW PAYLOAD
          {
            name: 'raw_payload',
            type: 'jsonb',
            isNullable: true,
          },
          // TIMESTAMPS
          {
            name: 'timestamp',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'delivered_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'read_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'failed_at',
            type: 'timestamp',
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

    // Create indexes
    const indexes = [
      { name: 'IDX_MESSAGES_WAMID', columns: ['wamid'] },
      { name: 'IDX_MESSAGES_PHONE_NUMBER_ID', columns: ['phone_number_id'] },
      { name: 'IDX_MESSAGES_CONTACT_ID', columns: ['contact_id'] },
      { name: 'IDX_MESSAGES_DIRECTION', columns: ['direction'] },
      { name: 'IDX_MESSAGES_STATUS', columns: ['status'] },
      { name: 'IDX_MESSAGES_TIMESTAMP', columns: ['timestamp'] },
      { name: 'IDX_MESSAGES_MESSAGE_TYPE', columns: ['message_type'] },
      { name: 'IDX_MESSAGES_CONVERSATION_ID', columns: ['conversation_id'] },
      { name: 'IDX_MESSAGES_CONTEXT_MESSAGE_ID', columns: ['context_message_id'] },
    ];

    for (const index of indexes) {
      await queryRunner.createIndex(
        'messages',
        new TableIndex({
          name: index.name,
          columnNames: index.columns,
        })
      );
    }

    // Create foreign keys
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['phone_number_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'phone_numbers',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['contact_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
  }
}
