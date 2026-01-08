import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTagsAndContactTagsTables1704000000026 implements MigrationInterface {
  name = 'CreateTagsAndContactTagsTables1704000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tags table
    await queryRunner.createTable(
      new Table({
        name: 'tags',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'color',
            type: 'varchar',
            default: "'blue'",
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

    // Create contact_tags join table
    await queryRunner.createTable(
      new Table({
        name: 'contact_tags',
        columns: [
          {
            name: 'contact_id',
            type: 'uuid',
          },
          {
            name: 'tag_id',
            type: 'uuid',
          },
        ],
      }),
      true
    );

    // Add primary key
    await queryRunner.query(`
      ALTER TABLE "contact_tags" 
      ADD CONSTRAINT "PK_contact_tags" 
      PRIMARY KEY ("contact_id", "tag_id")
    `);

    // Add foreign keys
    await queryRunner.createForeignKey(
      'contact_tags',
      new TableForeignKey({
        columnNames: ['contact_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'contacts',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'contact_tags',
      new TableForeignKey({
        columnNames: ['tag_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'contact_tags',
      new TableIndex({
        name: 'IDX_contact_tags_contact_id',
        columnNames: ['contact_id'],
      })
    );

    await queryRunner.createIndex(
      'contact_tags',
      new TableIndex({
        name: 'IDX_contact_tags_tag_id',
        columnNames: ['tag_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('contact_tags');
    await queryRunner.dropTable('tags');
  }
}
