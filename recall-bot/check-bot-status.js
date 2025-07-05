const fetch = require('node-fetch');
require('dotenv').config();

async function checkBotStatus() {
  console.log('🔍 Checking bot status with Recall.ai...\n');
  
  try {
    const response = await fetch(`https://us-west-2.recall.ai/api/v1/bot/b41820a3-9996-4f5d-b222-4a225c7cda7b/`, {
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`
      }
    });
    
    if (response.ok) {
      const botData = await response.json();
      console.log('📊 Bot Status from Recall.ai:');
      console.log(`  Status: ${botData.status}`);
      console.log(`  Join At: ${botData.join_at}`);
      console.log(`  Meeting URL: ${botData.meeting_url.meeting_id}`);
      
      if (botData.status_changes && botData.status_changes.length > 0) {
        console.log('\n📈 Status Changes:');
        botData.status_changes.forEach(change => {
          console.log(`  ${change.created_at}: ${change.code} - ${change.message || 'No message'}`);
        });
      }
      
      if (botData.recording_config) {
        console.log('\n🎙️  Recording Config:');
        console.log(`  Transcript Provider: ${JSON.stringify(botData.recording_config.transcript)}`);
        console.log(`  Realtime Endpoints: ${botData.recording_config.realtime_endpoints?.length || 0}`);
      }
      
    } else {
      console.error('❌ Failed to get bot status:', response.status, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error checking bot status:', error.message);
  }
}

checkBotStatus().catch(console.error);