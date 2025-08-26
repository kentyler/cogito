/**
 * Client Management Selection Routes
 * Modular client selection and switching
 */

import express from 'express';
import { handleClientSelection } from './handlers/client-selector.js';
import { handleClientSwitch } from './handlers/client-switcher.js';

const router = express.Router();

// Client selection endpoint (for initial login with multiple clients OR switching clients)
router.post('/select-client', handleClientSelection);

// Switch client (for already authenticated users)
router.post('/switch-client', handleClientSwitch);

export default router;