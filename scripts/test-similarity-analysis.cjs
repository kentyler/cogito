#!/usr/bin/env node

/**
 * Test script to try out the similarity analysis system
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testSimilarityAnalysis() {
  try {
    // Import the similarity orchestrator
    const { SimilarityOrchestrator } = await import('../lib/similarity-orchestrator.js');
    
    const orchestrator = new SimilarityOrchestrator(pool);
    
    console.log('🔍 Testing Similarity Analysis System...\n');
    
    // Get available blocks
    console.log('📊 Getting available blocks...');
    const blocks = await orchestrator.getAvailableBlocks();
    console.log(`Found ${blocks.length} blocks with sufficient data:\n`);
    
    blocks.slice(0, 3).forEach((block, i) => {
      console.log(`${i + 1}. Block ${block.block_id.substring(0, 8)}...`);
      console.log(`   Total turns: ${block.total_turns}`);
      console.log(`   With embeddings: ${block.turns_with_embeddings}`);
      console.log(`   Latest turn: ${new Date(block.latest_turn).toLocaleString()}`);
      console.log('');
    });
    
    if (blocks.length === 0) {
      console.log('❌ No blocks with sufficient embedding data found');
      return;
    }
    
    // Analyze the first block
    const testBlock = blocks[0];
    console.log(`🔬 Analyzing block ${testBlock.block_id.substring(0, 8)}...`);
    
    const analysis = await orchestrator.analyzeBlock(testBlock.block_id);
    
    console.log('\n=== ANALYSIS RESULTS ===');
    console.log(`Turns analyzed: ${analysis.analysis.total_turns}`);
    console.log(`Coherence: ${analysis.analysis.insights.coherence.level} (${analysis.analysis.insights.coherence.score.toFixed(2)})`);
    console.log(`Flow stability: ${analysis.analysis.flow_analysis.overall_flow.flow_stability}`);
    console.log(`Major topic shifts: ${analysis.analysis.flow_analysis.overall_flow.major_shifts}`);
    console.log(`Conversation phases: ${analysis.analysis.flow_analysis.phases.length}`);
    
    console.log('\n=== KEY INSIGHTS ===');
    const insights = analysis.analysis.insights;
    
    if (insights.central_turns.length > 0) {
      console.log('🎯 Central turns (most representative):');
      insights.central_turns.forEach((turn, i) => {
        console.log(`   ${i + 1}. "${turn.content_preview}" (similarity: ${turn.avg_similarity.toFixed(2)})`);
      });
    }
    
    if (insights.outlier_turns.length > 0) {
      console.log('\n🔍 Outlier turns (unique topics):');
      insights.outlier_turns.forEach((turn, i) => {
        console.log(`   ${i + 1}. "${turn.content_preview}" (similarity: ${turn.avg_similarity.toFixed(2)})`);
      });
    }
    
    if (insights.bridge_turns.length > 0) {
      console.log('\n🌉 Bridge turns (connecting themes):');
      insights.bridge_turns.forEach((turn, i) => {
        console.log(`   ${i + 1}. "${turn.content_preview}"`);
      });
    }
    
    if (insights.callback_turns.length > 0) {
      console.log('\n🔄 Callback turns (returning to earlier themes):');
      insights.callback_turns.forEach((turn, i) => {
        console.log(`   ${i + 1}. "${turn.content_preview}"`);
      });
    }
    
    if (insights.topic_shifts.length > 0) {
      console.log('\n🔀 Topic shifts:');
      insights.topic_shifts.slice(0, 3).forEach((shift, i) => {
        console.log(`   ${i + 1}. "${shift.content_preview}" (similarity drop: ${shift.similarity_to_previous.toFixed(2)})`);
      });
    }
    
    console.log('\n=== CONVERSATION FLOW ===');
    const flow = analysis.analysis.flow_analysis.overall_flow;
    console.log(`Average flow similarity: ${flow.avg_similarity.toFixed(2)}`);
    console.log(`Continuous segments: ${flow.continuous_percentage.toFixed(1)}%`);
    console.log(`Interpretation: ${analysis.analysis.insights.coherence.interpretation}`);
    
    if (analysis.analysis.flow_analysis.phases.length > 1) {
      console.log(`\n📍 Conversation phases (${analysis.analysis.flow_analysis.phases.length} detected):`);
      analysis.analysis.flow_analysis.phases.forEach((phase, i) => {
        console.log(`   Phase ${i + 1}: ${phase.turns.length} turns, ${phase.duration_minutes.toFixed(1)} minutes`);
      });
    }
    
    // Test turn-specific analysis if we have turns
    if (analysis.analysis.turn_analyses.length > 0) {
      console.log('\n=== SAMPLE TURN ANALYSIS ===');
      const sampleTurn = analysis.analysis.turn_analyses[0];
      console.log(`Turn: "${sampleTurn.content_preview}"`);
      console.log(`Average similarity: ${sampleTurn.avg_similarity.toFixed(2)}`);
      console.log(`Highly similar turns: ${sampleTurn.highly_similar_count}`);
      console.log(`Characteristics: ${[
        sampleTurn.is_central ? 'central' : null,
        sampleTurn.is_outlier ? 'outlier' : null,
        sampleTurn.is_bridge ? 'bridge' : null,
        sampleTurn.position_analysis.is_callback ? 'callback' : null,
        sampleTurn.position_analysis.is_topic_shift ? 'topic-shift' : null
      ].filter(Boolean).join(', ') || 'none'}`);
      
      if (sampleTurn.most_similar.length > 0) {
        console.log('Most similar turns:');
        sampleTurn.most_similar.slice(0, 2).forEach((similar, i) => {
          console.log(`   ${i + 1}. "${similar.content_preview}" (${similar.similarity.toFixed(2)})`);
        });
      }
    }
    
    console.log('\n✅ Analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testSimilarityAnalysis().catch(console.error);
}