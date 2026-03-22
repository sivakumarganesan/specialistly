/**
 * Subdomain utilities for frontend
 */

export interface SubdomainInfo {
  subdomain: string | null;
  isSubdomain: boolean;
  isLocalhost: boolean;
  hostname: string;
}

/**
 * Extract subdomain from the current hostname
 * @returns Object with subdomain info
 */
export const getSubdomainInfo = (): SubdomainInfo => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  
  let subdomain = null;
  let isSubdomain = false;
  
  if (!isLocalhost && parts.length > 2) {
    // Has subdomain (e.g., subdomain.specialistly.com)
    // Exclude 'www' — it's not a branded subdomain
    if (parts[0] !== 'www') {
      subdomain = parts[0];
      isSubdomain = true;
    }
  }
  
  return {
    subdomain,
    isSubdomain,
    isLocalhost,
    hostname,
  };
};

/**
 * Check if the current hostname is a custom domain (not a specialistly subdomain)
 * e.g., adhiranspecialityclinic.com or www.adhiranspecialityclinic.com
 */
export const isCustomDomain = (): boolean => {
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname.startsWith('127.0.0.1');
  if (isLocalhost) return false;
  
  // If the hostname does NOT contain 'specialistly', it's a custom domain
  return !hostname.includes('specialistly');
};

/**
 * Get the custom domain hostname (without www prefix)
 */
export const getCustomDomain = (): string => {
  let hostname = window.location.hostname;
  if (hostname.startsWith('www.')) {
    hostname = hostname.substring(4);
  }
  return hostname;
};

/**
 * Check if current page is a public subdomain website
 */
export const isSubdomainWebsite = (): boolean => {
  const { isSubdomain, isLocalhost } = getSubdomainInfo();
  return isSubdomain && !isLocalhost;
};

/**
 * Get the public URL for a website
 */
export const getPublicWebsiteUrl = (subdomain: string): string => {
  // For production, use the subdomain
  if (subdomain && !window.location.hostname.includes('localhost')) {
    return `https://${subdomain}.specialistly.com`;
  }
  
  // For local development, use localhost with port
  return `http://${subdomain}.specialistly.local:5173`;
};

/**
 * Get the API base URL for different environments
 */
export const getApiBaseUrl = (): string => {
  if (window.location.hostname.includes('localhost')) {
    return 'http://localhost:5001/api';
  }
  
  // For production, use relative path
  return '/api';
};
