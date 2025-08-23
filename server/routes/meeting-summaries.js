import { ApiResponses } from '../lib/api-responses.js';
import express from 'express';

const router = express.Router();

// Meeting summary endpoint
router.get('/meeting-summary/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const summary = await req.similarityOrchestrator.getSummaryStats(meetingId);
    return ApiResponses.success(res, summary);
  } catch (error) {
    console.error('Meeting summary error:', error);
    return ApiResponses.error(res, 500, 'Failed to get meeting summary');
  }
});

// Compare meetings endpoint
router.post('/compare-meetings', async (req, res) => {
  try {
    const { meetingIds } = req.body;
    if (!Array.isArray(meetingIds) || meetingIds.length < 2) {
      return ApiResponses.error(res, 400, 'Please provide at least 2 meeting IDs');
    }

    const comparison = await req.similarityOrchestrator.compareMeetings(meetingIds);
    return ApiResponses.success(res, comparison);
  } catch (error) {
    console.error('Meeting comparison error:', error);
    return ApiResponses.error(res, 500, 'Failed to compare meetings');
  }
});

export default router;