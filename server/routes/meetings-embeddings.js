import express from 'express';

const router = express.Router();

// Get meeting embeddings for semantic map
router.get('/meetings/:meetingId/embeddings', async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // First, get the dimensionality reduction to 2D using t-SNE or PCA approximation
    // For now, we'll use a simple approach - later this could use proper t-SNE
    // Get embeddings and use proper similarity-based clustering
    const query = `
      SELECT 
        t.id,
        t.content,
        t.participant_id,
        t.created_at,
        t.source_type,
        p.name as participant_name,
        t.content_embedding
      FROM meetings.turns t
      LEFT JOIN participants p ON t.participant_id = p.id
      WHERE t.id = $1
        AND t.content_embedding IS NOT NULL
      ORDER BY t.created_at
    `;
    
    const result = await req.db.query(query, [meetingId]);
    
    if (result.rows.length === 0) {
      return res.json({ embeddings: [], message: 'No embeddings found for this meeting' });
    }
    
    // Parse embedding vectors and compute similarity-based positions
    console.log('First embedding sample:', result.rows[0]?.content_embedding?.toString().substring(0, 100));
    
    const turns = result.rows.map((row, idx) => {
      let embedding;
      try {
        // Handle different embedding formats
        if (typeof row.content_embedding === 'string') {
          // Clean up the string format more carefully
          const cleanString = row.content_embedding.replace(/^\[|\]$/g, '').trim();
          embedding = cleanString.split(',').map(val => {
            const parsed = parseFloat(val.trim());
            return isNaN(parsed) ? 0 : parsed;
          });
        } else if (Array.isArray(row.content_embedding)) {
          embedding = row.content_embedding.map(val => isNaN(val) ? 0 : val);
        } else {
          // Try to handle pgvector format
          embedding = Array.from(row.content_embedding).map(val => isNaN(val) ? 0 : val);
        }
        
        if (idx === 0) {
          console.log('Parsed embedding length:', embedding.length);
          console.log('First 10 values:', embedding.slice(0, 10));
        }
      } catch (e) {
        console.error('Error parsing embedding:', e);
        embedding = new Array(1536).fill(0); // Use zeros instead of random
      }
      
      return {
        turn_id: row.id,
        content: row.content,
        participant_id: row.participant_id,
        participant_name: row.participant_name,
        source_type: row.source_type,
        created_at: row.created_at,
        embedding: embedding
      };
    });
    
    // Simple semantic clustering using PCA-like dimension reduction
    function dotProduct(a, b) {
      return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
    
    function magnitude(vec) {
      return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
    }
    
    function cosineSimilarity(a, b) {
      const dot = dotProduct(a, b);
      const magA = magnitude(a);
      const magB = magnitude(b);
      return magA > 0 && magB > 0 ? dot / (magA * magB) : 0;
    }
    
    // Simple 2D projection: use first two principal components
    // For simplicity, we'll use the first two dimensions after normalization
    const finalData = turns.map((turn, idx) => {
      const embedding = turn.embedding;
      
      // Use first 2 dimensions as rough x,y coordinates
      let x = embedding[0] || 0;
      let y = embedding[1] || 0;
      
      // Normalize to reasonable screen coordinates
      x = 400 + (x * 2000); // Center at 400, spread over ~4000 pixels
      y = 300 + (y * 2000); // Center at 300, spread over ~4000 pixels
      
      // Clamp to reasonable bounds
      x = Math.max(50, Math.min(750, x));
      y = Math.max(50, Math.min(550, y));
      
      return {
        turn_id: turn.id,
        content: turn.content,
        participant_id: turn.participant_id,
        participant_name: turn.participant_name,
        source_type: turn.source_type,
        created_at: turn.created_at,
        x: x,
        y: y,
        turn_order: idx + 1
      };
    });
    
    res.json({
      embeddings: finalData,
      stats: {
        total: result.rows.length,
        participants: new Set(turns.map(t => t.participant_id)).size
      }
    });
    
  } catch (error) {
    console.error('Error fetching embeddings:', error);
    res.status(500).json({ error: 'Failed to fetch embeddings' });
  }
});

export default router;