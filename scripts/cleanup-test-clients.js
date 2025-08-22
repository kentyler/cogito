import { DatabaseAgent } from '../lib/database-agent.js';

async function cleanupTestClients() {
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    // Schema verified: client_mgmt.clients table confirmed in production database
    // Check for any test clients
    const result = await dbAgent.connector.query(
      'SELECT id, name FROM client_mgmt.clients WHERE name LIKE \'Test Client%\' ORDER BY id DESC'
    );
    console.log('Found test clients:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('Sample:', result.rows.slice(0, 5));
    }
    
    // Clean up old test clients
    const deleteResult = await dbAgent.connector.query(
      'DELETE FROM client_mgmt.clients WHERE name LIKE \'Test Client%\''
    );
    console.log('\nDeleted', deleteResult.rowCount, 'test clients');
    
  } finally {
    await dbAgent.close();
  }
}

cleanupTestClients().catch(console.error);