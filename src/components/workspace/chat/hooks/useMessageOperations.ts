import { useCallback } from 'react'
import { useWorkspaceChat } from '@/stores/workspace-store'
import { useAuthStore } from '@/stores/auth-store'
import type { MessageAttachment } from '@/stores/workspace-store'
import type { Message } from '@/stores/workspace/types'
import { COMP_WORKSPACE_LABELS } from '../../constants/labels'

export function useMessageOperations() {
  const { sendMessage, updateMessageReactions, deleteMessage } = useWorkspaceChat()
  const { user } = useAuthStore()

  const handleSendMessage = useCallback(
    async (channelId: string, content: string, attachments?: MessageAttachment[], parentMessageId?: string) => {
      if (!user) {
        throw new Error(COMP_WORKSPACE_LABELS.用戶未登入)
      }

      await sendMessage({
        channel_id: channelId,
        author_id: user.id,
        content: content.trim() || COMP_WORKSPACE_LABELS.傳送了附件,
        author: {
          id: user.id,
          display_name: user.display_name || COMP_WORKSPACE_LABELS.未知用戶,
          avatar: undefined,
        },
        attachments,
        parent_message_id: parentMessageId || null,
      })
    },
    [user, sendMessage]
  )

  const handleReaction = useCallback(
    async (messageId: string, emoji: string, messages: Message[]) => {
      if (!user) return

      const message = messages.find(m => m.id === messageId)
      if (!message) return

      const currentReactions = { ...message.reactions }
      if (!currentReactions[emoji]) {
        currentReactions[emoji] = []
      }

      const userIndex = currentReactions[emoji].indexOf(user.id)
      if (userIndex > -1) {
        currentReactions[emoji].splice(userIndex, 1)
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji]
        }
      } else {
        currentReactions[emoji].push(user.id)
      }

      await updateMessageReactions(messageId, currentReactions)
    },
    [user, updateMessageReactions]
  )

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId)
    },
    [deleteMessage]
  )

  return {
    handleSendMessage,
    handleReaction,
    handleDeleteMessage,
    user,
  }
}
