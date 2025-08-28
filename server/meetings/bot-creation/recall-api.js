/**
 * Recall.ai API interaction functions
 */

export async function createRecallBot(meetingUrl, websocketUrl, webhookUrl) {
  if (!process.env.RECALL_API_KEY) {
    throw new Error('RECALL_API_KEY not configured');
  }

  console.log('Using Recall.ai API key:', process.env.RECALL_API_KEY.substring(0, 8) + '...');

  const response = await fetch('https://us-west-2.recall.ai/api/v1/bot/', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${process.env.RECALL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meeting_url: meetingUrl,
      bot_name: 'Cogito',
      recording_config: {
        transcript: {
          provider: {
            meeting_captions: {}
          }
        },
        realtime_endpoints: [
          {
            type: 'websocket',
            url: websocketUrl,
            events: [
              'transcript.data', 
              'transcript.partial_data'
            ]
          },
          {
            type: 'webhook',
            url: webhookUrl,
            events: ['participant_events.chat_message']
          }
        ]
      },
      chat: {
        on_bot_join: {
          send_to: 'everyone',
          message: '🤖 Cogito has joined the meeting! Type ? for my thoughts on the conversation, or @cc for specific questions.'
        }
      },
      webhook_url: webhookUrl
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Recall.ai error:', error);
    throw new Error(`Recall.ai API error: ${response.status} - ${error}`);
  }
  
  const botData = await response.json();
  console.log('Bot created:', botData);
  return botData;
}

export function getWebsocketUrls() {
  let websocketUrl, webhookUrl;
  
  if (process.env.RENDER_EXTERNAL_URL) {
    const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '');
    websocketUrl = `wss://${cleanUrl}/transcript`;
    webhookUrl = `https://${cleanUrl}/webhook/chat`;
  } else {
    websocketUrl = `ws://localhost:${process.env.PORT || 3000}/transcript`;
    webhookUrl = `http://localhost:${process.env.PORT || 3000}/webhook/chat`;
  }
  
  console.log('WebSocket URL for real-time transcription:', websocketUrl);
  console.log('Webhook URL for chat messages:', webhookUrl);
  
  return { websocketUrl, webhookUrl };
}