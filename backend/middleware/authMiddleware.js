import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
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