const { Pool } = require('pg');
require('dotenv').config();

// First, let's check what tables we expect in client_mgmt based on the codebase
async function checkExpectedTables() {
  console.log('Expected tables in client_mgmt schema based on codebase:');
  
  // Based on our migrations and code, these tables should exist:
  const expectedTables = [
    'users',
    'clients', 
    'participants',
    'topics',
    'user_sessions',
    'client_invitations',
    'participant_invitations'
  ];
  
  expectedTables.forEach(table => console.log(`  - ${table}`));
  
  // Now check what's actually in Render
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('\n🔍 Checking what tables actually exist in Render client_mgmt schema...');
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'client_mgmt'
      ORDER BY table_name
    `);
    
    const actualTables = result.rows.map(row => row.table_name);
    console.log('Actual tables:', actualTables);
    
    const missing = expectedTables.filter(table => !actualTables.includes(table));
    console.log('\n❌ Missing tables:', missing);
    
    // Let's also check what might be in the wrong schema
    console.log('\n🔍 Checking for these tables in other schemas...');
    for (const table of missing) {
      const searchResult = await pool.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = $1 AND table_schema != 'client_mgmt'
      `, [table]);
      
      if (searchResult.rows.length > 0) {
        console.log(`Found ${table} in:`, searchResult.rows.map(r => r.table_schema));
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkExpectedTables();