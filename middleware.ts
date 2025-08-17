import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If accessing app routes, check for brand access
    if (pathname.startsWith('/search') || pathname.startsWith('/(app)')) {
      if (!token?.brandId) {
        // User is authenticated but has no brand access
        return NextResponse.redirect(new URL('/help-center', req.url))
      }
    }

    // Allow access to help-center for authenticated users without brands
    if (pathname === '/help-center') {
      return NextResponse.next()
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to help-center for any authenticated user
        if (pathname === '/help-center') {
          return !!token
        }
        
        // For app routes, require authentication
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    '/search',
    '/search/:path*', 
    '/help-center',
    '/api/ingest/:path*', 
    '/api/search/:path*', 
    '/api/filters/:path*',
    '/(app)/:path*' // Protect all app routes
  ]
}
