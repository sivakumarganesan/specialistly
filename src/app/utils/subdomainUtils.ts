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
    subdomain = parts[0];
    isSubdomain = true;
  }
  
  return {
    subdomain,
    isSubdomain,
    isLocalhost,
    hostname,
  };
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
  
  if (window.location.hostname.includes('railway')) {
    return 'https://specialistly-production.up.railway.app/api';
  }
  
  return `https://${window.location.hostname}/api`;
};
