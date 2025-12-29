'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/traveler-chat
 * 取得工作空間的所有團對話列表
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { workspaceId } = auth.data
    const supabase = getSupabaseAdminClient()

    // 使用 RPC 函數取得團對話列表
    const { data, error } = await supabase.rpc('get_tour_conversations', {
      p_workspace_id: workspaceId,
    })

    if (error) {
      logger.error('Error fetching tour conversations:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ conversations: data || [] })
  } catch (error) {
    logger.error('Error in GET /api/traveler-chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/traveler-chat
 * 開啟/關閉團對話、發送訊息
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth()
    if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body
    const supabase = getSupabaseAdminClient()

    switch (action) {
      case 'toggle': {
        // 開啟/關閉團對話
        const { tourId, isOpen, sendWelcome = true } = body

        const { error } = await supabase.rpc('toggle_tour_conversation', {
          p_tour_id: tourId,
          p_is_open: isOpen,
          p_send_welcome: sendWelcome,
        })

        if (error) {
          logger.error('Error toggling conversation:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'send_message': {
        // 員工發送訊息
        const { conversationId, content, type = 'text', attachments = [] } = body

        const { data, error } = await supabase.rpc('send_tour_message', {
          p_conversation_id: conversationId,
          p_content: content,
          p_type: type,
          p_attachments: attachments,
        })

        if (error) {
          logger.error('Error sending message:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, messageId: data })
      }

      case 'add_employee': {
        // 將員工加入團對話
        const { tourId, employeeId, role = 'member' } = body

        const { error } = await supabase.rpc('add_employee_to_tour_conversation', {
          p_tour_id: tourId,
          p_employee_id: employeeId,
          p_role: role,
        })

        if (error) {
          logger.error('Error adding employee:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      case 'mark_read': {
        // 標記已讀
        const { conversationId } = body

        const { error } = await supabase.rpc('mark_conversation_read', {
          p_conversation_id: conversationId,
        })

        if (error) {
          logger.error('Error marking read:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error in POST /api/traveler-chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
