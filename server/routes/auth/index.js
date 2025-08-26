/**
 * Authentication Routes
 * Consolidated router for auth endpoints
 */

import express from 'express';
import { handleLogin } from './login.js';
import { handleLogout } from './logout.js';
import { handleAuthCheck } from './check.js';

const router = express.Router();

// Route handlers
router.post('/login', handleLogin);
router.get('/check', handleAuthCheck);
router.post('/logout', handleLogout);

// Export middleware for use in other routes
export { requireAuth } from './middleware.js';

export default router;