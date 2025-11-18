import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware - 伺服器端路由保護
 *
 * 功能：
 * 1. 檢查登入狀態（驗證 auth-token cookie）
 * 2. 保護需要認證的路由
 * 3. 重定向未登入使用者到登入頁
 */

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth-token')
  const { pathname } = request.nextUrl

  // 公開路由：不需要登入即可訪問
  const publicPaths = [
    '/login',
    '/api/auth',
    '/api/health',
    '/_next',
    '/favicon.ico',
    '/manifest.json',
  ]

  // 檢查是否為公開路由
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  if (isPublicPath) {
    return NextResponse.next()
  }

  // 檢查登入狀態
  if (!authCookie) {
    // 未登入，重定向到登入頁
    const loginUrl = new URL('/login', request.url)

    // 保存原始 URL，登入後可返回
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }

    return NextResponse.redirect(loginUrl)
  }

  // 已登入，允許訪問
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 匹配所有路由，除了：
     * - _next/static (靜態檔案)
     * - _next/image (圖片優化)
     * - favicon.ico (網站圖標)
     * - public 資料夾內的檔案
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
