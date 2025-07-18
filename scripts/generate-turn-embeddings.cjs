#!/usr/bin/env node

/**
 * Generate OpenAI embeddings for turns that have content but no content_embedding
 * Uses OpenAI text-embedding-3-small model (1536 dimensions)
 */

require('dotenv').config();
const { Pool } = require('pg');
const OpenAI = require('openai');

// Initialize connections
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configuration
const BATCH_SIZE = 50; // Process in batches to avoid rate limits
const EMBEDDING_MODEL = 'text-embedding-3-small';
const RATE_LIMIT_DELAY = 100; // ms between requests

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text.substring(0, 8000), // Truncate to avoid token limits
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

async function getTurnsWithoutEmbeddings(limit = BATCH_SIZE) {
  const query = `
    SELECT turn_id, content
    FROM conversation.turns
    WHERE content IS NOT NULL 
    AND content != ''
    AND content_embedding IS NULL
    ORDER BY timestamp DESC
    LIMIT $1
  `;
  
  const result = await pool.query(query, [limit]);
  return result.rows;
}

async function updateTurnEmbedding(turnId, embedding) {
  const query = `
    UPDATE conversation.turns 
    SET content_embedding = $1
    WHERE turn_id = $2
  `;
  
  // Convert embedding array to pgvector format
  const vectorString = `[${embedding.join(',')}]`;
  await pool.query(query, [vectorString, turnId]);
}

async function getEmbeddingStats() {
  const query = `
    SELECT 
      COUNT(*) as total_turns,
      COUNT(content) as turns_with_content,
      COUNT(content_embedding) as turns_with_embedding,
      COUNT(content) - COUNT(content_embedding) as turns_needing_embedding
    FROM conversation.turns
    WHERE content IS NOT NULL AND content != ''
  `;
  
  const result = await pool.query(query);
  return result.rows[0];
}

async function main() {
  console.log('🚀 Starting embedding generation for conversation turns...');
  
  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  try {
    // Get initial stats
    const initialStats = await getEmbeddingStats();
    console.log('📊 Initial Statistics:');
    console.log(`   Total turns with content: ${initialStats.turns_with_content}`);
    console.log(`   Turns with embeddings: ${initialStats.turns_with_embedding}`);
    console.log(`   Turns needing embeddings: ${initialStats.turns_needing_embedding}`);
    
    if (initialStats.turns_needing_embedding === '0') {
      console.log('✅ All turns already have embeddings!');
      return;
    }
    
    let processedCount = 0;
    let errorCount = 0;
    
    while (true) {
      // Get next batch of turns without embeddings
      const turns = await getTurnsWithoutEmbeddings(BATCH_SIZE);
      
      if (turns.length === 0) {
        console.log('✅ No more turns to process');
        break;
      }
      
      console.log(`\n🔄 Processing batch of ${turns.length} turns...`);
      
      for (const turn of turns) {
        try {
          console.log(`   Generating embedding for turn ${turn.turn_id.substring(0, 8)}...`);
          
          // Generate embedding
          const embedding = await generateEmbedding(turn.content);
          
          // Update database
          await updateTurnEmbedding(turn.turn_id, embedding);
          
          processedCount++;
          console.log(`   ✅ Processed turn ${processedCount}`);
          
          // Rate limiting
          await delay(RATE_LIMIT_DELAY);
          
        } catch (error) {
          console.error(`   ❌ Error processing turn ${turn.turn_id}:`, error.message);
          errorCount++;
          
          // If we hit rate limits, wait longer
          if (error.message.includes('rate limit') || error.message.includes('429')) {
            console.log('   ⏳ Rate limit hit, waiting 60 seconds...');
            await delay(60000);
          }
        }
      }
      
      // Status update
      const currentStats = await getEmbeddingStats();
      console.log(`\n📈 Progress: ${currentStats.turns_with_embedding}/${currentStats.turns_with_content} turns have embeddings`);
      console.log(`   Processed: ${processedCount}, Errors: ${errorCount}`);
    }
    
    // Final stats
    const finalStats = await getEmbeddingStats();
    console.log('\n🎉 Embedding generation complete!');
    console.log('📊 Final Statistics:');
    console.log(`   Total turns processed: ${processedCount}`);
    console.log(`   Errors encountered: ${errorCount}`);
    console.log(`   Turns with embeddings: ${finalStats.turns_with_embedding}/${finalStats.turns_with_content}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Received interrupt signal, cleaning up...');
  await pool.end();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}