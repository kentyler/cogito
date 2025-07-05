const fetch = require('node-fetch');

async function debugServerConfig() {
  console.log('🔍 Debugging server configuration issue...\n');
  
  const baseUrl = 'https://cogito-meetings.onrender.com';
  
  try {
    // First, let's see if the debug endpoint is working
    console.log('1. Testing debug endpoint...');
    try {
      const debugResponse = await fetch(`${baseUrl}/debug/env`);
      if (debugResponse.ok) {
        const envData = await debugResponse.json();
        console.log('   Environment variables on server:', envData);
      } else {
        console.log(`   Debug endpoint failed: ${debugResponse.status}`);
      }
    } catch (error) {
      console.log(`   Debug endpoint error: ${error.message}`);
    }
    
    // Test bot creation and capture the full request/response
    console.log('\n2. Testing bot creation with detailed logging...');
    
    const botRequest = {
      meeting_url: "https://us06web.zoom.us/j/test123debug",
      meeting_name: "Debug Config Test"
    };
    
    console.log('   Request payload:', JSON.stringify(botRequest, null, 2));
    
    const botResponse = await fetch(`${baseUrl}/api/create-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botRequest)
    });
    
    console.log(`   Response status: ${botResponse.status}`);
    
    if (botResponse.ok) {
      const botData = await botResponse.json();
      console.log('\n   Bot creation response:');
      console.log('   - Bot ID:', botData.bot.id);
      console.log('   - Recording config:', JSON.stringify(botData.bot.recording_config, null, 4));
      
      if (botData.bot.recording_config.realtime_endpoints && botData.bot.recording_config.realtime_endpoints.length > 0) {
        console.log('   ✅ Realtime endpoints configured!');
        botData.bot.recording_config.realtime_endpoints.forEach((endpoint, i) => {
          console.log(`     Endpoint ${i + 1}:`, endpoint);
        });
      } else {
        console.log('   ❌ No realtime endpoints - WebSocket config failed');
        console.log('   This means either:');
        console.log('     - RENDER_EXTERNAL_URL is not being read');
        console.log('     - WebSocket URL construction is failing');
        console.log('     - API request to Recall.ai is malformed');
      }
    } else {
      const errorText = await botResponse.text();
      console.log('   Bot creation failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugServerConfig().catch(console.error);