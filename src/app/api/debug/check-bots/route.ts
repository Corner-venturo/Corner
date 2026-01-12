/**
 * Debug API - 檢查各 workspace 的機器人設定
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'

export async function GET(request: NextRequest) {
  try {
    const adminClient = getSupabaseAdminClient()

    // 1. 取得所有 workspaces
    const { data: workspaces, error: wsError } = await adminClient
      .from('workspaces')
      .select('id, name, code, type')
      .order('name')

    if (wsError) {
      return errorResponse(wsError.message, 500)
    }

    // 2. 取得系統機器人（BOT001）
    const { data: bots, error: botError } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id, status')
      .or('employee_number.eq.BOT001,id.eq.00000000-0000-0000-0000-000000000001')

    if (botError) {
      return errorResponse(botError.message, 500)
    }

    // 3. 檢查 auth user
    const { data: { users }, error: authError } = await adminClient.auth.admin.listUsers()

    // 4. 分析各 workspace 的機器人狀態
    const workspaceStatus = workspaces?.map(ws => {
      const wsBot = bots?.find(b => b.workspace_id === ws.id)
      const globalBot = bots?.find(b => b.id === '00000000-0000-0000-0000-000000000001')

      // 檢查是否有對應的 auth user
      const botAuthUser = wsBot?.supabase_user_id
        ? users?.find(u => u.id === wsBot.supabase_user_id)
        : null

      return {
        workspace: {
          id: ws.id,
          name: ws.name,
          code: ws.code,
          type: ws.type,
        },
        bot: wsBot ? {
          id: wsBot.id,
          employee_number: wsBot.employee_number,
          display_name: wsBot.display_name,
          supabase_user_id: wsBot.supabase_user_id,
          has_auth_user: !!botAuthUser,
          auth_email: botAuthUser?.email || null,
          status: wsBot.status,
        } : null,
        has_global_bot_access: !!globalBot,
        issues: [] as string[],
      }
    }) || []

    // 5. 標記問題
    for (const ws of workspaceStatus) {
      if (!ws.bot && !ws.has_global_bot_access) {
        ws.issues.push('沒有機器人，也無法存取全域機器人')
      }
      if (ws.bot && !ws.bot.supabase_user_id) {
        ws.issues.push('機器人沒有 supabase_user_id')
      }
      if (ws.bot && ws.bot.supabase_user_id === ws.bot.id) {
        ws.issues.push('機器人的 supabase_user_id 等於 employee.id（錯誤）')
      }
    }

    // 6. 全域機器人資訊
    const globalBot = bots?.find(b => b.id === '00000000-0000-0000-0000-000000000001')
    const globalBotAuth = globalBot?.supabase_user_id
      ? users?.find(u => u.id === globalBot.supabase_user_id)
      : null

    return successResponse({
      total_workspaces: workspaces?.length || 0,
      global_bot: globalBot ? {
        id: globalBot.id,
        employee_number: globalBot.employee_number,
        display_name: globalBot.display_name,
        supabase_user_id: globalBot.supabase_user_id,
        has_auth_user: !!globalBotAuth,
        auth_email: globalBotAuth?.email || null,
      } : null,
      workspaces: workspaceStatus,
      workspaces_with_issues: workspaceStatus.filter(ws => ws.issues.length > 0),
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}
