import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import courseRoutes from './routes/courseRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import authRoutes from './routes/authRoutes.js';
import websiteRoutes from './routes/websiteRoutes.js';
import zoomRoutes from './routes/zoomRoutes.js';
import brandingRoutes from './routes/brandingRoutes.js';

dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/zoom', zoomRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running',
  });
});

// Test endpoint to get outbound IP
app.get('/api/test/outbound-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    res.status(200).json({
      success: true,
      outboundIp: data.ip,
      message: 'This is the IP to whitelist in MongoDB Atlas',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to get outbound IP',
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error caught by error handler:');
  console.error('   Path:', req.path);
  console.error('   Method:', req.method);
  console.error('   Message:', err.message);
  console.error('   Stack:', err.stack);
  
  // Send error response
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message,
    path: req.path,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Backend server is LISTENING on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

server.on('error', (error) => {
  console.error(`✗ Server error:`, error.message);
  process.exit(1);
});
