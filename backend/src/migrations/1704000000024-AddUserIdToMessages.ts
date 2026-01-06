import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddUserIdToMessages1704000000024 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add user_id column to messages table
    await queryRunner.addColumn(
      'messages',
      new TableColumn({
        name: 'user_id',
        type: 'uuid',
        isNullable: true,
      })
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
        name: 'fk_messages_user_id',
      })
    );

    // Create index for better performance
    await queryRunner.query(`
      CREATE INDEX "idx_messages_user_id" ON "messages" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX "idx_messages_user_id"`);

    // Drop foreign key
    await queryRunner.dropForeignKey('messages', 'fk_messages_user_id');

    // Drop column
    await queryRunner.dropColumn('messages', 'user_id');
  }
}
