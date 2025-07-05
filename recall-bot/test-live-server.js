const fetch = require('node-fetch');

async function testLiveServer() {
  console.log('🔍 Testing live server configuration...\n');
  
  const baseUrl = 'https://cogito-meetings.onrender.com';
  
  try {
    // Test health endpoint
    console.log('📡 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`  Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`  Response: ${JSON.stringify(health)}`);
    }
    
    // Test bot creation with real-time transcription
    console.log('\n🤖 Testing bot creation with real-time transcription...');
    
    const botRequest = {
      meeting_url: "https://us06web.zoom.us/j/81676529980?pwd=6lgl8QhXvcMQRlBToNff2HcRZ2XDct.1",
      meeting_name: "Live Server Test Meeting"
    };
    
    const botResponse = await fetch(`${baseUrl}/api/create-bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(botRequest)
    });
    
    console.log(`  Bot creation status: ${botResponse.status}`);
    
    if (botResponse.ok) {
      const botData = await botResponse.json();
      console.log('  ✅ Bot created successfully!');
      console.log(`  Bot ID: ${botData.bot.id}`);
      console.log(`  Realtime endpoints: ${botData.bot.recording_config?.realtime_endpoints?.length || 0}`);
      
      if (botData.bot.recording_config?.realtime_endpoints?.length > 0) {
        console.log('  🎉 REAL-TIME TRANSCRIPTION CONFIGURED ON LIVE SERVER!');
        botData.bot.recording_config.realtime_endpoints.forEach((endpoint, i) => {
          console.log(`    Endpoint ${i + 1}: ${endpoint.url}`);
          console.log(`    Type: ${endpoint.type}`);
          console.log(`    Events: ${endpoint.events.join(', ')}`);
        });
      } else {
        console.log('  ⚠️  No real-time endpoints configured');
      }
    } else {
      const error = await botResponse.text();
      console.log('  ❌ Bot creation failed:');
      console.log(`  ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing live server:', error.message);
  }
}

testLiveServer().catch(console.error);