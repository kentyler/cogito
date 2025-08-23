import express from 'express';

const router = express.Router();

// Meeting summary endpoint
router.get('/meeting-summary/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;
    const summary = await req.similarityOrchestrator.getSummaryStats(meetingId);
    res.json(summary);
  } catch (error) {
    console.error('Meeting summary error:', error);
    res.status(500).json({ error: 'Failed to get meeting summary' });
  }
});

// Compare meetings endpoint
router.post('/compare-meetings', async (req, res) => {
  try {
    const { meetingIds } = req.body;
    if (!Array.isArray(meetingIds) || meetingIds.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 meeting IDs' });
    }

    const comparison = await req.similarityOrchestrator.compareMeetings(meetingIds);
    res.json(comparison);
  } catch (error) {
    console.error('Meeting comparison error:', error);
    res.status(500).json({ error: 'Failed to compare meetings' });
  }
});

export default router;