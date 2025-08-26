/**
 * Summary Routes
 * Modular summary generation and retrieval
 */

import express from 'express';
import { handleMonthlyGeneration } from './summary-handlers/monthly-summaries.js';
import { handleDailyGeneration } from './summary-handlers/daily-summary.js';
import { handleYearlyGeneration } from './summary-handlers/yearly-summaries.js';
import { handleDailyFetch } from './summary-handlers/daily-fetch.js';

const router = express.Router();

// Generation endpoints
router.post('/generate-monthly-summaries', handleMonthlyGeneration);
router.post('/generate-daily-summary', handleDailyGeneration);
router.post('/generate-yearly-summaries', handleYearlyGeneration);

// Retrieval endpoints
router.get('/daily-summary/:date', handleDailyFetch);

export default router;