import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.error('[authMiddleware] No token provided in Authorization header');
      console.error('[authMiddleware] Authorization header:', authHeader ? 'present but malformed' : 'missing');
      return res.status(401).json({ 
        error: 'No token provided',
        debug: { hasAuthHeader: !!authHeader }
      });
    }

    console.log('[authMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    console.log('[authMiddleware] Token verified successfully');
    console.log('[authMiddleware] Decoded payload:', {
      email: decoded.email,
      userId: decoded.userId,
      keys: Object.keys(decoded),
    });
    
    req.user = decoded;
    console.log('[authMiddleware] User set on request:', decoded.email || decoded.userId);
    next();
  } catch (error) {
    console.error('[authMiddleware] Token verification failed:', error.message);
    console.error('[authMiddleware] Error details:', {
      name: error.name,
      message: error.message,
      expiredAt: error.expiredAt,
    });
    res.status(401).json({ 
      error: 'Invalid token',
      debug: { errorType: error.name, errorMessage: error.message }
    });
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