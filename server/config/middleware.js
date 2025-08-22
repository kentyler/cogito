import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { setupCORS } from './cors.js';
import path from 'path';

const pgSession = connectPgSimple(session);

export function setupMiddleware(app, pool) {
  // Trust proxy for production deployment
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Setup CORS before other middleware
  setupCORS(app);
  
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware to handle empty JSON bodies
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      // Handle JSON parsing errors by setting an empty body
      req.body = {};
      return next();
    }
    next(err);
  });

  // Session middleware
  app.use(session({
    store: new pgSession({
      pool: pool,
      tableName: 'user_sessions'
    }),
    secret: process.env.SESSION_SECRET || 'cogito-repl-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'cogito.sid', // Custom session name
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      domain: process.env.COOKIE_DOMAIN || undefined // Allow setting custom domain if needed
    }
  }));

  // Set correct MIME types for JavaScript files
  app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    next();
  });

  // Serve static files
  app.use(express.static('public'));

  // Serve bot manager at /bot-manager
  app.use('/bot-manager', express.static('public/bot-manager'));
}

export default setupMiddleware;