import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function hostRoute(request: NextRequest) {
  const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()
  const pathname = request.nextUrl.pathname
  const url = request.nextUrl.clone()

  const registerHost = 'register.mahamarathon.co.in'
  const dashboardHost = 'dashboard.mahamarathon.co.in'
  const adminHost = 'admin.mahamarathon.co.in'

  if (host === registerHost) {
    if (pathname === '/') {
      url.pathname = '/register'
      return { rewrite: url }
    }
    if (pathname.startsWith('/dashboard')) {
      return { redirect: new URL('https://dashboard.mahamarathon.co.in', request.url) }
    }
    if (pathname.startsWith('/admin') || pathname.startsWith('/volunteer')) {
      return { redirect: new URL('https://admin.mahamarathon.co.in', request.url) }
    }
  }

  if (host === dashboardHost) {
    if (pathname === '/') {
      url.pathname = '/dashboard'
      return { rewrite: url }
    }
    if (pathname.startsWith('/register')) {
      return { redirect: new URL('https://register.mahamarathon.co.in', request.url) }
    }
    if (pathname.startsWith('/admin') || pathname.startsWith('/volunteer')) {
      return { redirect: new URL('https://admin.mahamarathon.co.in', request.url) }
    }
  }

  if (host === adminHost) {
    if (pathname === '/') {
      url.pathname = '/admin'
      return { rewrite: url }
    }
    if (pathname.startsWith('/register')) {
      return { redirect: new URL('https://register.mahamarathon.co.in', request.url) }
    }
    if (pathname.startsWith('/dashboard')) {
      return { redirect: new URL('https://dashboard.mahamarathon.co.in', request.url) }
    }
  }

  return { rewrite: null as URL | null }
}

function makeResponse(request: NextRequest, rewriteUrl: URL | null) {
  return rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request: { headers: request.headers } })
    : NextResponse.next({ request })
}

export async function proxy(request: NextRequest) {
  const route = hostRoute(request)
  if ('redirect' in route && route.redirect) {
    return NextResponse.redirect(route.redirect)
  }

  const rewriteUrl = route.rewrite
  let supabaseResponse = makeResponse(request, rewriteUrl)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = makeResponse(request, rewriteUrl)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  // Current Supabase SSR guidance: validate/refresh cookie-backed JWTs in Proxy.
  await supabase.auth.getClaims()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
