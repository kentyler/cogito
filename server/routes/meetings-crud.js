import express from 'express';
import { requireAuth } from './auth.js';

const router = express.Router();

// Get meeting list with detailed information
router.get('/meetings', requireAuth, async (req, res) => {
  try {
    const query = `
      SELECT 
        m.id as block_id,  -- Keep legacy field name for frontend compatibility
        m.name as block_name,       -- Keep legacy field name for frontend compatibility
        m.created_at,
        m.metadata,
        m.meeting_url,
        m.started_at as meeting_start_time,
        m.ended_at as meeting_end_time,
        m.status,
        COUNT(t.id)::integer as turn_count,
        COUNT(CASE WHEN t.content_embedding IS NOT NULL THEN 1 END)::integer as embedded_count,
        COUNT(DISTINCT t.user_id) FILTER (WHERE t.user_id IS NOT NULL)::integer as participant_count,
        array_agg(DISTINCT u.email) FILTER (WHERE u.email IS NOT NULL) as participant_names,
        MIN(t.created_at) as first_turn_time,
        MAX(t.created_at) as last_turn_time
      FROM meetings.meetings m
      LEFT JOIN meetings.turns t ON m.id = t.id
      LEFT JOIN client_mgmt.users u ON t.user_id = u.id
      WHERE m.meeting_type != 'system'  -- Exclude migration tracking records
        AND m.client_id = $1  -- Filter by current user's client
      GROUP BY m.id, m.name, m.created_at, m.metadata, m.meeting_url, m.started_at, m.ended_at, m.status
      ORDER BY m.created_at DESC
    `;
    
    // Get client_id from session
    const clientId = req.session?.user?.client_id;
    if (!clientId) {
      return res.status(401).json({ error: 'Not authenticated or missing client context' });
    }
    
    const result = await req.db.query(query, [clientId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Delete a meeting and all associated data
router.delete('/meetings/:meetingId', requireAuth, async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Start a transaction to ensure all deletions succeed or fail together
    const client = await req.db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get all turn IDs associated with this meeting for deletion
      const turnsResult = await client.query(`
        SELECT id 
        FROM meetings.turns
        WHERE id = $1
      `, [meetingId]);
      
      const turnIds = turnsResult.rows.map(row => row.id);
      
      // Delete in the correct order to avoid foreign key constraint violations
      
      // 1. Delete turns (now they belong directly to the meeting)
      if (turnIds.length > 0) {
        const turnIdsList = turnIds.map((_, i) => `$${i + 1}`).join(',');
        await client.query(`DELETE FROM meetings.turns WHERE turn_id IN (${turnIdsList})`, turnIds);
        console.log(`🗑️  Deleted ${turnIds.length} turns from meeting ${meetingId}`);
      }
      
      // 2. Delete the meeting record
      const deleteMeetingResult = await client.query(`
        DELETE FROM meetings.meetings 
        WHERE id = $1
      `, [meetingId]);
      
      if (deleteMeetingResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Meeting not found' });
      }
      
      await client.query('COMMIT');
      
      res.json({ 
        success: true, 
        message: `Meeting ${meetingId} and ${turnIds.length} associated turns deleted successfully`,
        deleted: {
          meeting_id: meetingId,
          turns_deleted: turnIds.length
        }
      });
      
    } catch (deleteError) {
      await client.query('ROLLBACK');
      throw deleteError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

export default router;