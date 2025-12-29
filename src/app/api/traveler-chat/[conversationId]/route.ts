'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * GET /api/traveler-chat/[conversationId]
 * 取得對話的訊息列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationId } = await params
    const supabase = getSupabaseAdminClient()

    // 取得 URL 參數
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // cursor for pagination

    // 平行查詢對話、訊息、成員
    const messagesQuery = before
      ? supabase
          .from('traveler_messages')
          .select(`
            id, sender_id, type, content, attachments,
            reply_to_id, reactions, metadata,
            created_at, edited_at, deleted_at
          `)
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .lt('created_at', before)
          .order('created_at', { ascending: false })
          .limit(limit)
      : supabase
          .from('traveler_messages')
          .select(`
            id, sender_id, type, content, attachments,
            reply_to_id, reactions, metadata,
            created_at, edited_at, deleted_at
          `)
          .eq('conversation_id', conversationId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit)

    const [convResult, msgResult, memberResult] = await Promise.all([
      supabase
        .from('traveler_conversations')
        .select(`
          id, type, name, tour_id, is_open, open_at,
          tours (id, tour_code, name, departure_date)
        `)
        .eq('id', conversationId)
        .single(),
      messagesQuery,
      supabase
        .from('traveler_conversation_members')
        .select(`
          id, user_id, employee_id, member_type,
          role, last_read_at, is_muted, joined_at
        `)
        .eq('conversation_id', conversationId)
        .is('left_at', null),
    ])

    if (convResult.error) {
      logger.error('Error fetching conversation:', convResult.error)
      return NextResponse.json({ error: convResult.error.message }, { status: 500 })
    }

    if (msgResult.error) {
      logger.error('Error fetching messages:', msgResult.error)
      return NextResponse.json({ error: msgResult.error.message }, { status: 500 })
    }

    if (memberResult.error) {
      logger.error('Error fetching members:', memberResult.error)
    }

    const conversation = convResult.data
    const messages = msgResult.data
    const members = memberResult.data

    // 取得旅伴和員工資訊（平行查詢）
    const travelerIds = (members || [])
      .filter(m => m.member_type === 'traveler' && m.user_id)
      .map(m => m.user_id!)
      .filter((id): id is string => id !== null)

    const employeeIds = (members || [])
      .filter(m => m.member_type === 'employee' && m.employee_id)
      .map(m => m.employee_id!)
      .filter((id): id is string => id !== null)

    const [profileResult, employeeResult] = await Promise.all([
      travelerIds.length > 0
        ? supabase.from('profiles').select('id, name, avatar_url').in('id', travelerIds)
        : Promise.resolve({ data: [] }),
      employeeIds.length > 0
        ? supabase.from('employees').select('id, display_name, chinese_name, avatar_url').in('id', employeeIds)
        : Promise.resolve({ data: [] }),
    ])

    const travelers = (profileResult.data || []).map(p => ({
      id: p.id,
      name: p.name || 'Unknown',
      avatar_url: p.avatar_url,
    }))

    const employees = (employeeResult.data || []).map(e => ({
      id: e.id,
      display_name: e.display_name || e.chinese_name || 'Unknown',
      avatar_url: e.avatar_url,
    }))

    return NextResponse.json({
      conversation,
      messages: (messages || []).reverse(), // 按時間正序
      members: members || [],
      travelers,
      employees,
    })
  } catch (error) {
    logger.error('Error in GET /api/traveler-chat/[conversationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
