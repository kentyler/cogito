import fs from 'fs';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    const migration = fs.readFileSync('./migrations/064_add_invitation_fields_to_users.sql', 'utf8');
    
    console.log('Running migration 064: Add invitation fields to users table...');
    await pool.query(migration);
    
    console.log('✅ Migration completed successfully');
    
    // Verify the columns were added
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'client_mgmt' 
      AND table_name = 'users' 
      AND column_name IN ('invitation_token', 'invitation_expires', 'invited_by_user_id', 'invited_at')
      ORDER BY column_name
    `);
    
    console.log('\n✅ New columns verified:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

runMigration();