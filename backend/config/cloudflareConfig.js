/**
 * Cloudflare Stream Configuration
 * 
 * Setup Instructions:
 * 1. Sign up at https://dash.cloudflare.com
 * 2. Get Zone ID and API Token from Cloudflare Dashboard
 * 3. Add to .env file:
 *    - CLOUDFLARE_ACCOUNT_ID=your-account-id
 *    - CLOUDFLARE_API_TOKEN=your-api-token
 *    - CLOUDFLARE_ZONE_ID=your-zone-id
 */

// Validate required environment variables
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
const zoneId = process.env.CLOUDFLARE_ZONE_ID || '';

// Debug logging
console.log('[Cloudflare Config] Checking environment variables...');
console.log('[Cloudflare Config] CLOUDFLARE_ACCOUNT_ID:', accountId ? '✓ Set' : '✗ Missing');
console.log('[Cloudflare Config] CLOUDFLARE_API_TOKEN:', apiToken ? '✓ Set' : '✗ Missing');
console.log('[Cloudflare Config] CLOUDFLARE_ZONE_ID:', zoneId ? '✓ Set' : '✗ Missing');

const isConfigured = !!(accountId && apiToken);

if (!isConfigured) {
  console.warn('\n⚠️  WARNING: Cloudflare Stream is NOT properly configured!');
  console.warn('   Video upload features will not work.');
  console.warn('\n   To fix, add these to your environment variables:');
  if (!accountId) console.warn('   → CLOUDFLARE_ACCOUNT_ID=your_account_id');
  if (!apiToken) console.warn('   → CLOUDFLARE_API_TOKEN=your_api_token');
  console.warn('\n   For Railway: Backend service → Variables tab → Add variables → Deploy\n');
} else {
  console.log('\n✓ Cloudflare Stream is configured and ready!\n');
}

export const cloudflareConfig = {
  accountId,
  apiToken,
  zoneId,
  
  // Cloudflare Stream API endpoints
  baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
  
  // Check if configuration is complete
  isConfigured: () => isConfigured,
  
  // Video configuration
  videoConfig: {
    requireSignedURLs: false, // Set to true for private videos
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    watermark: null, // Set to watermark ID if needed
  },
  
  // Pricing reference
  pricing: {
    transcoding: '$0.01 per minute',
    bandwidth: '$2 per 1000 view-minutes',
    storage: 'Included in base pricing',
  }
};

export default cloudflareConfig;
