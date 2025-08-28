/**
 * Client Management Routes - Consolidated client management endpoints
 * Combines core client operations and client selection/switching
 */

import express from 'express';
import clientCoreRoutes from './core.js';
import clientSelectionRoutes from './selection.js';

const router = express.Router();

// Mount sub-routers
router.use('/', clientCoreRoutes);
router.use('/', clientSelectionRoutes);

export default router;