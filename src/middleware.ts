import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_DOMAIN = 'veyra.co';
const ADMIN_DOMAIN = 'dashboard.veyra.co';

function getBaseDomain(host: string): string {
  return host.split(':')[0].toLowerCase();
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const baseDomain = getBaseDomain(host);
  const isPublicDomain = baseDomain === PUBLIC_DOMAIN;
  const isAdminDomain = baseDomain === ADMIN_DOMAIN;

  const securityHeaders: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Public domain: redirect admin routes to dashboard
  if (isPublicDomain) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(
        new URL(`https://${ADMIN_DOMAIN}${pathname}`, request.url)
      );
    }
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  // Admin domain: redirect public routes to main site
  if (isAdminDomain) {
    if (!pathname.startsWith('/admin') && 
        !pathname.startsWith('/auth') && 
        !pathname.startsWith('/api') &&
        pathname !== '/') {
      return NextResponse.redirect(
        new URL(`https://${PUBLIC_DOMAIN}${pathname}`, request.url)
      );
    }
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|scenes/).*)',
  ],
};
