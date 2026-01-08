import 'reflect-metadata';
import { AppDataSource } from './config/database';

async function runMigrations() {
  console.log('Running migrations...');
  
  try {
    await AppDataSource.initialize();
    console.log('Database connected');
    
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully!');
    
    await AppDataSource.destroy();
    console.log('Connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
