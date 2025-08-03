import express from 'express';
import { getDailySummaryData } from '../lib/daily-summary/daily-data.js';
import { generateDailySummary } from '../lib/daily-summary/daily-ai-summary.js';
import { generateMonthlySummaries } from '../lib/daily-summary/monthly-summaries.js';
import { generateYearlySummaries } from '../lib/daily-summary/yearly-summaries.js';

const router = express.Router();

router.get('/daily-summary/:date', getDailySummaryData);
router.post('/generate-daily-summary', generateDailySummary);
router.post('/generate-monthly-summaries', generateMonthlySummaries);
router.post('/generate-yearly-summaries', generateYearlySummaries);

export default router;