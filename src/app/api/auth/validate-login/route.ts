import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import bcrypt from 'bcryptjs'

interface ValidateLoginRequest {
  username: string
  password: string
  code: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateLoginRequest = await request.json()
    const { username, password, code } = body

    if (!username || !password || !code) {
      return NextResponse.json(
        { success: false, message: '請填寫所有欄位' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdminClient()

    // 統一轉小寫查詢
    const normalizedCode = code.toLowerCase().trim()

    // 1. 查詢 workspace（用小寫比對）
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, code')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (wsError) {
      console.error('Workspace query error:', wsError)
      return NextResponse.json(
        { success: false, message: '系統錯誤' },
        { status: 500 }
      )
    }

    if (!workspace) {
      // 檢查是否是 supplier code（大小寫都查）
      const { data: supplier } = await supabase
        .from('suppliers')
        .select('id, code, name')
        .or(`code.eq.${normalizedCode},code.eq.${code.toUpperCase()}`)
        .eq('is_active', true)
        .maybeSingle()

      if (supplier) {
        return NextResponse.json(
          { success: false, message: `🏭 ${supplier.name}\n廠商登入功能開發中` },
          { status: 400 }
        )
      }

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
      console.error('Employee query error:', empError)
      return NextResponse.json(
        { success: false, message: '系統錯誤' },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, message: '帳號或密碼錯誤' },
        { status: 401 }
      )
    }

    // 3. 檢查帳號狀態
    if (employee.status === 'terminated') {
      return NextResponse.json(
        { success: false, message: '此帳號已停用' },
        { status: 401 }
      )
    }

    // 4. 檢查密碼
    if (!employee.password_hash) {
      return NextResponse.json(
        { success: false, message: '請先設定密碼' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, employee.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '帳號或密碼錯誤' },
        { status: 401 }
      )
    }

    // 5. 回傳員工資料（不含密碼）
    const { password_hash: _, ...employeeData } = employee

    return NextResponse.json({
      success: true,
      employee: employeeData,
      workspaceId: workspace.id,
      workspaceCode: workspace.code,
    })
  } catch (error) {
    console.error('Validate login error:', error)
    return NextResponse.json(
      { success: false, message: '系統錯誤' },
      { status: 500 }
    )
  }
}
