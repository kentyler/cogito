/**
 * Admin User Management Routes
 * Handles user-client associations for admin interface
 */

import express from 'express';
import { requireAdmin } from '../middleware/admin-auth.js';
import { ApiResponses } from '../lib/api-responses.js';

const router = express.Router();

export function createUserManagementRoutes(dbAgent) {
  // Get users for a specific client
  router.get('/clients/:id/users', requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const users = await dbAgent.clients.getClientUsers(clientId);
      return ApiResponses.success(res, users);
    } catch (error) {
      console.error('Get client users error:', error);
      return ApiResponses.internalError(res, 'Failed to load users');
    }
  });

  // Get meetings for a specific client
  router.get('/clients/:id/meetings', requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const meetings = await dbAgent.meetings.getClientMeetings(clientId);
      return ApiResponses.success(res, meetings);
    } catch (error) {
      console.error('Get client meetings error:', error);
      return ApiResponses.internalError(res, 'Failed to load meetings');
    }
  });

  // Get meeting transcript
  router.get('/meetings/:id/transcript', requireAdmin, async (req, res) => {
    try {
      const meetingId = req.params.id;
      console.log('🔍 Transcript request for meeting ID:', meetingId);
      
      const transcriptData = await dbAgent.meetings.getTranscript(meetingId);
      
      if (!transcriptData) {
        console.log('❌ No transcript data found for meeting:', meetingId);
        return ApiResponses.notFound(res, 'Meeting not found');
      }
      
      console.log('✅ Transcript found, length:', transcriptData.full_transcript ? 
        (typeof transcriptData.full_transcript === 'string' ? 
          transcriptData.full_transcript.length : 
          JSON.stringify(transcriptData.full_transcript).length
        ) : 0);
      
      return ApiResponses.success(res, transcriptData);
    } catch (error) {
      console.error('Get meeting transcript error:', error);
      return ApiResponses.internalError(res, 'Failed to load meeting transcript');
    }
  });

  // Get files for a specific client
  router.get('/clients/:id/files', requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const files = await dbAgent.files.getClientFiles(clientId);
      return ApiResponses.success(res, files);
    } catch (error) {
      console.error('Get client files error:', error);
      return ApiResponses.internalError(res, 'Failed to load files');
    }
  });

  // Add a user to a client
  router.post('/clients/:id/users', requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { email, password, role } = req.body;
      
      // Validate input
      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
      }
      
      // Check if user already exists
      const existingUser = await dbAgent.users.findUsersByEmail(email);
      let userId;
      
      if (existingUser.length > 0) {
        userId = existingUser[0].id;
      } else {
        // Create new user
        const newUser = await dbAgent.users.create({
          email: email,
          password: password
        });
        userId = newUser.id;
      }
      
      // Add user to client
      await dbAgent.clients.addUserToClient(userId, clientId, role);
      
      res.json({ 
        success: true, 
        message: 'User added to client successfully',
        userId 
      });
    } catch (error) {
      console.error('Add user to client error:', error);
      return ApiResponses.internalError(res, 'Failed to add user to client');
    }
  });

  // Remove a user from a client
  router.delete('/clients/:clientId/users/:userId', requireAdmin, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const userId = parseInt(req.params.userId);
      
      const removed = await dbAgent.clients.removeUserFromClient(userId, clientId);
      
      if (!removed) {
        return ApiResponses.notFound(res, 'User-client association not found');
      }
      
      res.json({ 
        success: true, 
        message: 'User removed from client successfully' 
      });
    } catch (error) {
      console.error('Remove user from client error:', error);
      return ApiResponses.internalError(res, 'Failed to remove user from client');
    }
  });

  return router;
}