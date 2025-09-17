/**
 * Settings Routes - Consolidated settings management endpoints
 * LLM and temperature settings (avatar system removed)
 */

import express from 'express';
import llmRoutes from './llms.js';
import temperatureRoutes from './temperature-settings.js';

const router = express.Router();

console.log('🔧 Settings routes loaded:', {
  llmRoutes: !!llmRoutes, 
  temperatureRoutes: !!temperatureRoutes
});

// Mount sub-routers
router.use('/', llmRoutes);
router.use('/', temperatureRoutes);


export default router;