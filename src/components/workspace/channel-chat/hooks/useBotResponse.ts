import { useCallback } from 'react'
import { useWorkspaceChat } from '@/stores/workspace-store'
import { logger } from '@/lib/utils/logger'
import { COMP_WORKSPACE_LABELS } from '../../constants/labels'

// VENTURO 機器人 ID（同時也是 Logan AI）
const SYSTEM_BOT_ID = '00000000-0000-0000-0000-000000000001'

interface LoganResponse {
  success: boolean
  message: string
  conversationId?: string
  error?: string
}

/**
 * 處理 VENTURO 機器人 AI 回應的 Hook
 *
 * 當用戶傳送訊息給機器人時，自動呼叫 Logan AI 並插入回應
 */
export function useBotResponse() {
  const { sendMessage } = useWorkspaceChat()

  /**
   * 檢查頻道是否為機器人 DM
   */
  const isBotDmChannel = useCallback((channelName: string, channelType?: string | null) => {
    if (channelType === 'direct' || channelName.startsWith('dm:')) {
      const parts = channelName.replace('dm:', '').split(':')
      return parts.includes(SYSTEM_BOT_ID)
    }
    return false
  }, [])

  /**
   * 呼叫 Logan AI API 取得回應
   */
  const callLoganApi = useCallback(async (userMessage: string): Promise<LoganResponse> => {
    try {
      const response = await fetch('/api/logan/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, action: 'chat' }),
      })

      if (!response.ok) {
        return { success: false, message: '', error: COMP_WORKSPACE_LABELS.無法連接到_Logan_AI }
      }

      return await response.json()
    } catch (error) {
      logger.error('Logan API call failed:', error)
      return { success: false, message: '', error: COMP_WORKSPACE_LABELS.AI_服務暫時無法使用 }
    }
  }, [])

  /**
   * 發送機器人回應訊息
   */
  const sendBotResponse = useCallback(
    async (channelId: string, content: string) => {
      await sendMessage({
        channel_id: channelId,
        author_id: SYSTEM_BOT_ID,
        content,
        author: {
          id: SYSTEM_BOT_ID,
          display_name: COMP_WORKSPACE_LABELS.VENTURO_機器人,
          avatar: undefined,
        },
        attachments: undefined,
        parent_message_id: null,
      })
    },
    [sendMessage]
  )

  /**
   * 處理用戶發送給機器人的訊息
   * 自動呼叫 AI 並發送回應
   *
   * 注意：AI 離線時靜默不回應，不顯示錯誤訊息
   */
  const handleBotChat = useCallback(
    async (channelId: string, userMessage: string) => {
      // 呼叫 Logan AI
      const aiResponse = await callLoganApi(userMessage)

      if (aiResponse.success && aiResponse.message) {
        // 發送 AI 回應
        await sendBotResponse(channelId, aiResponse.message)
      }
      // AI 離線或失敗時，靜默不回應（不讓使用者發現）
    },
    [callLoganApi, sendBotResponse]
  )

  return {
    isBotDmChannel,
    handleBotChat,
    SYSTEM_BOT_ID,
  }
}
