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
import pageTemplateRoutes from './routes/pageTemplateRoutes.js';
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
app.use('/api/page-templates', pageTemplateRoutes);
app.use('/api/public', publicRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend server is running',
  });
});

// Debug endpoint for subdomain detection
app.get('/debug/subdomain', (req, res) => {
  res.status(200).json({
    subdomain: req.subdomain,
    hostname: req.get('host'),
    path: req.path,
    timestamp: new Date().toISOString(),
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
// Find dist folder - try multiple locations
let distPath;

// Try 1: ./public (where we copy dist to during build)
let tryPath1 = path.join(__dirname, './public');
// Try 2: ../dist (parent of backend when running from backend/)
let tryPath2 = path.join(__dirname, '../dist');
// Try 3: use process.cwd() + '/dist'
let tryPath3 = path.join(process.cwd(), 'dist');

console.log('🔍 Looking for dist/ folder...');
console.log('   Current working directory:', process.cwd());
console.log('   __dirname:', __dirname);
console.log('   Try 1 (backend/public):', tryPath1, '- exists:', fs.existsSync(tryPath1));
console.log('   Try 2 (../dist):', tryPath2, '- exists:', fs.existsSync(tryPath2));
console.log('   Try 3 (process.cwd/dist):', tryPath3, '- exists:', fs.existsSync(tryPath3));

// Use the first one that exists
if (fs.existsSync(tryPath1)) {
  distPath = tryPath1;
  console.log('✓ Using Try 1 (backend/public):', distPath);
} else if (fs.existsSync(tryPath2)) {
  distPath = tryPath2;
  console.log('✓ Using Try 2 (../dist):', distPath);
} else if (fs.existsSync(tryPath3)) {
  distPath = tryPath3;
  console.log('✓ Using Try 3 (process.cwd):', distPath);
} else {
  // None exist - show detailed error
  console.error('❌ CRITICAL: dist/ folder not found in any location!');
  console.error('   Checked:');
  console.error('     1. backend/public:', tryPath1);
  console.error('     2. ../dist:', tryPath2);
  console.error('     3. process.cwd/dist:', tryPath3);
  console.error('   This means the React build did not persist from build phase.');
  console.error('   The "npm run build" command may have failed.');
  distPath = tryPath1; // Set default anyway
}

// Verify contents
if (distPath && fs.existsSync(distPath)) {
  const indexExists = fs.existsSync(path.join(distPath, 'index.html'));
  const assetsExists = fs.existsSync(path.join(distPath, 'assets'));
  console.log('   Contents check:');
  console.log('     - index.html exists:', indexExists);
  console.log('     - assets/ folder exists:', assetsExists);
  
  if (assetsExists) {
    try {
      const assetFiles = fs.readdirSync(path.join(distPath, 'assets')).slice(0, 3);
      console.log('     - Sample asset files:', assetFiles.join(', '));
    } catch (e) {
      console.error('     - Error reading assets:', e.message);
    }
  }
}

// Request logging middleware
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
  }
  next();
});

// Serve static files from dist with correct MIME types
if (distPath && fs.existsSync(distPath)) {
  console.log('✓ Setting up static middleware for:', distPath);
  app.use(express.static(distPath, {
    maxAge: '1d',
    etag: false,
    index: false,
    setHeaders: (res, filePath) => {
      // Explicitly set MIME types
      if (filePath.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        console.log('  → Serving JS:', path.basename(filePath));
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      }
    }
  }));
} else {
  console.error('❌ Skipping static middleware - dist/ folder not found');
}

// Note: Subdomain routing is now handled entirely by the React frontend (PublicWebsite component)
// The frontend detects the subdomain and calls /api/page-builder/public/websites/:domain
// No need for special subdomain handlers here

// ============ SPA FALLBACK ============
// SPA fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('[API]', req.method, req.path);
    return next();
  }
  
  const indexPath = path.join(distPath, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found at:', indexPath);
    return res.status(500).json({
      success: false,
      message: 'React app not found',
      details: 'dist/ folder or index.html missing'
    });
  }
  
  console.log('[SPA]', req.method, req.path, '→ index.html');
  res.sendFile(indexPath, (err) => {
    if (err && err.code !== 'ERR_HTTP_REQUEST_ABORTED') {
      console.error('❌ Error serving index.html:', err.message);
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
