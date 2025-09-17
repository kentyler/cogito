/**
 * LLM Settings Routes
 * Modular LLM preference and availability management
 */

import express from 'express';
import { handleLLMPreferenceUpdate } from './handlers/llm-preferences.js';
import { handleLLMList } from './handlers/llm-list.js';
import { handleUserPreferences } from './handlers/user-preferences.js';

const router = express.Router();

console.log('🔧 LLM routes module loaded, registering endpoints...');

// LLM management endpoints
router.post('/user/llm-preference', handleLLMPreferenceUpdate);
router.get('/llms', handleLLMList);
router.get('/user/preferences', handleUserPreferences);

console.log('✅ LLM routes registered: /user/llm-preference, /llms, /user/preferences');

export default router;