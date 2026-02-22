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
const requiredEnvVars = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`⚠️  WARNING: Missing Cloudflare configuration!`);
  console.error(`   Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.error(`   Video upload features will not work until these are set.`);
  console.error(`   Add to your .env file:`);
  missingEnvVars.forEach(envVar => {
    console.error(`     ${envVar}=your_value`);
  });
}

export const cloudflareConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  apiToken: process.env.CLOUDFLARE_API_TOKEN,
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
  
  // Cloudflare Stream API endpoints
  baseUrl: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`,
  
  // Check if configuration is complete
  isConfigured: () => {
    return !!(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN);
  },
  
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
