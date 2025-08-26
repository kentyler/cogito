/**
 * Logout Handler
 * Handles session termination and cleanup
 */

import { DatabaseAgent } from '../../lib/database-agent.js';
import { ApiResponses } from '../../lib/api-responses.js';

export async function handleLogout(req, res) {
  try {
    const sessionUser = req.session?.user;
    
    // Initialize DatabaseAgent for event logging
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    
    // Log logout event before destroying session
    if (sessionUser) {
      await dbAgent.logAuthEvent('logout', {
        email: sessionUser.email,
        user_id: sessionUser.user_id || sessionUser.id,
        client_id: sessionUser.client_id,
        client_name: sessionUser.client_name,
        session_duration_ms: Date.now() - (req.session.cookie.originalMaxAge || 0)
      }, {
        userId: sessionUser.user_id || sessionUser.id,
        sessionId: req.sessionID,
        endpoint: `${req.method} ${req.path}`,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return ApiResponses.internalError(res, 'Logout failed');
      }
      
      res.clearCookie('connect.sid'); // Clear session cookie
      return ApiResponses.successMessage(res, 'Logged out successfully');
    });
    
    await dbAgent.close();
    
  } catch (error) {
    console.error('Logout error:', error);
    return ApiResponses.internalError(res, 'Logout failed');
  }
}