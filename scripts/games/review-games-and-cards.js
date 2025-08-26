import { DatabaseAgent } from '../lib/database-agent.js';

async function listGamesAndCards() {
  const db = new DatabaseAgent();
  
  try {
    // List all games for client 101
    console.log('=== GAMES FOR CLIENT 101 ===');
    const games = await db.designGames.listGames(101);
    
    for (const game of games) {
      console.log(`\n📋 Game: ${game.name}`);
      console.log(`   Status: ${game.status}`);
      console.log(`   UDE: ${game.ude}`);
      console.log(`   Hands played: ${game.hands_played}`);
      console.log(`   Created: ${game.created_at}`);
      
      // Load full game data to see cards
      const fullGame = await db.designGames.loadGame(101, game.name);
      const cards = fullGame.game_data.cards || {};
      const hands = fullGame.game_data.hands || [];
      const unplayedCards = fullGame.game_data.unplayedCards || [];
      
      console.log(`\n   🃏 CARDS (${Object.keys(cards).length} total):`);
      Object.entries(cards).forEach(([key, value]) => {
        const isPlayed = !unplayedCards.includes(key);
        const status = isPlayed ? '✅ PLAYED' : '⏳ UNPLAYED';
        console.log(`      ${status} [${key}]:`);
        if (typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            console.log(`         ${k}: ${v}`);
          });
        } else {
          console.log(`         ${value}`);
        }
      });
      
      if (hands.length > 0) {
        console.log(`\n   🤚 HANDS PLAYED (${hands.length} total):`);
        hands.forEach((hand, idx) => {
          console.log(`      Hand #${idx + 1} [${hand.timestamp}]:`);
          console.log(`         Cards: ${Array.isArray(hand.cards) ? hand.cards.join(', ') : JSON.stringify(hand.cards)}`);
          console.log(`         Outcome: ${hand.outcome}`);
          if (hand.notes) console.log(`         Notes: ${hand.notes}`);
        });
      }
    }
    
    // Get successful combinations
    console.log('\n\n=== SUCCESSFUL COMBINATIONS ACROSS ALL GAMES ===');
    const successfulCombos = await db.designGames.getSuccessfulCombinations(101);
    
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
  } finally {
    await db.close();
  }
}

listGamesAndCards();