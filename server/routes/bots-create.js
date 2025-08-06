import express from 'express';
import fs from 'fs';
import { requireAuth } from './auth.js';

const router = express.Router();

// Create bot endpoint - handles bot creation with Recall.ai
router.post('/create-bot', requireAuth, async (req, res) => {
  try {
    const { meeting_url, meeting_name } = req.body;
    const user_id = req.session.user.user_id || req.session.user.id;
    let client_id = req.session.user.client_id;
    
    if (!meeting_url) {
      return res.status(400).json({ error: 'Meeting URL is required' });
    }
    
    // If client_id is missing from session, use default client (temporary fix)
    if (!client_id) {
      console.log(`Client ID missing from session for user ${user_id}, using default client_id = 1`);
      client_id = 1; // Default to client 1 for now
      
      // TODO: Add client_id column to client_mgmt.users table and proper lookup
    }
    
    console.log(`Creating bot for user ${user_id}, client ${client_id}, meeting: ${meeting_url}`);
    
    // Get the external URL for WebSocket connection
    let websocketUrl;
    let webhookUrl;
    if (process.env.RENDER_EXTERNAL_URL) {
      // Remove protocol if present
      const cleanUrl = process.env.RENDER_EXTERNAL_URL.replace(/^https?:\/\//, '');
      websocketUrl = `wss://${cleanUrl}/transcript`;
      webhookUrl = `https://${cleanUrl}/webhook/chat`;
    } else {
      websocketUrl = `ws://localhost:${process.env.PORT || 3000}/transcript`;
      webhookUrl = `http://localhost:${process.env.PORT || 3000}/webhook/chat`;
    }
    
    console.log('WebSocket URL for real-time transcription:', websocketUrl);
    console.log('Webhook URL for chat messages:', webhookUrl);
    
    // Check if API key is available
    if (!process.env.RECALL_API_KEY) {
      console.error('RECALL_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Recall.ai API key not configured' });
    }

    console.log('Using Recall.ai API key:', process.env.RECALL_API_KEY.substring(0, 8) + '...');

    // Create bot with Recall.ai
    const recallResponse = await fetch('https://us-west-2.recall.ai/api/v1/bot/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.RECALL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meeting_url: meeting_url,
        bot_name: 'Cogito',
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
            },
            {
              type: "webhook",
              url: webhookUrl,
              events: ["participant_events.chat_message"]
            }
          ]
        },
        chat: {
          on_bot_join: {
            send_to: "everyone",
            message: "🤖 Cogito has joined the meeting! Type ? for my thoughts on the conversation, or @cc for specific questions."
          }
        },
        webhook_url: webhookUrl
      })
    });
    
    if (!recallResponse.ok) {
      const error = await recallResponse.text();
      console.error('Recall.ai error:', error);
      return res.status(recallResponse.status).json({ 
        error: 'Failed to create bot', 
        details: error 
      });
    }
    
    const botData = await recallResponse.json();
    console.log('Bot created:', botData);
    
    console.log('Creating meeting record for bot:', botData.id);
    
    // Create a meeting with proper user and client IDs
    const meetingResult = await req.db.query(
      `INSERT INTO meetings.meetings (name, description, meeting_type, created_by_user_id, client_id, metadata, meeting_url, recall_bot_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        meeting_name || `Meeting ${new Date().toISOString()}`,
        `Meeting from ${meeting_url}`,
        'meeting',
        user_id,     // The actual user who created it
        client_id,   // The client that user belongs to
        JSON.stringify({ created_by: 'recall_bot', recall_bot_id: botData.id }),
        meeting_url,
        botData.id,
        'joining'
      ]
    );
    const meeting = meetingResult.rows[0];
    console.log('Meeting created:', meeting.id);
    
    // Update meeting with transcript email
    const userEmail = req.session.user.email;
    
    await req.db.query(
      `UPDATE meetings.meetings 
       SET transcript_email = $1, invited_by_user_id = $2
       WHERE id = $3`,
      [userEmail, user_id, meeting.id]
    );
    console.log('Meeting record updated with email:', meeting.id);
    
    // Process uploaded files if any
    let uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      console.log(`Processing ${req.files.length} uploaded files for meeting ${meeting.id}`);
      
      for (const file of req.files) {
        try {
          // Process file using FileUploadService
          const fileUpload = await req.fileUploadService.processFile(file, {
            clientId: client_id,
            description: `Meeting resource for: ${meeting_name || meeting_url}`,
            tags: ['meeting', 'resource']
          });
          
          // Link file to meeting via junction table
          await req.db.query(
            `INSERT INTO meetings.meeting_files (meeting_id, file_upload_id, created_by_user_id) 
             VALUES ($1, $2, $3)`,
            [meeting.id, fileUpload.id, user_id]
          );
          
          uploadedFiles.push({
            id: fileUpload.id,
            filename: fileUpload.filename,
            size: fileUpload.file_size
          });
          
          console.log(`✅ Processed file: ${fileUpload.filename} (ID: ${fileUpload.id})`);
          
          // Clean up temp file
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
          });
          
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.originalname}:`, fileError);
          // Continue processing other files
        }
      }
    }
    
    res.json({
      bot: botData,
      meeting: meeting,
      uploadedFiles: uploadedFiles
    });
  } catch (error) {
    console.error('Bot creation error:', error);
    console.error('Request body:', req.body);
    console.error('User session:', req.session?.user);
    res.status(500).json({ error: 'Failed to create bot', details: error.message });
  }
});

export default router;