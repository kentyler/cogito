import { DatabaseAgent } from '../lib/database-agent.js';

async function checkStructure() {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    const result = await dbAgent.connector.query(
      `SELECT column_name, data_type, column_default, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = 'client_mgmt' AND table_name = 'clients' 
       ORDER BY ordinal_position`
    );
    console.log('Table structure:');
    console.table(result.rows);
    
    // Check constraints
    const constraintResult = await dbAgent.connector.query(
      `SELECT constraint_name, constraint_type 
       FROM information_schema.table_constraints 
       WHERE table_schema = 'client_mgmt' AND table_name = 'clients'`
    );
    console.log('\nConstraints:');
    console.table(constraintResult.rows);
    
    // Check sequence
    const seqResult = await dbAgent.connector.query(
      `SELECT sequence_name, last_value 
       FROM information_schema.sequences 
       WHERE sequence_schema = 'client_mgmt'`
    );
    console.log('\nSequences:');
    console.table(seqResult.rows);
    
  } finally {
    await dbAgent.close();
  }
}

checkStructure().catch(console.error);