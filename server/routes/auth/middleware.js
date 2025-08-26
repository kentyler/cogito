/**
 * Authentication Middleware
 * Handles session and header-based authentication
 */

import { ApiResponses } from '../../lib/api-responses.js';

export function requireAuth(req, res, next) {
  // Debug logging
  console.log('Auth check - Session:', req.session ? 'exists' : 'missing');
  console.log('Auth check - Session user:', req.session?.user);
  console.log('Auth check - Headers:', {
    'x-user-id': req.headers['x-user-id'],
    'x-user-email': req.headers['x-user-email']
  });
  
  // Check session first (preserves existing functionality)
  if (req.session && req.session.user) {
    // Set up req.user for compatibility
    req.user = {
      id: req.session.user.user_id || req.session.user.id,
      email: req.session.user.email
    };
    return next();
  }
  
  // Fallback to headers from cogito-repl proxy (new functionality)
  if (req.headers['x-user-id'] && req.headers['x-user-email']) {
    req.user = {
      id: parseInt(req.headers['x-user-id']),
      email: req.headers['x-user-email']
    };
    return next();
  }
  
  console.log('Auth failed - returning 401');
  return ApiResponses.unauthorized(res, 'Authentication required');
}