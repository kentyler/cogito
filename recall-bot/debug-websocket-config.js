const fetch = require('node-fetch');
require('dotenv').config();

async function debugWebSocketConfig() {
  console.log('🔧 DEBUGGING WEBSOCKET CONFIGURATION\n');
  
  // First, let's see what the current bot creation request looks like
  console.log('📋 Current bot creation configuration:');
  
  const websocketUrl = process.env.RENDER_EXTERNAL_URL 
    ? `wss://${process.env.RENDER_EXTERNAL_URL}/transcript`
    : `ws://localhost:${process.env.PORT || 8080}/transcript`;
  
  console.log(`  WebSocket URL: ${websocketUrl}`);
  console.log(`  RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL}`);
  
  // Test if our WebSocket endpoint is reachable
  console.log('\n🌐 Testing WebSocket endpoint reachability...');
  
  const baseUrl = process.env.RENDER_EXTERNAL_URL 
    ? `https://${process.env.RENDER_EXTERNAL_URL}`
    : `http://localhost:${process.env.PORT || 8080}`;
  
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log(`  Health check: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`  Server response: ${JSON.stringify(health)}`);
    }
  } catch (error) {
    console.log(`  ❌ Health check failed: ${error.message}`);
  }
  
  // Check Recall.ai's documentation for proper real-time config
  console.log('\n📖 Checking proper Recall.ai real-time configuration...');
  
  // The correct configuration according to Recall.ai docs
  const correctConfig = {
    meeting_url: "MEETING_URL",
    bot_name: 'Cogito',
    recording_config: {
      transcript: {
        provider: {
          meeting_captions: {}
        }
      }
    },
    real_time_transcription: {
      destination_url: websocketUrl,
      partial_results: true
    },
    webhook_url: `${baseUrl}/webhook`
  };
  
  console.log('  📝 Correct configuration should be:');
  console.log(JSON.stringify(correctConfig, null, 2));
  
  // Let's test creating a bot with the corrected configuration
  console.log('\n🧪 Testing corrected bot creation...');
  
  const testBotConfig = {
    meeting_url: "https://us06web.zoom.us/j/81676529980?pwd=6lgl8QhXvcMQRlBToNff2HcRZ2XDct.1",
    bot_name: 'Cogito-Debug',
    recording_config: {
      transcript: {
        provider: {
          meeting_captions: {}
        }
      },
      realtime_endpoints: [
        {
          type: "websocket",
          url: websocketUrl,
          events: [
            "transcript.data", 
            "transcript.partial_data"
          ]
        }
      ]
    },
    webhook_url: `${baseUrl}/webhook`
  };
  
  console.log('  📤 Sending test request to Recall.ai...');
  
  try {
    const response = await fetch('https://us-west-2.recall.ai/api/v1/bot/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBotConfig)
    });
    
    console.log(`  Response status: ${response.status}`);
    
    if (response.ok) {
      const botData = await response.json();
      console.log('  ✅ Test bot created successfully!');
      console.log(`  Bot ID: ${botData.id}`);
      console.log(`  Realtime endpoints: ${botData.recording_config?.realtime_endpoints?.length || 0}`);
      
      if (botData.recording_config?.realtime_endpoints?.length > 0) {
        console.log('  🎉 REAL-TIME TRANSCRIPTION CONFIGURED!');
        botData.recording_config.realtime_endpoints.forEach((endpoint, i) => {
          console.log(`    Endpoint ${i + 1}: ${endpoint}`);
        });
      } else {
        console.log('  ⚠️  Still no real-time endpoints configured');
      }
    } else {
      const error = await response.text();
      console.log('  ❌ Test bot creation failed:');
      console.log(`  ${error}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Request failed: ${error.message}`);
  }
}

debugWebSocketConfig().catch(console.error);