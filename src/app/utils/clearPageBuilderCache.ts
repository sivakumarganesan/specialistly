/**
 * Clear all page builder related cache and session data
 * This helps resolve issues with stale website IDs
 */
export const clearPageBuilderCache = () => {
  console.log('🧹 Clearing Page Builder cache...');
  
  // Clear localStorage keys related to page builder
  const keysToRemove = [
    'selectedWebsiteId',
    'currentWebsite',
    'pageBuilderState',
    'webpageBuilderCache',
    'lastWebsiteId',
    'pageBuilderSessions',
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`  ✓ Removed ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Clear session storage
  keysToRemove.forEach(key => {
    if (sessionStorage.getItem(key)) {
      console.log(`  ✓ Removed session ${key}`);
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Cache cleared. Please refresh the page.');
};

/**
 * Get current website ID from various sources
 * Useful for debugging
 */
export const debugWebsiteId = () => {
  const sources = {
    localStorage: localStorage.getItem('selectedWebsiteId'),
    sessionStorage: sessionStorage.getItem('selectedWebsiteId'),
    browserHistory: window.location.pathname,
  };
  
  console.log('🔍 Website ID sources:', sources);
  return sources;
};
