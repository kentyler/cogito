const fetch = require('node-fetch');

async function checkEnvVars() {
  console.log('🔍 Checking environment variables...\n');
  
  console.log('Local environment:');
  console.log(`  RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'undefined'}`);
  console.log(`  PORT: ${process.env.PORT || 'undefined'}`);
  
  // Create a test endpoint to check server env vars
  const baseUrl = 'https://cogito-meetings.onrender.com';
  
  try {
    console.log('\nTesting a bot creation to see the WebSocket URL being used...');
    
    const botRequest = {
      meeting_url: "https://us06web.zoom.us/j/test123",
      meeting_name: "Env Test Meeting"
    };
    
    const botResponse = await fetch(`${baseUrl}/api/create-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botRequest)
    });
    
    if (botResponse.ok) {
      const botData = await botResponse.json();
      console.log('Bot creation response shows:');
      console.log(`  Realtime endpoints count: ${botData.bot.recording_config?.realtime_endpoints?.length || 0}`);
      
      if (botData.bot.recording_config?.realtime_endpoints?.length > 0) {
        console.log('  WebSocket URL used:', botData.bot.recording_config.realtime_endpoints[0].url);
      } else {
        console.log('  ❌ No WebSocket endpoints configured - RENDER_EXTERNAL_URL likely not set on server');
      }
    } else {
      const error = await botResponse.text();
      console.log('Bot creation failed:', error);
    }
    
  } catch (error) {
    console.error('Error checking environment:', error.message);
  }
}

checkEnvVars().catch(console.error);