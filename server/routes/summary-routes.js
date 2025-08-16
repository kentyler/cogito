import express from 'express';
import { DatabaseAgent } from '../../lib/database-agent.js';

const router = express.Router();

/**
 * Generate monthly summaries for a given year/month
 */
router.post('/generate-monthly-summaries', async (req, res) => {
  const db = new DatabaseAgent();
  
  try {
    const { year, month } = req.body;
    
    if (!year || month === undefined) {
      return res.status(400).json({ error: 'Year and month are required' });
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    await db.connect();
    
    const result = await db.summaries.generateMonthlySummaries(
      year, 
      month, 
      client_id, 
      client_name, 
      req.anthropic
    );
    
    res.json(result);
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate monthly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate monthly summaries' });
  } finally {
    await db.close();
  }
});

/**
 * Generate daily summary for a specific date
 */
router.post('/generate-daily-summary', async (req, res) => {
  const db = new DatabaseAgent();
  
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    await db.connect();
    
    const result = await db.summaries.generateDailySummary(
      date,
      client_id,
      client_name,
      req.anthropic
    );
    
    res.json(result);
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate daily summary error:', error);
    res.status(500).json({ error: 'Failed to generate daily summary' });
  } finally {
    await db.close();
  }
});

/**
 * Generate yearly summaries for a given year
 */
router.post('/generate-yearly-summaries', async (req, res) => {
  console.log('📊 Generate yearly summaries request received:', req.body);
  const db = new DatabaseAgent();
  
  try {
    const { year } = req.body;
    
    if (!year) {
      console.log('❌ No year provided in request');
      return res.status(400).json({ error: 'Year is required' });
    }
    
    console.log('🔍 Getting user context...');
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    console.log('👤 User context:', { user_id, client_id, client_name });
    
    await db.connect();
    console.log('💾 Database connected, generating summaries...');
    
    const result = await db.summaries.generateYearlySummaries(
      year, 
      client_id, 
      client_name, 
      req.anthropic
    );
    
    console.log('✅ Summaries generated successfully:', Object.keys(result.summaries || {}).length, 'months');
    res.json(result);
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Generate yearly summaries error:', error);
    res.status(500).json({ error: 'Failed to generate yearly summaries' });
  } finally {
    await db.close();
  }
});

/**
 * Get daily summary data (turns for a specific date)
 */
router.get('/daily-summary/:date', async (req, res) => {
  const db = new DatabaseAgent();
  
  try {
    const { date } = req.params;
    
    if (!db.summaries.validateDate(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const { user_id, client_id, client_name } = db.summaries.getUserContext(req);
    
    await db.connect();
    
    const startDate = `${date} 00:00:00`;
    const endDate = `${date} 23:59:59`;
    
    const turns = await db.summaries.getTurnsForDateRange(startDate, endDate, client_id);
    
    res.json({
      date,
      turns,
      turnCount: turns.length,
      userTurns: turns.filter(t => t.source_type.includes('user')).length,
      assistantTurns: turns.filter(t => t.source_type.includes('llm')).length
    });
    
  } catch (error) {
    if (error.message === 'Authentication required') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Get daily summary data error:', error);
    res.status(500).json({ error: 'Failed to get daily summary data' });
  } finally {
    await db.close();
  }
});

export default router;