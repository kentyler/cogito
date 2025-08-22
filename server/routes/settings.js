/**
 * Settings Routes - Consolidated settings management endpoints
 * Combines avatar settings and LLM settings
 */

import express from 'express';
import avatarRoutes from './settings-avatars.js';
import llmRoutes from './settings-llms.js';
import temperatureRoutes from './temperature-settings.js';

const router = express.Router();

// Mount sub-routers
router.use('/', avatarRoutes);
router.use('/', llmRoutes);
router.use('/', temperatureRoutes);

export default router;