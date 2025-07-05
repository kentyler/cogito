const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://user:password@host/database',
  ssl: { rejectUnauthorized: false }
});

async function removeParticipantIdFromTurns() {
  try {
    await client.connect();
    
    console.log('Starting migration to remove participant_id from conversation.turns...\n');
    
    // Start a transaction
    await client.query('BEGIN');
    
    try {
      // Step 1: Drop the view that depends on participant_id
      console.log('Step 1: Dropping block_turn_details view...');
      await client.query('DROP VIEW IF EXISTS public.block_turn_details CASCADE');
      console.log('✓ View dropped');
      
      // Step 2: Drop the index on participant_id
      console.log('\nStep 2: Dropping index on participant_id...');
      await client.query('DROP INDEX IF EXISTS conversation.idx_turns_participant');
      console.log('✓ Index dropped');
      
      // Step 3: Remove the participant_id column
      console.log('\nStep 3: Removing participant_id column...');
      await client.query('ALTER TABLE conversation.turns DROP COLUMN participant_id');
      console.log('✓ Column removed');
      
      // Step 4: Recreate the view without participant_id
      console.log('\nStep 4: Recreating block_turn_details view without participant_id...');
      await client.query(`
        CREATE VIEW public.block_turn_details AS
        SELECT 
          b.block_id,
          b.name AS block_name,
          b.block_type,
          t.turn_id,
          t.content,
          t."timestamp",
          bt.sequence_order,
          t.source_type,
          t.metadata AS turn_metadata,
          t.client_id
        FROM conversation.blocks b
        JOIN conversation.block_turns bt ON b.block_id = bt.block_id
        JOIN conversation.turns t ON bt.turn_id = t.turn_id
        ORDER BY b.created_at, bt.sequence_order
      `);
      console.log('✓ View recreated');
      
      // Step 5: Verify the changes
      console.log('\nStep 5: Verifying changes...');
      
      // Check that column is gone
      const columnCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'conversation' 
        AND table_name = 'turns' 
        AND column_name = 'participant_id'
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('✓ participant_id column successfully removed');
      } else {
        throw new Error('participant_id column still exists!');
      }
      
      // Check remaining columns
      const remainingColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'conversation' 
        AND table_name = 'turns' 
        ORDER BY ordinal_position
      `);
      
      console.log('\nRemaining columns in conversation.turns:');
      remainingColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('\n✅ Migration completed successfully!');
      
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('\n❌ Migration failed, rolling back...');
      throw err;
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

// Run the migration
removeParticipantIdFromTurns();