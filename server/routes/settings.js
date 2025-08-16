/**
 * Settings Routes - Consolidated settings management endpoints
 * Combines avatar settings and LLM settings
 */

import express from 'express';
import avatarRoutes from './settings-avatars.js';
import llmRoutes from './settings-llms.js';

const router = express.Router();

// Mount sub-routers
router.use('/', avatarRoutes);
router.use('/', llmRoutes);

export default router;