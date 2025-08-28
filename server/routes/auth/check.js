/**
 * Auth Check Handler
 * Validates current session status
 */

import { ApiResponses } from '#server/api/api-responses.js';

export function handleAuthCheck(req, res) {
  // Check if user is authenticated via session
  if (req.session?.user?.id && req.session?.user?.email) {
    return ApiResponses.success(res, { 
      authenticated: true, 
      user: {
        id: req.session.user.id,
        email: req.session.user.email,
        client_id: req.session.user.client_id,
        client_name: req.session.user.client_name
      }
    });
  } else {
    // Not authenticated - return proper response (not an error)
    return ApiResponses.success(res, { 
      authenticated: false 
    });
  }
}