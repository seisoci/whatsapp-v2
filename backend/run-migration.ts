import 'reflect-metadata';
import { AppDataSource } from './src/config/database';

async function runMigrations() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed successfully');

    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
