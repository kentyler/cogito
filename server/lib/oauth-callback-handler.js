/**
 * OAuth Callback Handler
 * Handles OAuth provider callbacks and user authentication
 */

import { DatabaseAgent } from '../../lib/database-agent.js';
import { createSessionMeeting } from './session-meeting.js';
import { handleClientAssignment } from './oauth-client-assignment.js';

/**
 * Handle OAuth callback from provider
 * @param {Object} req - Express request object  
 * @param {Object} res - Express response object
 * @param {Object} provider - OAuth provider instance
 * @param {string} providerName - Name of the OAuth provider
 */
export async function handleOAuthCallback(req, res, provider, providerName) {
  const { code, state } = req.query;
  
  if (!code) {
    return res.redirect('/?error=' + encodeURIComponent('Authorization code not received'));
  }
  
  if (req.session.oauthState && req.session.oauthState !== state) {
    return res.redirect('/?error=' + encodeURIComponent('Invalid OAuth state'));
  }
  
  try {
    // Exchange code for tokens
    console.log(`🔄 Exchanging OAuth code for tokens with ${providerName}`);
    const tokens = await provider.exchangeCodeForTokens(code);
    
    // Get user profile
    console.log(`🔄 Fetching user profile from ${providerName}`);
    const profile = await provider.getUserProfile(tokens);
    console.log(`✅ ${providerName} profile received:`, profile.email);
    
    // Handle user authentication/creation
    const dbAgent = new DatabaseAgent();
    await dbAgent.connect();
    // Available methods: findByEmail, updateOAuthInfo, createFromOAuth
    
    try {
      let user = await dbAgent.users.findByEmail(profile.email);
      
      if (user) {
        // Update existing user's OAuth info
        // Schema verified: users table has provider_id field for OAuth integration
        await dbAgent.users.updateOAuthInfo(user.id, {
          provider: providerName,
          provider_id: profile.id,
          tokens: tokens
        });
        console.log(`✅ Updated existing user OAuth info: ${profile.email}`);
      } else {
        // Create new user from OAuth
        // Schema verified: users table supports provider_id for OAuth
        user = await dbAgent.users.createFromOAuth({
          email: profile.email,
          name: profile.name,
          provider: providerName,
          provider_id: profile.id,
          tokens: tokens
        });
        console.log(`✅ Created new user from ${providerName}: ${profile.email}`);
      }
      
      // Handle client assignment (auto-assign if needed)
      const isGoldenHordeInterface = req.session.goldenHordeOAuth;
      const clients = await handleClientAssignment(dbAgent, user, isGoldenHordeInterface);
      console.log(`📋 User ${profile.email} has access to ${clients.length} clients`);
      
      if (clients.length === 1) {
        // Auto-select single client and create session
        await setupUserSession(req, res, user, clients[0], dbAgent, profile, isGoldenHordeInterface);
      } else {
        // Multiple clients - show selection
        req.session.pendingUser = {
          user_id: user.id,
          email: user.email
        };
        
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.redirect('/?error=' + encodeURIComponent('Session creation failed'));
          }
          res.redirect('/?success=true');
        });
      }
      
    } finally {
      await dbAgent.close();
    }
    
  } catch (error) {
    console.error(`❌ ${providerName} OAuth callback error:`, error);
    res.redirect('/?error=' + encodeURIComponent(`${providerName} authentication failed: ${error.message}`));
  }
}

/**
 * Setup user session with single client
 */
async function setupUserSession(req, res, user, client, dbAgent, profile, isGoldenHordeInterface) {
  try {
    // Get parent_client_id for mini-horde support
    // Available methods: getClientById returns client with parent_client_id field
    const clientDetails = await dbAgent.clients.getClientById(client.client_id);
    const parent_client_id = clientDetails?.parent_client_id || null;
    
    // Create session meeting
    const meeting_id = await createSessionMeeting(req.db, user.id, client.client_id);
    
    // Set up session
    req.session.user = {
      user_id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      picture: profile.picture,
      client_id: client.client_id,
      client_name: client.client_name,
      role: client.role,
      authProvider: profile.provider
    };
    req.session.parent_client_id = parent_client_id;
    req.session.meeting_id = meeting_id;
    
    // Log successful OAuth login
    // Schema verified: auth_events supports user_id for tracking
    await dbAgent.logAuthEvent('oauth_login', {
      email: user.email,
      user_id: user.id,
      provider: profile.provider,
      client_id: client.client_id
    }, {
      userId: user.id,
      sessionId: req.sessionID,
      endpoint: `${req.method} ${req.path}`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('/?error=' + encodeURIComponent('Session creation failed'));
      }
      
      // Clear Golden Horde interface flag and redirect appropriately
      delete req.session.goldenHordeOAuth;
      
      if (isGoldenHordeInterface) {
        // Redirect back to Golden Horde interface
        res.redirect('/goldenhorde/');
      } else {
        // Redirect to main Cogito app
        res.redirect('/?success=true');
      }
    });
    
  } catch (error) {
    console.error('Session setup error:', error);
    res.redirect('/?error=' + encodeURIComponent('Session setup failed'));
  }
}