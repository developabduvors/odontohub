import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle 'eng' as alias for 'en' by redirecting
  if (pathname === '/eng') {
    return NextResponse.redirect(new URL('/en', request.url));
  }
  if (pathname.startsWith('/eng/')) {
    const newPath = pathname.replace(/^\/eng\//, '/en/');
    return NextResponse.redirect(new URL(newPath + request.nextUrl.search, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
