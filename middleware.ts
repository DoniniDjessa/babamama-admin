import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes (everything except login and auth callbacks)
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/auth')

  if (!isAuthPage && !user) {
    // Redirect to login if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check if user is in ali-users (admin app users only)
  // TEMPORARILY DISABLED to prevent redirect loops during migration
  // Re-enable after running migration 004 and 005
  // 
  // if (!isAuthPage && user) {
  //   try {
  //     const { data: adminUser, error: userError } = await supabase
  //       .from('ali-users')
  //       .select('id, is_active')
  //       .eq('id', user.id)
  //       .single()
  //
  //     // If user is not in ali-users, redirect to login
  //     if (userError || !adminUser) {
  //       const url = request.nextUrl.clone()
  //       url.pathname = '/login'
  //       url.searchParams.set('error', 'not_authorized')
  //       return NextResponse.redirect(url)
  //     }
  //
  //     // If user is inactive, redirect to login
  //     if (adminUser && !adminUser.is_active) {
  //       const url = request.nextUrl.clone()
  //       url.pathname = '/login'
  //       url.searchParams.set('error', 'account_inactive')
  //       return NextResponse.redirect(url)
  //     }
  //   } catch (error) {
  //     // Allow access if table doesn't exist yet
  //     console.error('Middleware error (allowing access):', error)
  //   }
  // }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

