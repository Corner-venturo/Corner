/**
 * API Route 認證 Middleware
 *
 * 自動驗證 session，減少每個 route 重複寫 auth 邏輯。
 *
 * @example
 * export const GET = withAuth(async (req, { user, supabase }) => {
 *   // user 和 supabase 已經驗證過了
 *   return successResponse({ id: user.id })
 * })
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export interface AuthContext {
  user: User
  supabase: SupabaseClient
}

type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthContext
) => Promise<NextResponse>

type AuthenticatedHandlerWithParams = (
  request: NextRequest,
  context: AuthContext,
  params: Record<string, string>
) => Promise<NextResponse>

/**
 * 包裝 API route handler，自動處理認證
 *
 * - 建立 supabase server client
 * - 驗證 session
 * - 驗證失敗回 401
 * - 驗證成功把 user + supabase 傳給 handler
 * - 捕捉未預期的錯誤回 500
 */
export function withAuth(handler: AuthenticatedHandler): (request: NextRequest) => Promise<NextResponse>
export function withAuth(handler: AuthenticatedHandlerWithParams): (request: NextRequest, routeContext: { params: Promise<Record<string, string>> }) => Promise<NextResponse>
export function withAuth(handler: AuthenticatedHandler | AuthenticatedHandlerWithParams) {
  return async (request: NextRequest, routeContext?: { params: Promise<Record<string, string>> }) => {
    try {
      const supabase = await createSupabaseServerClient()

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        return ApiError.unauthorized()
      }

      if (routeContext?.params) {
        const params = await routeContext.params
        return await (handler as AuthenticatedHandlerWithParams)(request, { user, supabase }, params)
      }

      return await (handler as AuthenticatedHandler)(request, { user, supabase })
    } catch (error) {
      logger.error('[withAuth] 未預期的錯誤:', error)
      return ApiError.internal('伺服器發生未預期的錯誤')
    }
  }
}
