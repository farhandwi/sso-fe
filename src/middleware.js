// middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  const { cookies } = req;
  const refreshToken = cookies.get('refresh_token')?.value;
  // const sessionTokens = req.cookies.getAll();
  // let sessionToken = null;
  // for (const cookie of sessionTokens) {
  //   if (cookie.name.startsWith('next-auth.session-token')) {
  //     sessionToken = cookie.value;
  //     break;
  //   }
  // }

  const url = req.nextUrl.clone();
  const path = url.pathname;
  const isLoginPage = path === '/login';
  const isDashboardPage = path === '/dashboard';
  const isAdmin = path === '/etekjero';
  const noAccess = path === '/access-denied';

  if (
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/api') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.css') ||
    path.endsWith('.js')
  ) {
    return NextResponse.next();
  }

  // Validate refresh_token if present
  let isValidAccessToken = false;
  if (refreshToken) {
    try {
      const JWT_REFRESH_TOKEN = process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN;
      const JWT_SECRET_BUFFER = new TextEncoder().encode(JWT_REFRESH_TOKEN);
      if (!JWT_REFRESH_TOKEN) {
        console.error("JWT_SECRET is not set in environment variables");
      } else {
        const { payload } = await jwtVerify(refreshToken, JWT_SECRET_BUFFER);
        isValidAccessToken = true;
      }
    } catch (error) {
      console.error("Invalid access token:", error.message);
    }
  }

  // Check if user is authenticated
  // const isAuthenticated = isValidAccessToken && sessionToken;
  const isAuthenticated = isValidAccessToken;

  // Redirect logic
  if (!isAuthenticated) {
    if (!isLoginPage) {
      return NextResponse.redirect(new URL(`/login`, req.url));
    }
  } else {
    if (isLoginPage) {
      return NextResponse.redirect(new URL(`/dashboard`, req.url));
    } else if (!isDashboardPage) {
      if(isAdmin || noAccess){
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL(`/dashboard`, req.url));
    }
  }

  // If none of the above conditions are met, proceed with the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/:path*'],
};