/**
 * 建立員工 Supabase Auth 帳號的 API Route
 * 使用 Service Role Key 建立 Supabase Auth 用戶
 *
 * 🔒 安全修復 2026-01-12：需要已登入用戶才能建立新帳號
 */

import { logger } from '@/lib/utils/logger'
import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse, ErrorCode } from '@/lib/api/response'
import { getServerAuth } from '@/lib/auth/server-auth'
import { validateBody } from '@/lib/api/validation'
import { createEmployeeAuthSchema } from '@/lib/validations/api-schemas'

export async function POST(request: NextRequest) {
  try {
    // 🔒 安全檢查：需要已登入用戶才能建立新帳號
    const auth = await getServerAuth()
    if (!auth.success) {
      return errorResponse('請先登入才能建立員工帳號', 401, ErrorCode.UNAUTHORIZED)
    }

    const validation = await validateBody(request, createEmployeeAuthSchema)
    if (!validation.success) return validation.error
    const { employee_number, password, workspace_code } = validation.data

    const supabaseAdmin = getSupabaseAdminClient()
    // Email 格式：{workspace_code}_{employee_number}@venturo.com（區分不同公司的同編號員工）
    // 統一使用小寫格式
    const email = workspace_code
      ? `${workspace_code.toLowerCase()}_${employee_number.toLowerCase()}@venturo.com`
      : `${employee_number.toLowerCase()}@venturo.com`

    // 使用 Admin API 建立用戶
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 自動確認 email
    })

    if (error) {
      // 如果用戶已存在，嘗試更新密碼
      if (error.message.includes('already been registered')) {
        logger.log('Auth 用戶已存在，嘗試更新密碼:', email)

        const { data: users } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = users?.users.find(u => u.email === email)

        if (existingUser) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password }
          )

          if (updateError) {
            logger.error('更新密碼失敗:', updateError)
            return errorResponse(updateError.message, 400, ErrorCode.OPERATION_FAILED)
          }

          logger.log('Auth 密碼已更新:', email)
          return successResponse({ user: existingUser, updated: true })
        }
      }

      logger.error('建立 Auth 用戶失敗:', error)
      return errorResponse(error.message, 400, ErrorCode.OPERATION_FAILED)
    }

    logger.log('Auth 用戶已建立:', email)
    return successResponse({ user: data.user })
  } catch (error) {
    logger.error('建立 Auth 用戶錯誤:', error)
    return errorResponse('Internal server error', 500, ErrorCode.INTERNAL_ERROR)
  }
}
