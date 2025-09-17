/**
 * Client Temperature Loading for LLM Operations
 * Loads temperature settings from users table
 */

import { DatabaseAgent } from '#database/database-agent.js';

/**
 * Load client temperature preference from database
 * @param {string|number} clientId - Client ID
 * @returns {Promise<number>} Temperature value (0-2, defaults to 0.7)
 */
export async function loadClientTemperature(clientId) {
  if (!clientId) {
    console.warn('No clientId provided, using default temperature');
    return 0.7;
  }
  
  const dbAgent = new DatabaseAgent();
  await dbAgent.connect();
  
  try {
    // Get temperature from users table via user_clients relationship
    const query = `
      SELECT u.last_temperature 
      FROM client_mgmt.users u
      JOIN client_mgmt.user_clients uc ON u.id = uc.user_id
      WHERE uc.client_id = $1
      AND u.last_temperature IS NOT NULL
      AND uc.is_active = true
      LIMIT 1
    `;
    
    const result = await dbAgent.connector.query(query, [clientId]);
    
    if (result.rows.length > 0 && result.rows[0].last_temperature !== null) {
      const temp = parseFloat(result.rows[0].last_temperature);
      if (temp >= 0 && temp <= 2) {
        return temp;
      }
    }
    
    // Default temperature if none found or invalid
    return 0.7;
    
  } catch (error) {
    console.error('Error loading client temperature:', error);
    return 0.7; // Fallback to default
    
  } finally {
    await dbAgent.close();
  }
}