/**
 * Client Info Fetcher - Handles client information retrieval
 */

import { DatabaseAgent } from '#database/database-agent.js';

export class ClientInfoFetcher {
  /**
   * Get client info from session
   */
  static getClientInfoFromSession(req) {
    if (req.session?.user) {
      return {
        clientId: req.session.user.client_id,
        clientName: req.session.user.client_name || 'your organization'
      };
    }
    return { clientId: null, clientName: 'your organization' };
  }

  /**
   * Fetch client name from database if missing
   */
  static async fetchClientNameFromDb(req, clientId) {
    if (!clientId || req.session?.user?.client_name) {
      return null;
    }

    const dbAgent = new DatabaseAgent();

    try {
      await dbAgent.connect();
      const clientName = await dbAgent.clients.getClientName(clientId);
      await dbAgent.close();
      
      return clientName;
    } catch (error) {
      console.log('Could not fetch client name:', error.message);
      if (dbAgent.connector && dbAgent.connector.pool) {
        await dbAgent.close();
      }
      return null;
    }
  }
}