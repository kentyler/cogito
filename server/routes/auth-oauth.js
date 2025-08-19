import express from 'express';
import crypto from 'crypto';
import { GoogleOAuthProvider } from '../lib/oauth/google-oauth-provider.js';
import { DatabaseAgent } from '../../lib/database-agent.js';
import { createSessionMeeting } from '../lib/session-meeting.js';
import { handleOAuthCallback } from '../lib/oauth-callback-handler.js';
import { handleClientAssignment } from '../lib/oauth-client-assignment.js';

const router = express.Router();

// Initialize OAuth providers
const providers = {};

// Initialize Google OAuth if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.google = new GoogleOAuthProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  });
  console.log('Google OAuth provider initialized');
} else {
  console.log('Google OAuth not configured - set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
}

/**
 * Initiate OAuth flow for a provider
 */
router.get('/:provider', (req, res) => {
  const providerName = req.params.provider;
  const provider = providers[providerName];
  
  if (!provider) {
    return res.status(404).json({ error: `OAuth provider ${providerName} not configured` });
  }
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;
  
  // Check if this is a Golden Horde OAuth request
  const isGoldenHorde = req.query.goldenhorde === 'true';
  if (isGoldenHorde) {
    req.session.goldenHordeOAuth = true;
  }
  
  // Get authorization URL and redirect
  const authUrl = provider.getAuthorizationUrl(state);
  res.redirect(authUrl);
});

/**
 * Handle OAuth callback
 */
router.get('/callback/:provider', async (req, res) => {
  const providerName = req.params.provider;
  const provider = providers[providerName];
  
  if (!provider) {
    return res.status(404).json({ error: `OAuth provider ${providerName} not configured` });
  }
  
  await handleOAuthCallback(req, res, provider, providerName);
});

export default router;
export { providers };