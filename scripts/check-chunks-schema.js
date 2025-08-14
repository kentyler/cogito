import { DatabaseAgent } from '../lib/database-agent.js';

async function checkChunksSchema() {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    const result = await dbAgent.connector.query(
      `SELECT column_name, data_type, column_default, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = 'context' AND table_name = 'chunks' 
       ORDER BY ordinal_position`
    );
    console.log('Chunks table structure:');
    console.table(result.rows);
    
  } finally {
    await dbAgent.close();
  }
}

checkChunksSchema().catch(console.error);