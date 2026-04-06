import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export const adminMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Try to find user by ID first, but fallback to email if ID lookup fails
    let user = await User.findById(decoded.userId).select('role email name');
    
    if (!user && decoded.email) {
      // Fallback: lookup by email (more reliable)
      user = await User.findOne({ email: decoded.email }).select('role email name');
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = { ...decoded, role: user.role };
    next();
  } catch (error) {
    console.error('Admin middleware error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
