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
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    console.log('[optionalAuth] Checking for authentication...');
    console.log('[optionalAuth] Authorization header present:', !!authHeader);
    console.log('[optionalAuth] Token present:', !!token);
    
    if (token) {
      console.log('[optionalAuth] Attempting to verify token...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      console.log('[optionalAuth] ✓ User authenticated:', {
        email: decoded.email,
        userId: decoded.userId,
      });
    } else {
      console.log('[optionalAuth] No token provided, proceeding unauthenticated');
      console.log('[optionalAuth] ⚠️  Frontend should either:');
      console.log('      a) Send Authorization: Bearer <token> header');
      console.log('      b) Send X-Customer-Email header as fallback');
      console.log('      c) Send customerId query parameter as fallback');
    }
    
    next();
  } catch (error) {
    console.log('[optionalAuth] Token validation failed:', error.message);
    console.log('[optionalAuth] Error type:', error.name);
    // Don't return error - allow unauthenticated access
    next();
  }
};

// Admin authentication middleware - validates token and checks for admin role
export const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.error('[adminAuthMiddleware] No token provided');
      return res.status(401).json({ 
        error: 'No token provided',
      });
    }

    console.log('[adminAuthMiddleware] Verifying token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Check if user has admin role
    if (decoded.role !== 'admin') {
      console.error('[adminAuthMiddleware] User is not admin:', decoded.role);
      return res.status(403).json({
        error: 'Access denied. Admin privileges required.',
      });
    }
    
    req.user = decoded;
    console.log('[adminAuthMiddleware] Admin verified:', decoded.email);
    next();
  } catch (error) {
    console.error('[adminAuthMiddleware] Verification failed:', error.message);
    res.status(401).json({ 
      error: 'Invalid token',
    });
  }
};