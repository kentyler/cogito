/**
 * OAuth Client Assignment
 * Handles automatic client assignment for OAuth users
 */

/**
 * Handle client assignment for OAuth users
 * @param {Object} options
 * @param {Object} options.dbAgent - Database agent instance
 * @param {Object} options.user - User object with id property
 * @param {boolean} [options.isGoldenHordeInterface=false] - Whether this is Golden Horde interface OAuth
 * @returns {Promise<Array>} Array of client objects with client_id, client_name, and role
 */
export async function handleClientAssignment({ dbAgent, user, isGoldenHordeInterface = false }) {
  // Get existing client associations
  // Available methods: getUserClients returns array of client objects with client_id field
  let clients = await dbAgent.users.getUserClients(user.id);
  
  if (clients.length === 0) {
    if (isGoldenHordeInterface) {
      // For users accessing Golden Horde interface, assign to Golden Horde client (ID: 9)
      // This gives them access to Golden Horde context/materials in the database
      // Database fields: user_id (foreign key), client_id (foreign key)
      await dbAgent.pool.query(
        `INSERT INTO client_mgmt.user_clients (user_id, client_id, joined_at, is_active) 
         VALUES ($1, $2, NOW(), true)`,
        [user.id, 9]
      );
      
      clients.push({ 
        client_id: 9, 
        client_name: 'Golden Horde', 
        role: 'public_user' 
      });
    } else {
      // For regular OAuth users, auto-assign to default client (ID: 1)
      // Database fields: user_id (foreign key), client_id (foreign key)
      await dbAgent.pool.query(
        `INSERT INTO client_mgmt.user_clients (user_id, client_id, joined_at, is_active) 
         VALUES ($1, $2, NOW(), true)`,
        [user.id, 1]
      );
      
      clients.push({ 
        client_id: 1, 
        client_name: 'Default', 
        role: 'member' 
      });
    }
  }
  
  return clients;
}