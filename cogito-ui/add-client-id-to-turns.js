const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

async function addClientIdToTurns() {
  try {
    await client.connect();
    
    console.log('Starting migration to add client_id to conversation.turns...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Check if column already exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'conversation' 
        AND table_name = 'turns' 
        AND column_name = 'client_id'
      `;
      
      const columnExists = await client.query(checkColumnQuery);
      
      if (columnExists.rows.length === 0) {
        // Add client_id column
        console.log('Adding client_id column...');
        await client.query(`
          ALTER TABLE conversation.turns 
          ADD COLUMN client_id INTEGER
        `);
        
        console.log('Column added successfully');
      } else {
        console.log('client_id column already exists');
      }
      
      // Update all records to have client_id = 6
      console.log('Updating all records to client_id = 6...');
      const updateResult = await client.query(`
        UPDATE conversation.turns 
        SET client_id = 6 
        WHERE client_id IS NULL
      `);
      
      console.log(`Updated ${updateResult.rowCount} records`);
      
      // Verify the update
      const verifyQuery = `
        SELECT 
          COUNT(*) as total_turns,
          COUNT(CASE WHEN client_id = 6 THEN 1 END) as client_6_turns,
          COUNT(CASE WHEN client_id IS NULL THEN 1 END) as null_client_turns
        FROM conversation.turns
      `;
      
      const verifyResult = await client.query(verifyQuery);
      console.log('\nVerification:');
      console.log('Total turns:', verifyResult.rows[0].total_turns);
      console.log('Client 6 turns:', verifyResult.rows[0].client_6_turns);
      console.log('NULL client turns:', verifyResult.rows[0].null_client_turns);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('\nMigration completed successfully!');
      
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      throw err;
    }
    
    await client.end();
  } catch (err) {
    console.error('Migration failed:', err);
    await client.end();
    process.exit(1);
  }
}

// Run the migration
addClientIdToTurns();