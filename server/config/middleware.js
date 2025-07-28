import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const pgSession = connectPgSimple(session);

export function setupMiddleware(app, pool) {
  // Trust proxy for production deployment
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add CORS for browser extension
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // CORS configuration for production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin && origin.includes('cogito-meetings.onrender.com')) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      }
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
  }

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

  // Serve static files
  app.use(express.static('public'));

  // Serve bot manager at /bot-manager
  app.use('/bot-manager', express.static('public/bot-manager'));
}

export default setupMiddleware;