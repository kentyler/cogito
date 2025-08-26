import { DatabaseAgent } from '../lib/database-agent.js';

async function reviewProjectCards() {
  const db = new DatabaseAgent();
  
  try {
    await db.connect();
    console.log('Connected to database\n');
    
    // Get all games for all clients
    const gamesQuery = `
      SELECT 
        cg.client_id,
        c.name as client_name,
        cg.name as game_name,
        cg.game_data as cards,
        cg.status,
        cg.created_at,
        cg.updated_at
      FROM games.client_games cg
      LEFT JOIN client_mgmt.clients c ON c.id = cg.client_id
      ORDER BY cg.client_id, cg.name
    `;
    
    const result = await db.connector.query(gamesQuery);
    
    if (result.rows.length === 0) {
      console.log('No games found in the database');
      return;
    }
    
    // Group by client for better display
    const gamesByClient = {};
    for (const row of result.rows) {
      const clientKey = `${row.client_name || 'Unknown'} (ID: ${row.client_id})`;
      if (!gamesByClient[clientKey]) {
        gamesByClient[clientKey] = [];
      }
      gamesByClient[clientKey].push(row);
    }
    
    // Display games by client
    for (const [client, games] of Object.entries(gamesByClient)) {
      console.log(`\n═══════════════════════════════════════`);
      console.log(`CLIENT: ${client}`);
      console.log(`═══════════════════════════════════════`);
      
      for (const game of games) {
        console.log(`\n📋 Game: ${game.game_name}`);
        console.log(`   Status: ${game.status || 'active'}`);
        console.log(`   Created: ${new Date(game.created_at).toLocaleDateString()}`);
        console.log(`   Updated: ${new Date(game.updated_at).toLocaleDateString()}`);
        
        // Extract game data properties
        const gameData = game.cards || {};
        const cards = gameData.cards || {};
        const unplayedCards = gameData.unplayedCards || [];
        const hands = gameData.hands || [];
        
        if (gameData.ude) {
          console.log(`   Purpose: ${gameData.ude}`);
        }
        
        if (gameData.currentStatus) {
          console.log(`   Current Status: ${gameData.currentStatus}`);
        }
        
        if (Object.keys(cards).length > 0) {
          console.log(`\n   Cards (${Object.keys(cards).length}):`);
          console.log(`   ────────────`);
          
          // Group cards by status
          const completedCards = [];
          const activeCards = [];
          const unplayedCardsList = [];
          
          for (const [cardName, card] of Object.entries(cards)) {
            if (card.status === 'completed') {
              completedCards.push({ name: cardName, ...card });
            } else if (unplayedCards.includes(cardName)) {
              unplayedCardsList.push({ name: cardName, ...card });
            } else {
              activeCards.push({ name: cardName, ...card });
            }
          }
          
          // Display completed cards
          if (completedCards.length > 0) {
            console.log(`\n   ✅ Completed (${completedCards.length}):`);
            for (const card of completedCards) {
              console.log(`      • ${card.name}`);
              if (card.pattern) console.log(`        Pattern: ${card.pattern}`);
              if (card.resolution) console.log(`        Resolution: ${card.resolution}`);
            }
          }
          
          // Display active cards
          if (activeCards.length > 0) {
            console.log(`\n   🔄 Active/In Progress (${activeCards.length}):`);
            for (const card of activeCards) {
              console.log(`      • ${card.name}`);
              if (card.pattern) console.log(`        Pattern: ${card.pattern}`);
              if (card.forces) console.log(`        Forces: ${card.forces}`);
            }
          }
          
          // Display unplayed cards
          if (unplayedCardsList.length > 0) {
            console.log(`\n   📝 Not Started (${unplayedCardsList.length}):`);
            for (const card of unplayedCardsList) {
              console.log(`      • ${card.name}`);
              if (card.pattern) console.log(`        Pattern: ${card.pattern}`);
            }
          }
        } else {
          console.log(`   No cards defined in this game yet`);
        }
        
        // Show hands played
        if (hands.length > 0) {
          console.log(`\n   🎮 Hands Played: ${hands.length}`);
          console.log(`   Last Hand: ${gameData.lastHandPlayed ? new Date(gameData.lastHandPlayed).toLocaleDateString() : 'N/A'}`);
        }
      }
    }
    
    // Summary statistics
    console.log(`\n\n═══════════════════════════════════════`);
    console.log(`SUMMARY`);
    console.log(`═══════════════════════════════════════`);
    console.log(`Total clients with games: ${Object.keys(gamesByClient).length}`);
    console.log(`Total games: ${result.rows.length}`);
    
    let totalCards = 0;
    let completedCards = 0;
    let activeCards = 0;
    let unplayedCards = 0;
    
    for (const row of result.rows) {
      const gameData = row.cards || {};
      const cards = gameData.cards || {};
      const unplayedList = gameData.unplayedCards || [];
      
      if (cards) {
        totalCards += Object.keys(cards).length;
        
        for (const [cardName, card] of Object.entries(cards)) {
          if (card.status === 'completed') {
            completedCards++;
          } else if (unplayedList.includes(cardName)) {
            unplayedCards++;
          } else {
            activeCards++;
          }
        }
      }
    }
    
    console.log(`Total cards across all games: ${totalCards}`);
    console.log(`  ✅ Completed: ${completedCards}`);
    console.log(`  🔄 Active/In Progress: ${activeCards}`);
    console.log(`  📝 Not Started: ${unplayedCards}`);
    
  } catch (error) {
    console.error('Error reviewing project cards:', error.message);
    if (error.stack) console.error(error.stack);
  } finally {
    await db.close();
  }
}

reviewProjectCards();