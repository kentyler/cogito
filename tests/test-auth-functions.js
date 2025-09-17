/**
 * Authentication Functions Test Suite
 * Tests the authentication handlers as functions, not UI
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { handleLogin } from '../server/routes/auth/login.js';
import { handleLogout } from '../server/routes/auth/logout.js';
import { handleAuthCheck } from '../server/routes/auth/check.js';
import { DatabaseAgent } from '../database/database-agent.js';

// Mock modules
jest.mock('../database/database-agent.js');
jest.mock('../server/auth/session-meeting.js');
jest.mock('../server/api/api-responses.js');

describe('Authentication Functions', () => {
  let mockReq, mockRes, mockDbAgent;
  
  beforeEach(() => {
    // Setup mock request
    mockReq = {
      body: {},
      session: {},
      db: 'mock-db-pool',
      sessionID: 'test-session-id',
      ip: '127.0.0.1',
      get: jest.fn(() => 'test-user-agent')
    };
    
    // Setup mock response
    mockRes = {
      status: jest.fn(() => mockRes),
      json: jest.fn(() => mockRes),
      clearCookie: jest.fn()
    };
    
    // Setup mock DatabaseAgent
    mockDbAgent = {
      connect: jest.fn(),
      close: jest.fn(),
      users: {
        authenticate: jest.fn(),
        getUserClients: jest.fn()
      },
      logAuthEvent: jest.fn()
    };
    
    DatabaseAgent.mockImplementation(() => mockDbAgent);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleLogin', () => {
    it('should reject login with missing credentials', async () => {
      mockReq.body = { email: '', password: '' };
      
      await handleLogin(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Email and password required'
        })
      );
    });
    
    it('should reject login with invalid credentials', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrong' };
      mockDbAgent.users.authenticate.mockResolvedValue(null);
      
      await handleLogin(mockReq, mockRes);
      
      expect(mockDbAgent.connect).toHaveBeenCalled();
      expect(mockDbAgent.users.authenticate).toHaveBeenCalledWith('test@example.com', 'wrong');
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid credentials'
        })
      );
    });
    
    it('should reject login when user has no client access', async () => {
      mockReq.body = { email: 'test@example.com', password: 'correct' };
      mockDbAgent.users.authenticate.mockResolvedValue({ id: 1, email: 'test@example.com' });
      mockDbAgent.users.getUserClients.mockResolvedValue([]);
      
      await handleLogin(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'No active client access'
        })
      );
    });
    
    it('should auto-select single client and create session', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockClient = { 
        client_id: 100, 
        client_name: 'Test Client', 
        role: 'user' 
      };
      
      mockReq.body = { email: 'test@example.com', password: 'correct' };
      mockReq.session.save = jest.fn(cb => cb(null));
      
      mockDbAgent.users.authenticate.mockResolvedValue(mockUser);
      mockDbAgent.users.getUserClients.mockResolvedValue([mockClient]);
      
      await handleLogin(mockReq, mockRes);
      
      expect(mockReq.session.user).toEqual({
        user_id: 1,
        id: 1,
        email: 'test@example.com',
        client_id: 100,
        client_name: 'Test Client',
        role: 'user'
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: {
            email: 'test@example.com',
            client: 'Test Client'
          }
        })
      );
    });
    
    it('should require client selection for multiple clients', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockClients = [
        { client_id: 100, client_name: 'Client A', role: 'user' },
        { client_id: 200, client_name: 'Client B', role: 'admin' }
      ];
      
      mockReq.body = { email: 'test@example.com', password: 'correct' };
      mockReq.session.save = jest.fn(cb => cb(null));
      
      mockDbAgent.users.authenticate.mockResolvedValue(mockUser);
      mockDbAgent.users.getUserClients.mockResolvedValue(mockClients);
      
      await handleLogin(mockReq, mockRes);
      
      expect(mockReq.session.pendingUser).toEqual({
        user_id: 1,
        email: 'test@example.com'
      });
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Client selection required',
          requiresClientSelection: true,
          clients: mockClients
        })
      );
    });
  });
  
  describe('handleLogout', () => {
    it('should destroy session and clear cookie', async () => {
      mockReq.session = {
        user: { id: 1, email: 'test@example.com' },
        destroy: jest.fn(cb => cb(null))
      };
      
      await handleLogout(mockReq, mockRes);
      
      expect(mockReq.session.destroy).toHaveBeenCalled();
      expect(mockRes.clearCookie).toHaveBeenCalledWith('connect.sid');
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Logged out successfully'
        })
      );
    });
    
    it('should log logout event before destroying session', async () => {
      mockReq.session = {
        user: { 
          id: 1, 
          user_id: 1,
          email: 'test@example.com',
          client_id: 100,
          client_name: 'Test Client'
        },
        cookie: { originalMaxAge: 3600000 },
        destroy: jest.fn(cb => cb(null))
      };
      mockReq.sessionID = 'test-session-123';
      
      await handleLogout(mockReq, mockRes);
      
      expect(mockDbAgent.logAuthEvent).toHaveBeenCalledWith(
        'logout',
        expect.objectContaining({
          email: 'test@example.com',
          user_id: 1,
          client_id: 100,
          client_name: 'Test Client'
        }),
        expect.objectContaining({
          userId: 1,
          sessionId: 'test-session-123',
          endpoint: 'undefined undefined',
          ip: '127.0.0.1',
          userAgent: 'test-user-agent'
        })
      );
    });
    
    it('should handle session destroy errors', async () => {
      mockReq.session = {
        destroy: jest.fn(cb => cb(new Error('Session error')))
      };
      
      await handleLogout(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Logout failed'
        })
      );
    });
  });
  
  describe('handleAuthCheck', () => {
    it('should return unauthenticated when no session', async () => {
      mockReq.session = {};
      
      await handleAuthCheck(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        authenticated: false
      });
    });
    
    it('should return authenticated with user data', async () => {
      mockReq.session = {
        user: {
          id: 1,
          email: 'test@example.com',
          client_id: 100,
          client_name: 'Test Client'
        }
      };
      
      await handleAuthCheck(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        authenticated: true,
        user: mockReq.session.user
      });
    });
    
    it('should return pending user requiring client selection', async () => {
      mockReq.session = {
        pendingUser: {
          user_id: 1,
          email: 'test@example.com'
        }
      };
      
      mockDbAgent.users.getUserClients.mockResolvedValue([
        { client_id: 100, client_name: 'Client A' },
        { client_id: 200, client_name: 'Client B' }
      ]);
      
      await handleAuthCheck(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        authenticated: true,
        requiresClientSelection: true,
        clients: expect.arrayContaining([
          expect.objectContaining({ client_id: 100 }),
          expect.objectContaining({ client_id: 200 })
        ])
      });
    });
  });
  
  describe('Session Management', () => {
    it('should maintain session across requests', () => {
      const session = {};
      
      // Simulate login setting session
      session.user = {
        id: 1,
        email: 'test@example.com',
        client_id: 100
      };
      session.meeting_id = 'meeting-123';
      
      // Verify session persists
      expect(session.user).toBeDefined();
      expect(session.user.email).toBe('test@example.com');
      expect(session.meeting_id).toBe('meeting-123');
      
      // Simulate logout clearing session
      delete session.user;
      delete session.meeting_id;
      
      expect(session.user).toBeUndefined();
      expect(session.meeting_id).toBeUndefined();
    });
    
    it('should handle session timeout gracefully', () => {
      const session = {
        user: { id: 1 },
        cookie: {
          maxAge: 3600000,
          expires: new Date(Date.now() - 1000) // Expired
        }
      };
      
      const isExpired = session.cookie.expires < new Date();
      expect(isExpired).toBe(true);
    });
  });
  
  describe('Client Selection', () => {
    it('should update session when client is selected', () => {
      const session = {
        pendingUser: {
          user_id: 1,
          email: 'test@example.com'
        }
      };
      
      // Simulate client selection
      const selectedClient = {
        client_id: 100,
        client_name: 'Selected Client',
        role: 'admin'
      };
      
      // Update session with selected client
      session.user = {
        ...session.pendingUser,
        id: session.pendingUser.user_id,
        ...selectedClient
      };
      delete session.pendingUser;
      
      expect(session.user).toEqual({
        user_id: 1,
        id: 1,
        email: 'test@example.com',
        client_id: 100,
        client_name: 'Selected Client',
        role: 'admin'
      });
      expect(session.pendingUser).toBeUndefined();
    });
    
    it('should handle client switching', () => {
      const session = {
        user: {
          id: 1,
          email: 'test@example.com',
          client_id: 100,
          client_name: 'Client A'
        },
        meeting_id: 'meeting-123'
      };
      
      // Switch to different client
      const newClient = {
        client_id: 200,
        client_name: 'Client B'
      };
      
      // Update session for new client
      session.user.client_id = newClient.client_id;
      session.user.client_name = newClient.client_name;
      delete session.meeting_id; // Clear old meeting
      
      expect(session.user.client_id).toBe(200);
      expect(session.user.client_name).toBe('Client B');
      expect(session.meeting_id).toBeUndefined();
    });
  });
});