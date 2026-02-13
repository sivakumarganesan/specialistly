import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Extract subdomain
  const hostParts = host.split('.');
  
  // If there are more than 2 parts (e.g., siva-pickelballcoach.specialistly.com)
  if (hostParts.length > 2) {
    const subdomain = hostParts[0];
    
    // Exclude common subdomains
    const excludedSubdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'localhost'];
    
    if (!excludedSubdomains.includes(subdomain)) {
      // Rewrite to /specialist/[slug] route
      return NextResponse.rewrite(
        new URL(`/specialist/${subdomain}${pathname}`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and api
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
