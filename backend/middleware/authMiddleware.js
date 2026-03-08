import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      console.error('[authMiddleware] No token provided in Authorization header');
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('[authMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    console.log('[authMiddleware] Token verified for user:', decoded.email || decoded.userId);
    next();
  } catch (error) {
    console.error('[authMiddleware] Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
// Optional auth middleware - validates token if present, but doesn't fail if missing
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      console.log('[optionalAuth] User authenticated:', decoded.userId);
    } else {
      console.log('[optionalAuth] No token provided, proceeding unauthenticated');
    }
    
    next();
  } catch (error) {
    console.log('[optionalAuth] Token validation failed:', error.message);
    // Don't return error - allow unauthenticated access
    next();
  }
};