import { logger } from '@/lib/utils/logger'
import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'

type RouteParams = {
  params: Promise<{
    workspaceId: string
    channelId: string
  }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { workspaceId, channelId } = await params

  if (!workspaceId || !channelId) {
    return NextResponse.json({ error: 'workspaceId and channelId are required' }, { status: 400 })
  }

  // workspace 驗證：只能存取自己的 workspace
  if (auth.data.workspaceId !== workspaceId) {
    return NextResponse.json({ error: '無權存取此 workspace' }, { status: 403 })
  }

  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase.from('channel_members')
      .select(
        `
          id,
          workspace_id,
          channel_id,
          employee_id,
          role,
          status,
          created_at,
          updated_at,
          employees:employee_id (
            id,
            display_name,
            english_name,
            email,
            avatar,
            status
          )
        `
      )
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Failed to load channel members:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

     
    const members = (data || []).map((member: Record<string, any>) => ({
      id: member.id as string,
      workspaceId: member.workspace_id as string,
      channelId: member.channel_id as string,
      employeeId: member.employee_id as string,
      role: member.role as string,
      status: member.status as string,
      invitedAt: null as string | null,
      joinedAt: member.created_at as string | null,
      lastSeenAt: member.updated_at as string | null,
      profile: member.employees
        ? {
            id: member.employees.id as string,
            displayName: member.employees.display_name as string,
            englishName: member.employees.english_name as string | null,
            email: member.employees.email as string | null,
            avatar: member.employees.avatar as string | null,
            status: member.employees.status as string | null,
          }
        : null,
    }))

    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load channel members' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { workspaceId, channelId } = await params

  if (!workspaceId || !channelId) {
    return NextResponse.json({ error: 'workspaceId and channelId are required' }, { status: 400 })
  }

  // workspace 驗證
  if (auth.data.workspaceId !== workspaceId) {
    return NextResponse.json({ error: '無權存取此 workspace' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { employeeIds, role = 'member' } = body

  if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
    return NextResponse.json({ error: 'employeeIds array is required' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdminClient()

    // 準備批次插入的資料（使用 upsert 防止重複）
    const membersToInsert = employeeIds.map(employeeId => ({
      workspace_id: workspaceId,
      channel_id: channelId,
      employee_id: employeeId,
      role,
      status: 'active',
    }))

    // 🔥 先檢查是否已存在，避免 upsert 衝突
    const { data: existingMembers } = await supabase
      .from('channel_members')
      .select('employee_id')
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .in('employee_id', employeeIds)

    const existingEmployeeIds = new Set((existingMembers || []).map(m => m.employee_id))
    const newMembers = membersToInsert.filter(m => !existingEmployeeIds.has(m.employee_id))

    if (newMembers.length === 0) {
      // 全部都已存在
      return NextResponse.json({ members: [], count: 0, message: 'All members already exist' })
    }

    // 只插入新成員
    const { data, error } = await supabase.from('channel_members').insert(newMembers).select()

    if (error) {
      logger.error('Failed to add channel members:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ members: data || [], count: data?.length || 0 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add channel members' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  // 認證檢查
  const auth = await getServerAuth()
  if (!auth.success) {
    return NextResponse.json({ error: '請先登入' }, { status: 401 })
  }

  const { workspaceId, channelId } = await params

  if (!workspaceId || !channelId) {
    return NextResponse.json({ error: 'workspaceId and channelId are required' }, { status: 400 })
  }

  // workspace 驗證
  if (auth.data.workspaceId !== workspaceId) {
    return NextResponse.json({ error: '無權存取此 workspace' }, { status: 403 })
  }

  const { memberId } = await request.json().catch(() => ({ memberId: undefined }))

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdminClient()

    const { error } = await supabase
      .from('channel_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('channel_id', channelId)
      .eq('id', memberId)

    if (error) {
      logger.error('Failed to remove channel member:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove channel member' }, { status: 500 })
  }
}
