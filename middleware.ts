import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Extract subdomain from host
  const parts = host.split('.');
  
  if (parts.length > 2) {
    const subdomain = parts[0];
    const excludedSubdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'localhost'];
    
    if (!excludedSubdomains.includes(subdomain) && subdomain !== 'specialistly') {
      // Rewrite to specialist route
      const url = request.nextUrl.clone();
      url.pathname = `/specialist/${subdomain}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
