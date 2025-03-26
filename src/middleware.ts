import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get path and check if it's an auth route
  const path = request.nextUrl.pathname;
  const isAuthRoute = path === '/login' || path === '/register';
  
  // Get the JWT from localStorage (this would need to be a proper JWT implementation)
  const isLoggedIn = request.cookies.has('isLoggedIn');
  
  // If user is trying to access an auth route but is already logged in,
  // redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // If user is trying to access a protected route and is not logged in,
  // redirect to login
  if (!isAuthRoute && !isLoggedIn && path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Paths matching this pattern will be checked by the middleware
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}; 