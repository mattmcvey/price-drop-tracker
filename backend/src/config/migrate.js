import { pool } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    console.log('Running database migrations...');

    const schemaPath = path.join(__dirname, '../../schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(schema);
    console.log('✓ Database migrations completed successfully');
  } catch (error) {
    // If tables already exist, that's fine
    if (error.code === '42P07') {
      console.log('✓ Database tables already exist');
      return;
    }
    console.error('Migration error:', error);
    throw error;
  }
}
