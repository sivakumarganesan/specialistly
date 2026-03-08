/**
 * Subdomain Middleware
 * Extracts subdomain from request hostname and attaches to req object
 */
export const subdomainMiddleware = (req, res, next) => {
  try {
    const hostname = req.get('host') || '';
    const parts = hostname.split('.');
    
    // Extract subdomain
    // Examples:
    // - subdomain.specialistly.com -> subdomain
    // - subdomain.specialistly.local -> subdomain  
    // - specialistly.com -> null (main domain)
    // - localhost:5001 -> null (local development)
    
    let subdomain = null;
    
    if (parts.length > 2) {
      // Has subdomain (e.g., subdomain.specialistly.com)
      subdomain = parts[0];
    }
    
    req.subdomain = subdomain;
    req.hostname = hostname;
    
    console.log(`[Subdomain] Hostname: ${hostname} | Subdomain: ${subdomain}`);
    
    next();
  } catch (error) {
    console.error('Subdomain middleware error:', error);
    next();
  }
};

/**
 * Extract subdomain from hostname
 * Useful for frontend utilities
 */
export const extractSubdomain = (hostname) => {
  if (!hostname) return null;
  
  const parts = hostname.split('.');
  if (parts.length > 2) {
    return parts[0];
  }
  return null;
};
