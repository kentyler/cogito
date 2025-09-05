/**
 * Settings Routes - Consolidated settings management endpoints
 * LLM and temperature settings (avatar system removed)
 */

import express from 'express';
import avatarRoutes from './avatars.js'; // DEPRECATED: Avatar routes kept for compatibility
import llmRoutes from './llms.js';
import temperatureRoutes from './temperature-settings.js';

const router = express.Router();

// Mount sub-routers
router.use('/', avatarRoutes); // DEPRECATED: Avatar routes return empty responses
router.use('/', llmRoutes);
router.use('/', temperatureRoutes);


export default router;