import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createUsersAndClients() {
  const userData = [
    { name: 'Angel Salmons', email: 'angel@funkyme.farm' },
    { name: 'Doug Rabow', email: 'dougrabow@gmail.com' },
    { name: 'Drew Deal', email: 'drewdeal@gmail.com' },
    { name: 'Craig Gagnon', email: 'gagnon.craig.g@gmail.com' },
    { name: 'Jennifer May', email: 'jennifer.krings@yahoo.com' },
    { name: 'Karl Perry', email: 'karl@yourthinkingcoach.com' },
    { name: 'Kathryn Belcher', email: 'kathrynmbelcher@gmail.com' },
    { name: 'Krisztina Little', email: 'krisztinalittle44@gmail.com' },
    { name: 'Linden Vazey', email: 'Linden.m@gmail.com' },
    { name: 'Mike Salmons', email: 'mike@funkyme.farm' },
    { name: 'Kevin Bonnett', email: 'mkevinbonnett@gmail.com' },
    { name: 'Pedro Lourenco', email: 'plemoslourenco@gmail.com' },
    { name: 'Richa Basnet', email: 'prabasnet1@gmail.com' },
    { name: 'Julian Andrews', email: 'julianandrewsnz@gmail.com' },
    { name: 'Christopher Walker', email: 'cswalker@gmail.com' },
    { name: 'Andrew Harner', email: 'Aharner11486@gmail.com' },
    { name: 'Bruno Guardia', email: 'bruno@bguardia.com' }
  ];
  
  const clientId = 9;
  const emails = userData.map(u => u.email);
  
  try {
    // Generate password hash
    const passwordHash = await bcrypt.hash('goldenhorde', 10);
    console.log(`Generated password hash for 'goldenhorde'`);
    
    // Check existing users
    const existingQuery = `
      SELECT id, email, metadata, password_hash 
      FROM client_mgmt.users 
      WHERE email = ANY($1::text[])
    `;
    
    const existing = await pool.query(existingQuery, [emails]);
    console.log(`\nFound ${existing.rows.length} existing users:`);
    existing.rows.forEach(u => {
      const name = u.metadata?.display_name || u.metadata?.name || 'no name';
      console.log(`  - ${u.email} (id: ${u.id}, name: ${name}, has_password: ${u.password_hash ? 'yes' : 'no'})`);
    });
    
    // Determine which users need to be created
    const existingEmails = existing.rows.map(r => r.email.toLowerCase());
    const toCreate = userData.filter(u => !existingEmails.includes(u.email.toLowerCase()));
    const toUpdate = existing.rows.filter(r => !r.password_hash);
    
    console.log(`\nNeed to create ${toCreate.length} new users`);
    console.log(`Need to update password for ${toUpdate.length} existing users`);
    
    // Create new users
    if (toCreate.length > 0) {
      console.log('\nCreating new users...');
      for (const user of toCreate) {
        const metadata = { display_name: user.name };
        const insertQuery = `
          INSERT INTO client_mgmt.users (email, metadata, password_hash, active, created_at, updated_at)
          VALUES ($1, $2, $3, true, NOW(), NOW())
          RETURNING id, email, metadata
        `;
        const result = await pool.query(insertQuery, [user.email, JSON.stringify(metadata), passwordHash]);
        console.log(`  Created user: ${result.rows[0].email} (id: ${result.rows[0].id})`);
      }
    }
    
    // Update existing users without passwords
    if (toUpdate.length > 0) {
      console.log('\nUpdating existing users with password...');
      for (const user of toUpdate) {
        const updateQuery = `
          UPDATE client_mgmt.users 
          SET password_hash = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, email
        `;
        const result = await pool.query(updateQuery, [passwordHash, user.id]);
        console.log(`  Updated password for: ${result.rows[0].email} (id: ${result.rows[0].id})`);
      }
    }
    
    // Get all user IDs (both new and existing)
    const allUsersQuery = `
      SELECT id, email 
      FROM client_mgmt.users 
      WHERE email = ANY($1::text[])
    `;
    const allUsers = await pool.query(allUsersQuery, [emails]);
    
    // Check existing user_clients relationships
    const userIds = allUsers.rows.map(u => u.id);
    const existingClientsQuery = `
      SELECT user_id 
      FROM client_mgmt.user_clients 
      WHERE user_id = ANY($1::int[]) AND client_id = $2
    `;
    const existingClients = await pool.query(existingClientsQuery, [userIds, clientId]);
    const existingUserClientIds = existingClients.rows.map(r => r.user_id);
    
    // Create user_clients relationships for users that don't have them
    const usersNeedingClientLink = allUsers.rows.filter(u => !existingUserClientIds.includes(u.id));
    
    if (usersNeedingClientLink.length > 0) {
      console.log(`\nCreating user_clients relationships for ${usersNeedingClientLink.length} users...`);
      for (const user of usersNeedingClientLink) {
        const insertClientQuery = `
          INSERT INTO client_mgmt.user_clients (user_id, client_id, joined_at, is_active)
          VALUES ($1, $2, NOW(), true)
          RETURNING user_id, client_id
        `;
        await pool.query(insertClientQuery, [user.id, clientId]);
        console.log(`  Linked user ${user.email} to client ${clientId}`);
      }
    } else {
      console.log('\nAll users already linked to client 9');
    }
    
    console.log('\n✅ All operations completed successfully!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  createUsersAndClients();
}

export default createUsersAndClients;