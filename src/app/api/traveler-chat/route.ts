'use server'

import { NextRequest } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerAuth } from '@/lib/auth/server-auth'
import { successResponse, ApiError } from '@/lib/api/response'
import { logger } from '@/lib/utils/logger'
import { validateBody } from '@/lib/api/validation'
import { travelerChatSchema } from '@/lib/validations/api-schemas'

/**
 * GET /api/traveler-chat
 * 取得工作空間的所有團對話列表
 */
export async function GET() {
  try {
    const auth = await getServerAuth()
    if (!auth.success) {
      return ApiError.unauthorized()
    }

    const { workspaceId } = auth.data
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase.rpc('get_tour_conversations', {
      p_workspace_id: workspaceId,
    })

    if (error) {
      logger.error('Error fetching tour conversations:', error)
      return ApiError.database(error.message)
    }

    return successResponse({ conversations: data || [] })
  } catch (error) {
    logger.error('Error in GET /api/traveler-chat:', error)
    return ApiError.internal()
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
      return ApiError.unauthorized()
    }

    const validation = await validateBody(request, travelerChatSchema)
    if (!validation.success) return validation.error
    const body = validation.data
    const { action } = body
    const supabase = getSupabaseAdminClient()

    switch (action) {
      case 'toggle': {
        const { tourId, isOpen, sendWelcome } = body

        const { error } = await supabase.rpc('toggle_tour_conversation', {
          p_tour_id: tourId as string,
          p_is_open: isOpen as boolean,
          p_send_welcome: sendWelcome ?? true,
        })

        if (error) {
          logger.error('Error toggling conversation:', error)
          return ApiError.database(error.message)
        }

        return successResponse({ success: true })
      }

      case 'send_message': {
        const { conversationId, content, type, attachments } = body

        const { data, error } = await supabase.rpc('send_tour_message', {
          p_conversation_id: conversationId as string,
          p_content: content as string,
          p_type: type || 'text',
          p_attachments: (attachments || []) as unknown as import('@/lib/supabase/types').Json,
        })

        if (error) {
          logger.error('Error sending message:', error)
          return ApiError.database(error.message)
        }

        return successResponse({ success: true, messageId: data })
      }

      case 'add_employee': {
        const { tourId, employeeId, role } = body

        const { error } = await supabase.rpc('add_employee_to_tour_conversation', {
          p_tour_id: tourId as string,
          p_employee_id: employeeId as string,
          p_role: role || 'member',
        })

        if (error) {
          logger.error('Error adding employee:', error)
          return ApiError.database(error.message)
        }

        return successResponse({ success: true })
      }

      case 'mark_read': {
        const { conversationId } = body

        const { error } = await supabase.rpc('mark_conversation_read', {
          p_conversation_id: conversationId as string,
        })

        if (error) {
          logger.error('Error marking read:', error)
          return ApiError.database(error.message)
        }

        return successResponse({ success: true })
      }

      default:
        return ApiError.validation('Invalid action')
    }
  } catch (error) {
    logger.error('Error in POST /api/traveler-chat:', error)
    return ApiError.internal()
  }
}
