import { useState, useEffect } from 'react';
import { AppContent } from '@/app/App';
import { SpecialistLandingPage } from '@/app/components/SpecialistLandingPage';

export function Router() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if path matches /specialist/:slug
  const specialistMatch = pathname.match(/^\/specialist\/(.+)$/);
  
  if (specialistMatch) {
    const slug = specialistMatch[1];
    return <SpecialistLandingPage slug={slug} />;
  }

  return <AppContent />;
}
