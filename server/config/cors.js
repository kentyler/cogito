// CORS configuration for browser extensions and web clients
export function setupCORS(app) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Always set Vary header to prevent caching issues
    res.setHeader('Vary', 'Origin');
    
    // Handle browser extension origins and credentialed requests
    if (origin) {
      const isExtension = origin.startsWith('chrome-extension://') || 
                         origin.startsWith('moz-extension://') ||
                         origin.startsWith('edge-extension://');
      
      const isAllowedWebOrigin = origin.includes('localhost') || 
                                 origin.includes('cogito-meetings.onrender.com');
      
      if (isExtension || isAllowedWebOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    }
    
    // Set allowed methods and headers
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Client-ID');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.sendStatus(204); // No Content
      return;
    }
    
    next();
  });
}