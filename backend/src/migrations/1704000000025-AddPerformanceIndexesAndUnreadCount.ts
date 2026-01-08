import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: Add Performance Indexes and Denormalize unread_count
 * 
 * Optimizations for handling 1M+ contacts:
 * 1. Add composite indexes for unread count queries
 * 2. Add index for last message lookup
 * 3. Add index for contacts sorting
 * 4. Add denormalized unread_count column to contacts
 * 5. Create trigger to auto-update unread_count
 */
export class AddPerformanceIndexesAndUnreadCount1704000000025 implements MigrationInterface {
    name = 'AddPerformanceIndexesAndUnreadCount1704000000025';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add composite index for unread count query (partial index)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_unread 
            ON messages(contact_id) 
            WHERE direction = 'incoming' AND read_at IS NULL
        `);

        // 2. Add index for last message lookup (sorted by timestamp)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_messages_contact_timestamp 
            ON messages(contact_id, timestamp DESC)
        `);

        // 3. Add index for contacts sorting by last_message_at
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_contacts_phone_last_message 
            ON contacts(phone_number_id, last_message_at DESC NULLS LAST)
        `);

        // 4. Add denormalized unread_count column to contacts
        await queryRunner.query(`
            ALTER TABLE contacts 
            ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0
        `);

        // 5. Backfill unread_count from existing messages
        await queryRunner.query(`
            UPDATE contacts c
            SET unread_count = (
                SELECT COUNT(*)
                FROM messages m
                WHERE m.contact_id = c.id
                  AND m.direction = 'incoming'
                  AND m.read_at IS NULL
            )
        `);

        // 6. Create trigger function to auto-update unread_count
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_contact_unread_count()
            RETURNS TRIGGER AS $$
            BEGIN
                -- On INSERT: increment if incoming and unread
                IF TG_OP = 'INSERT' THEN
                    IF NEW.direction = 'incoming' AND NEW.read_at IS NULL THEN
                        UPDATE contacts SET unread_count = unread_count + 1 
                        WHERE id = NEW.contact_id;
                    END IF;
                    RETURN NEW;
                END IF;
                
                -- On UPDATE: handle read_at changes
                IF TG_OP = 'UPDATE' THEN
                    -- Message was marked as read
                    IF NEW.direction = 'incoming' AND OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
                        UPDATE contacts SET unread_count = GREATEST(unread_count - 1, 0) 
                        WHERE id = NEW.contact_id;
                    END IF;
                    RETURN NEW;
                END IF;
                
                -- On DELETE: decrement if was unread incoming
                IF TG_OP = 'DELETE' THEN
                    IF OLD.direction = 'incoming' AND OLD.read_at IS NULL THEN
                        UPDATE contacts SET unread_count = GREATEST(unread_count - 1, 0) 
                        WHERE id = OLD.contact_id;
                    END IF;
                    RETURN OLD;
                END IF;
                
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 7. Create trigger on messages table
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trg_update_unread_count ON messages;
            CREATE TRIGGER trg_update_unread_count
            AFTER INSERT OR UPDATE OR DELETE ON messages
            FOR EACH ROW
            EXECUTE FUNCTION update_contact_unread_count();
        `);

        // 8. Add index on unread_count for filtering
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_contacts_unread 
            ON contacts(phone_number_id, unread_count) 
            WHERE unread_count > 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop trigger and function
        await queryRunner.query(`DROP TRIGGER IF EXISTS trg_update_unread_count ON messages`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_contact_unread_count`);
        
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS idx_contacts_unread`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_contacts_phone_last_message`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_contact_timestamp`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_messages_unread`);
        
        // Drop column
        await queryRunner.query(`ALTER TABLE contacts DROP COLUMN IF EXISTS unread_count`);
    }
}
