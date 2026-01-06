
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateQuickRepliesTable1704000000022 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "quick_replies",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid",
                    },
                    {
                        name: "user_id",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "shortcut",
                        type: "varchar",
                        length: "50",
                        isNullable: true,
                    },
                    {
                        name: "text",
                        type: "text",
                        isNullable: false,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "quick_replies",
            new TableForeignKey({
                columnNames: ["user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("quick_replies");
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf("user_id") !== -1
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey("quick_replies", foreignKey);
        }
        await queryRunner.dropTable("quick_replies");
    }
}
