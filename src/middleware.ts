import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // 1. Admin login page - redirect to admin dashboard if already logged in as ADMIN
  if (pathname === '/admin/login') {
    if (token && token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 2. User login / register pages - redirect to dashboard if already logged in
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return NextResponse.next();
  }

  // 3. Admin dashboard routes protection
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    if (token.role !== 'ADMIN') {
      // Redirect to home if a user tries to access admin pages
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // 4. User dashboard / learning routes protection
  if (pathname.startsWith('/dashboard') || pathname.includes('/lessons')) {
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/login',
    '/register',
    '/courses/:courseId/lessons/:path*',
  ],
};
