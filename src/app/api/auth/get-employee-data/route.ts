import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

interface GetEmployeeRequest {
  username: string
  code: string
}

/**
 * 取得員工資料 API
 * 用於登入成功後取得員工詳細資料
 * 不驗證密碼（密碼已由 Supabase Auth 驗證）
 */
export async function POST(request: NextRequest) {
  try {
    const body: GetEmployeeRequest = await request.json()
    const { username, code } = body

    if (!username || !code) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // 1. 查詢 workspace（統一大寫）
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, code')
      .eq('code', code.trim().toUpperCase())
      .maybeSingle()

    if (wsError) {
      logger.error('Workspace query error:', wsError)
      return NextResponse.json(
        { success: false, message: '系統錯誤' },
        { status: 500 }
      )
    }

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: '找不到此代號' },
        { status: 400 }
      )
    }

    // 2. 查詢員工（大小寫不敏感）
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .ilike('employee_number', username)
      .eq('workspace_id', workspace.id)
      .maybeSingle()

    if (empError) {
      logger.error('Employee query error:', empError)
      return NextResponse.json(
        { success: false, message: '系統錯誤' },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, message: '找不到此員工' },
        { status: 404 }
      )
    }

    // 3. 檢查帳號狀態
    if (employee.status === 'terminated') {
      return NextResponse.json(
        { success: false, message: '此帳號已停用' },
        { status: 401 }
      )
    }

    // 4. 回傳員工資料（不含密碼）
    const { password_hash: _, ...employeeData } = employee

    return NextResponse.json({
      success: true,
      employee: employeeData,
      workspaceId: workspace.id,
      workspaceCode: workspace.code,
    })
  } catch (error) {
    logger.error('Get employee data error:', error)
    return NextResponse.json(
      { success: false, message: '系統錯誤' },
      { status: 500 }
    )
  }
}
