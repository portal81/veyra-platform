import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_DOMAIN = 'veyra.co';
const ADMIN_DOMAIN = 'dashboard.veyra.co';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  const isPublicDomain = host.includes(PUBLIC_DOMAIN);
  const isAdminDomain = host.includes(ADMIN_DOMAIN);

  // Public domain: redirect admin routes to dashboard
  if (isPublicDomain) {
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      return NextResponse.redirect(
        new URL(`https://${ADMIN_DOMAIN}${pathname}`, request.url)
      );
    }
    return NextResponse.next();
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
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|brand/|scenes/).*)',
  ],
};
