import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { subdomainMiddleware } from './middleware/subdomainMiddleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
import healthRoutes from './routes/healthRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import consultingSlotRoutes from './routes/consultingSlotRoutes.js';
import availabilityScheduleRoutes from './routes/availabilityScheduleRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import commissionRoutes from './routes/commissionRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import payoutRoutes from './routes/payoutRoutes.js';
import pageBuilderRoutes from './routes/pageBuilderRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN || 'http://localhost:3000',
  'https://www.specialistly.com',
  'https://specialistly.com',
  'https://specialistly-production.up.railway.app',
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
];

// Function to check if origin is allowed
const isOriginAllowed = (origin) => {
  if (!origin) return true; // Allow no-origin requests (mobile apps, curl)
  
  // Check exact matches
  if (allowedOrigins.includes(origin)) return true;
  
  // Allow any subdomain of specialistly.com over HTTPS
  if (origin.match(/^https:\/\/[a-z0-9-]+\.specialistly\.com(:[0-9]+)?$/)) {
    return true;
  }
  
  // Allow any subdomain of specialistly.local for local development
  if (origin.match(/^https?:\/\/[a-z0-9-]+\.specialistly\.local(:[0-9]+)?$/)) {
    return true;
  }
  
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));

// Add subdomain middleware to extract subdomain from hostname
app.use(subdomainMiddleware);

// ⚠️ IMPORTANT: Stripe webhook middleware MUST be BEFORE express.json()
// Webhook requires raw body, not JSON parsed
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Import webhook handler without blocking
    import('./controllers/webhookController.js').then(module => {
      module.handleStripeWebhook(req, res).catch(next);
    });
  }
);

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
app.use('/api/health', healthRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/consulting-slots', consultingSlotRoutes);
app.use('/api/availability-schedule', availabilityScheduleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/specialist', payoutRoutes);
app.use('/api/page-builder', pageBuilderRoutes);
app.use('/api/page-builder/websites/:websiteId/pages', pageRoutes);
app.use('/api/page-builder/websites/:websiteId/media', mediaRoutes);
app.use('/api/public', publicRoutes);

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
// ============ REACT SPA SERVING ============
// Serve static files from dist folder BEFORE API routes
const distPath = path.join(__dirname, '../dist');

console.log('📁 Serving static files from:', distPath);

// Serve static assets (js, css, images, etc.) with proper caching
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false,
  // Serve index.html for SPA routing
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// SPA fallback - serve index.html for client-side routes
// IMPORTANT: This must be AFTER express.static() but BEFORE error handler
app.get('*', (req, res, next) => {
  // Don't serve index.html for API routes - let them 404
  if (req.path.startsWith('/api')) {
    return next();
  }
  
  // For all other routes (including those without extensions), serve index.html
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error serving index.html:', err.message);
      // If index.html doesn't exist, the dist folder might not be built
      res.status(500).json({
        success: false,
        message: 'React app not found. Make sure dist/ folder is built.',
        error: err.message
      });
    }
  });
});

// ============ ERROR HANDLING ============
// Error handler middleware (MUST be last)
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

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Backend server is LISTENING on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  
  // Verify React build exists
  const distPath = path.join(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`✓ React build found at ${distPath}`);
    console.log(`  Files: ${files.join(', ')}`);
  } else {
    console.warn(`⚠ React build not found at ${distPath}`);
    console.warn(`  Make sure 'npm run build' was executed before starting the server`);
  }
});

server.on('error', (error) => {
  console.error(`✗ Server error:`, error.message);
  process.exit(1);
});
