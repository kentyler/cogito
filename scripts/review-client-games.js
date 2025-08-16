import { DatabaseAgent } from '../lib/database-agent.js';

async function reviewClientGames(clientId) {
  const db = new DatabaseAgent();
  
  try {
    console.log(`\n=== GAMES FOR CLIENT ${clientId} ===`);
    const games = await db.designGames.listGames(clientId);
    
    if (games.length === 0) {
      console.log(`No games found for client ${clientId}`);
      return;
    }
    
    for (const game of games) {
      console.log(`\n📋 Game: ${game.name}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   UDE: ${game.ude}`);
      console.log(`   Hands played: ${game.hands_played}`);
      console.log(`   Total sessions: ${game.total_sessions}`);
      console.log(`   Current status: ${game.current_status}`);
      console.log(`   Created: ${game.created_at}`);
      console.log(`   Updated: ${game.updated_at}`);
      
      // Load full game data to see cards and hands
      const fullGame = await db.designGames.loadGame(clientId, game.name);
      const cards = fullGame.game_data.cards || {};
      const hands = fullGame.game_data.hands || [];
      const unplayedCards = fullGame.game_data.unplayedCards || [];
      
      console.log(`\n   🃏 CARDS (${Object.keys(cards).length} total, ${unplayedCards.length} unplayed):`);
      Object.entries(cards).forEach(([key, value]) => {
        const isPlayed = !unplayedCards.includes(key);
        const status = isPlayed ? '✅ PLAYED' : '⏳ UNPLAYED';
        console.log(`      ${status} [${key}]:`);
        if (typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            if (typeof v === 'string' && v.length > 80) {
              console.log(`         ${k}: ${v.substring(0, 80)}...`);
            } else {
              console.log(`         ${k}: ${v}`);
            }
          });
        } else {
          console.log(`         ${value}`);
        }
      });
      
      if (hands.length > 0) {
        console.log(`\n   🤚 HANDS PLAYED (${hands.length} total):`);
        hands.forEach((hand, idx) => {
          console.log(`\n      Hand #${idx + 1} [${hand.timestamp}]:`);
          console.log(`         Session: ${hand.session}`);
          console.log(`         Cards: ${Array.isArray(hand.cards) ? hand.cards.join(', ') : JSON.stringify(hand.cards)}`);
          console.log(`         Outcome: ${hand.outcome}`);
          if (hand.notes) console.log(`         Notes: ${hand.notes}`);
        });
      } else {
        console.log(`\n   🤚 No hands played yet`);
      }
    }
    
    // Get successful combinations
    console.log('\n\n=== SUCCESSFUL COMBINATIONS ===');
    const successfulCombos = await db.designGames.getSuccessfulCombinations(clientId);
    
    if (successfulCombos.length === 0) {
      console.log('No successful combinations found yet');
    } else {
      successfulCombos.forEach((combo, idx) => {
        console.log(`\n✨ Success #${idx + 1} [${combo.game}]:`);
        console.log(`   UDE: ${combo.ude}`);
        console.log(`   Cards: ${Array.isArray(combo.cards) ? combo.cards.join(', ') : JSON.stringify(combo.cards)}`);
        console.log(`   Outcome: ${combo.outcome}`);
        if (combo.notes) console.log(`   Notes: ${combo.notes}`);
        console.log(`   When: ${combo.timestamp}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await db.close();
  }
}

// Check client 1 (has games)
await reviewClientGames(1);

// Also check client 101 in case
await reviewClientGames(101);