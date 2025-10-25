import { useCallback } from 'react';
import { useWorkspaceStore } from '@/stores/workspace-store';
import { useAuthStore } from '@/stores/auth-store';
import type { MessageAttachment } from '@/stores/workspace-store';

export function useMessageOperations() {
  const { sendMessage, updateMessageReactions, deleteMessage } = useWorkspaceStore();
  const { user, currentProfile } = useAuthStore();

  const handleSendMessage = useCallback(
    async (
      channelId: string,
      content: string,
      attachments?: MessageAttachment[]
    ) => {
      if (!user) {
        throw new Error('用戶未登入');
      }

      await sendMessage({
        channel_id: channelId,
        author_id: user.id,
        content: content.trim() || '（傳送了附件）',
        author: {
          id: user.id,
          display_name: currentProfile?.display_name || user.display_name || '未知用戶',
          avatar: undefined
        },
        attachments
      });
    },
    [user, currentProfile, sendMessage]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string, messages: any[]) => {
      if (!user) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = { ...message.reactions };
      if (!currentReactions[emoji]) {
        currentReactions[emoji] = [];
      }

      const userIndex = currentReactions[emoji].indexOf(user.id);
      if (userIndex > -1) {
        currentReactions[emoji].splice(userIndex, 1);
        if (currentReactions[emoji].length === 0) {
          delete currentReactions[emoji];
        }
      } else {
        currentReactions[emoji].push(user.id);
      }

      await updateMessageReactions(messageId, currentReactions);
    },
    [user, updateMessageReactions]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId);
    },
    [deleteMessage]
  );

  return {
    handleSendMessage,
    handleReaction,
    handleDeleteMessage,
    user,
    currentProfile
  };
}
