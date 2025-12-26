import type { Message } from '@/stores/workspace/types'
import type { MessageAttachment } from '@/stores/workspace-store'
import { ALERT_MESSAGES } from '../constants'

/**
 * 管理訊息相關的處理函數
 * 包括發送訊息、反應、刪除訊息等
 * 支援 Slack 風格討論串：可指定 parentMessageId 來發送回覆
 */
export function useMessageHandlers(
  messageText: string,
  setMessageText: (text: string) => void,
  selectedChannel: { id: string } | null,
  user: { id: string } | null,
  attachedFiles: File[],
  currentMessages: Message[],
  uploadFiles: (channelId: string) => Promise<MessageAttachment[] | undefined>,
  clearFiles: () => void,
  handleSendMessage: (channelId: string, text: string, attachments?: MessageAttachment[], parentMessageId?: string) => Promise<void>,
  handleReaction: (messageId: string, emoji: string, messages: Message[]) => void,
  handleDeleteMessage: (messageId: string) => Promise<void>,
  parentMessageId?: string | null
) {
  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() && attachedFiles.length === 0) {
      return
    }

    if (!selectedChannel) {
      return
    }

    if (!user) {
      alert(ALERT_MESSAGES.LOGIN_REQUIRED)
      return
    }

    try {
      const uploadedAttachments =
        attachedFiles.length > 0 ? await uploadFiles(selectedChannel.id) : undefined

      // 傳入 parentMessageId 來發送回覆訊息
      await handleSendMessage(
        selectedChannel.id,
        messageText,
        uploadedAttachments,
        parentMessageId || undefined
      )

      setMessageText('')
      clearFiles()
    } catch (error) {
      alert(ALERT_MESSAGES.SEND_FAILED)
    }
  }

  const handleReactionClick = (messageId: string, emoji: string) => {
    handleReaction(messageId, emoji, currentMessages)
  }

  const handleDeleteMessageClick = async (messageId: string) => {
    await handleDeleteMessage(messageId)
  }

  return {
    handleSubmitMessage,
    handleReactionClick,
    handleDeleteMessageClick,
  }
}
