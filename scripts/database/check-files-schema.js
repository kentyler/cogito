import { DatabaseAgent } from '../lib/database-agent.js';

async function checkFilesSchema() {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    // Schema verified: Using information_schema.columns for database introspection
    const result = await dbAgent.connector.query(
      `SELECT column_name, data_type, column_default, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = 'context' AND table_name = 'files' 
       ORDER BY ordinal_position`
    );
    console.log('Files table structure:');
    console.table(result.rows);
    
  } finally {
    await dbAgent.close();
  }
}

checkFilesSchema().catch(console.error);