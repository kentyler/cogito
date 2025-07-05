/**
 * Backfill Embeddings Script
 * Generates embeddings for conversation turns that don't have them
 * Includes cost estimation and batch processing
 */

import { ClaudeCodeRecorder } from '../lib/claude-code-recorder.js';
import { DatabaseManager } from '../lib/database.js';
import dotenv from 'dotenv';

dotenv.config();

class EmbeddingBackfillService {
  constructor() {
    this.recorder = new ClaudeCodeRecorder();
    this.db = new DatabaseManager();
    
    // OpenAI pricing for text-embedding-3-small: $0.00002 per 1K tokens
    this.COST_PER_1K_TOKENS = 0.00002;
    this.ESTIMATED_TOKENS_PER_CHAR = 0.25; // Conservative estimate
  }

  /**
   * Count conversation turns without embeddings
   */
  async analyzeEmbeddingGaps() {
    console.log('🔍 Analyzing conversation turns without embeddings...');
    
    const query = `
      SELECT 
        COUNT(*) as total_turns,
        COUNT(CASE WHEN metadata->>'content_vector' IS NOT NULL THEN 1 END) as turns_with_embeddings,
        COUNT(CASE WHEN metadata->>'content_vector' IS NULL THEN 1 END) as turns_without_embeddings,
        SUM(LENGTH(content)) as total_characters,
        SUM(CASE WHEN metadata->>'content_vector' IS NULL THEN LENGTH(content) ELSE 0 END) as chars_needing_embedding
      FROM turns
    `;
    
    const result = await this.db.pool.query(query);
    const stats = result.rows[0];
    
    console.log('\n📊 Embedding Analysis:');
    console.log(`Total conversation turns: ${stats.total_turns}`);
    console.log(`Turns with embeddings: ${stats.turns_with_embeddings}`);
    console.log(`Turns without embeddings: ${stats.turns_without_embeddings}`);
    console.log(`Total characters in database: ${stats.total_characters?.toLocaleString() || 0}`);
    console.log(`Characters needing embedding: ${stats.chars_needing_embedding?.toLocaleString() || 0}`);
    
    return stats;
  }

  /**
   * Estimate embedding generation costs
   */
  async estimateCosts(stats) {
    console.log('\n💰 Cost Estimation:');
    
    const charsNeedingEmbedding = parseInt(stats.chars_needing_embedding) || 0;
    const estimatedTokens = charsNeedingEmbedding * this.ESTIMATED_TOKENS_PER_CHAR;
    const estimatedCostUSD = (estimatedTokens / 1000) * this.COST_PER_1K_TOKENS;
    
    console.log(`Estimated tokens to process: ${Math.ceil(estimatedTokens).toLocaleString()}`);
    console.log(`Estimated cost: $${estimatedCostUSD.toFixed(4)} USD`);
    
    if (estimatedCostUSD > 1.0) {
      console.log('⚠️  Cost exceeds $1.00 - consider running in batches');
    } else if (estimatedCostUSD > 0.10) {
      console.log('⚠️  Cost exceeds $0.10 - monitor usage');
    } else {
      console.log('✅ Cost is minimal');
    }
    
    return {
      estimatedTokens: Math.ceil(estimatedTokens),
      estimatedCostUSD
    };
  }

  /**
   * Get conversation turns without embeddings in batches
   */
  async getTurnsWithoutEmbeddings(limit = 50, offset = 0) {
    const query = `
      SELECT turn_id as id, content as content_text, 
             metadata->>'session_id' as session_id,
             1 as turn_index -- sequence will be in block_turns
      FROM turns 
      WHERE metadata->>'content_vector' IS NULL 
      AND content IS NOT NULL 
      AND LENGTH(TRIM(content)) > 0
      ORDER BY timestamp ASC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await this.db.pool.query(query, [limit, offset]);
    return result.rows;
  }

  /**
   * Update conversation turn with generated embedding
   */
  async updateTurnWithEmbedding(turnId, embedding) {
    const query = `
      UPDATE turns 
      SET metadata = jsonb_set(metadata, '{content_vector}', $2::jsonb)
      WHERE turn_id = $1
    `;
    
    // Note: Updated to use turns table and metadata field for embeddings
    // Old query was: UPDATE conversation_turns 
      SET content_vector = $1, 
          updated_at = NOW()
      WHERE id = $2
    `;
    
    await this.db.pool.query(query, [JSON.stringify(embedding), turnId]);
  }

  /**
   * Process embeddings in batches with rate limiting
   */
  async backfillEmbeddings(batchSize = 10, delayMs = 1000, dryRun = true) {
    console.log(`\n🚀 Starting embedding backfill (${dryRun ? 'DRY RUN' : 'LIVE MODE'})...`);
    console.log(`Batch size: ${batchSize}, Delay between batches: ${delayMs}ms`);
    
    let offset = 0;
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    
    while (true) {
      const turns = await this.getTurnsWithoutEmbeddings(batchSize, offset);
      
      if (turns.length === 0) {
        console.log('✅ No more turns to process');
        break;
      }
      
      console.log(`\n📦 Processing batch: ${offset + 1}-${offset + turns.length}`);
      
      for (const turn of turns) {
        try {
          console.log(`Processing turn ${turn.id} (${turn.content_text.length} chars)...`);
          
          if (!dryRun) {
            const embedding = await this.recorder.generateEmbedding(turn.content_text);
            
            if (embedding) {
              await this.updateTurnWithEmbedding(turn.id, embedding);
              console.log(`✅ Turn ${turn.id} updated with embedding`);
              totalSuccess++;
            } else {
              console.log(`❌ Failed to generate embedding for turn ${turn.id}`);
              totalFailed++;
            }
          } else {
            console.log(`🔍 Would process turn ${turn.id}: "${turn.content_text.substring(0, 100)}..."`);
            totalSuccess++;
          }
          
          totalProcessed++;
          
        } catch (error) {
          console.error(`❌ Error processing turn ${turn.id}:`, error.message);
          totalFailed++;
        }
      }
      
      offset += turns.length;
      
      if (turns.length === batchSize && delayMs > 0) {
        console.log(`⏳ Waiting ${delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`\n📈 Backfill Summary:`);
    console.log(`Total processed: ${totalProcessed}`);
    console.log(`Successful: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    
    return { totalProcessed, totalSuccess, totalFailed };
  }
}

async function main() {
  const service = new EmbeddingBackfillService();
  
  try {
    // Analyze current state
    const stats = await service.analyzeEmbeddingGaps();
    
    // Estimate costs
    const costEstimate = await service.estimateCosts(stats);
    
    // Check if there's anything to process
    if (parseInt(stats.turns_without_embeddings) === 0) {
      console.log('\n✅ All conversation turns already have embeddings!');
      process.exit(0);
    }
    
    // Ask for confirmation if cost is significant
    if (costEstimate.estimatedCostUSD > 0.10) {
      console.log('\n⚠️  Significant cost detected. Please review the estimate above.');
      console.log('To proceed with live processing, run:');
      console.log('node scripts/backfill-embeddings.js --live');
      console.log('\nTo run a dry run with different batch size:');
      console.log('node scripts/backfill-embeddings.js --dry-run --batch-size=20');
    }
    
    // Process arguments
    const args = process.argv.slice(2);
    const isLive = args.includes('--live');
    const isDryRun = args.includes('--dry-run') || !isLive;
    const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
    const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;
    
    // Run backfill
    await service.backfillEmbeddings(batchSize, 1000, isDryRun);
    
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { EmbeddingBackfillService };