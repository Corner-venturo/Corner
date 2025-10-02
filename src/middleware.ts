import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromToken, hasPermission, hasRole } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 白名單路徑 - 不需要驗證
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/unauthorized'
  ) {
    return NextResponse.next();
  }

  // 🔥 暫時允許所有請求通過，因為現在使用 localStorage 認證
  // 認證檢查在客戶端的 AuthGuard 和 MainLayout 中進行
  return NextResponse.next();

  // 檢查認證 token
  const authToken = request.cookies.get('auth-token');

  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 驗證 JWT token
    const user = getUserFromToken(authToken.value);

    if (!user) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }

    // 權限檢查
    const userPermissions = user.permissions || [];

    // HR 模組權限檢查
    if (pathname.startsWith('/hr')) {
      if (!hasPermission(userPermissions, 'hr')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 財務模組權限檢查
    if (pathname.startsWith('/finance')) {
      const hasPaymentsPermission = hasPermission(userPermissions, 'payments');
      const hasDisbursementPermission = hasPermission(userPermissions, 'disbursement');

      if (!hasPaymentsPermission && !hasDisbursementPermission) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 資料庫管理權限檢查 - 允許所有已登入用戶存取
    if (pathname.startsWith('/database')) {
      // 資料庫管理對所有已登入用戶開放，不需要特殊權限
    }

    // 特殊團權限檢查
    if (pathname.includes('/special') ||
        (pathname.includes('/tours') && request.nextUrl.searchParams.get('type') === 'special')) {
      if (!hasRole(userPermissions, ['super_admin', 'admin'])) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 報表權限檢查
    if (pathname.startsWith('/reports')) {
      if (!hasPermission(userPermissions, 'reports')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 設定權限檢查
    if (pathname.startsWith('/settings')) {
      if (!hasPermission(userPermissions, 'settings')) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // 在 response header 中添加用戶資訊供後續使用
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-permissions', JSON.stringify(userPermissions));

    return response;

  } catch (error) {
    console.error('🚫 Middleware auth error:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了：
     * - api 路由
     * - _next/static (靜態文件)
     * - _next/image (圖像優化)
     * - favicon.ico (網站圖標)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};