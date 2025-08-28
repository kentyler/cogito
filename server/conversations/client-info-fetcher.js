/**
 * Client Info Fetcher - Handles client information retrieval
 */

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
    const pool = req.pool || req.db;
    if (!clientId || !pool || req.session?.user?.client_name) {
      return null;
    }

    try {
      const clientResult = await pool.query(
        'SELECT name as client_name FROM client_mgmt.clients WHERE id = $1',
        [clientId]
      );
      
      return clientResult.rows.length > 0 ? clientResult.rows[0].client_name : null;
    } catch (error) {
      console.log('Could not fetch client name:', error.message);
      return null;
    }
  }
}