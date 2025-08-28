/**
 * Admin Authentication Middleware
 * Validates admin access for restricted endpoints
 */

export function requireAdmin(req, res, next) {
  const adminUserIds = [1, 7, '1', '7']; // ken@8thfold.com and ianpalonis@gmail.com (handle both string and number)
  
  console.log('Admin check - Full session:', JSON.stringify(req.session));
  console.log('Admin check - Session user:', req.session?.user);
  
  const userId = req.session?.user?.user_id;
  
  // Convert to number if it's a string (handle both string and number)
  const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  const userIdStr = String(userId);
  
  console.log('Admin check - User ID:', userId, 'Type:', typeof userId, 'Parsed:', userIdNum, 'Is Admin:', adminUserIds.includes(userId) || adminUserIds.includes(userIdNum) || adminUserIds.includes(userIdStr));
  
  // Check both string and number versions
  if (!userId || (!adminUserIds.includes(userId) && !adminUserIds.includes(userIdNum) && !adminUserIds.includes(userIdStr))) {
    return res.status(403).json({ 
      error: 'Admin access required. This function is restricted to authorized administrators.',
      debug: { userId, userIdType: typeof userId, parsedId: userIdNum, session: req.session }
    });
  }
  next();
}

export function ensureDbConnection(dbAgent) {
  return async (req, res, next) => {
    try {
      if (!dbAgent.connector.pool) {
        await dbAgent.connect();
      }
      next();
    } catch (error) {
      console.error('Database connection error:', error);
      res.status(500).json({ error: 'Database connection failed' });
    }
  };
}