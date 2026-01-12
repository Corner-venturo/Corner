/**
 * Debug API - 為每個 workspace 建立專屬機器人
 * 每個公司都有自己的 BOT001，功能可以不同
 */

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { successResponse, errorResponse } from '@/lib/api/response'

const GLOBAL_BOT_ID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  // GET 只檢查狀態，不做修改
  return checkBotStatus()
}

export async function POST(request: NextRequest) {
  // POST 執行建立/修復
  return setupWorkspaceBots()
}

async function checkBotStatus() {
  try {
    const adminClient = getSupabaseAdminClient()

    // 取得所有 workspaces
    const { data: workspaces } = await adminClient
      .from('workspaces')
      .select('id, name, code, type')
      .order('name')

    // 取得所有機器人
    const { data: bots } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('employee_number', 'BOT001')

    const status = workspaces?.map(ws => {
      const bot = bots?.find(b => b.workspace_id === ws.id)
      return {
        workspace: ws.name,
        code: ws.code,
        has_bot: !!bot,
        bot_id: bot?.id || null,
        bot_name: bot?.display_name || null,
        supabase_user_id: bot?.supabase_user_id || null,
      }
    })

    return successResponse({
      message: '使用 POST 方法來建立缺少的機器人',
      workspaces: status,
      missing_bots: status?.filter(s => !s.has_bot).length || 0,
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}

async function setupWorkspaceBots() {
  try {
    const adminClient = getSupabaseAdminClient()
    const results: { workspace: string; action: string; success: boolean; error?: string }[] = []

    // 1. 取得所有 workspaces
    const { data: workspaces, error: wsError } = await adminClient
      .from('workspaces')
      .select('id, name, code, type')
      .order('name')

    if (wsError || !workspaces) {
      return errorResponse('無法取得 workspaces: ' + wsError?.message, 500)
    }

    // 2. 取得現有的機器人
    const { data: existingBots } = await adminClient
      .from('employees')
      .select('id, employee_number, display_name, workspace_id, supabase_user_id')
      .eq('employee_number', 'BOT001')

    // 3. 為每個 workspace 檢查並建立機器人
    for (const ws of workspaces) {
      const existingBot = existingBots?.find(b => b.workspace_id === ws.id)

      if (existingBot) {
        // 機器人已存在，檢查是否需要建立 Auth
        if (!existingBot.supabase_user_id) {
          // 建立 Auth 帳號
          const authResult = await createBotAuth(adminClient, ws.code, existingBot.id)
          results.push({
            workspace: ws.name,
            action: '綁定 Auth',
            success: authResult.success,
            error: authResult.error,
          })
        } else {
          results.push({
            workspace: ws.name,
            action: '已完整設定',
            success: true,
          })
        }
      } else {
        // 需要建立新機器人
        const createResult = await createWorkspaceBot(adminClient, ws)
        results.push({
          workspace: ws.name,
          action: '建立機器人',
          success: createResult.success,
          error: createResult.error,
        })
      }
    }

    return successResponse({
      message: '機器人設定完成',
      results,
      success_count: results.filter(r => r.success).length,
      failed_count: results.filter(r => !r.success).length,
    })
  } catch (error) {
    return errorResponse(String(error), 500)
  }
}

async function createWorkspaceBot(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  workspace: { id: string; name: string; code: string; type: string | null }
) {
  try {
    // 1. 建立員工記錄
    const botId = crypto.randomUUID()
    const botName = `${workspace.name} 機器人`

    const { error: insertError } = await adminClient
      .from('employees')
      .insert({
        id: botId,
        employee_number: 'BOT001',
        english_name: 'Bot',
        display_name: botName,
        chinese_name: botName,
        workspace_id: workspace.id,
        status: 'active',
        roles: ['bot'],
        permissions: ['bot'],
        personal_info: {},
        job_info: {},
        salary_info: { base_salary: 0, allowances: [], salary_history: [] },
        attendance: { leave_records: [], overtime_records: [] },
        contracts: [],
      })

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    // 2. 建立 Auth 帳號並綁定
    const authResult = await createBotAuth(adminClient, workspace.code, botId)

    return authResult
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function createBotAuth(
  adminClient: ReturnType<typeof getSupabaseAdminClient>,
  workspaceCode: string,
  botEmployeeId: string
) {
  try {
    const email = `${workspaceCode.toLowerCase()}_bot@venturo.internal`
    const password = crypto.randomUUID() // 隨機密碼，機器人不需要登入

    // 1. 檢查 Auth 用戶是否已存在
    const { data: { users } } = await adminClient.auth.admin.listUsers()
    let authUser = users?.find(u => u.email === email)

    if (!authUser) {
      // 建立新 Auth 用戶
      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

      if (error) {
        return { success: false, error: '建立 Auth 失敗: ' + error.message }
      }

      authUser = data.user
    }

    // 2. 更新員工的 supabase_user_id
    const { error: updateError } = await adminClient
      .from('employees')
      .update({ supabase_user_id: authUser.id })
      .eq('id', botEmployeeId)

    if (updateError) {
      return { success: false, error: '更新 supabase_user_id 失敗: ' + updateError.message }
    }

    return { success: true, authUserId: authUser.id }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
