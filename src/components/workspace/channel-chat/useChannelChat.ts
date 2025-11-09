import { useState } from 'react'
import {
  useWorkspaceChannels,
  useWorkspaceChat,
  useWorkspaceWidgets,
} from '@/stores/workspace-store'
import { useMessageOperations, useFileUpload, useScrollToBottom } from '../chat'
import { useChatRealtime } from '@/hooks/useChatRealtime'
import {
  useDialogStates,
  useSelectionState,
  useChannelEditState,
  useChannelOperations,
  useChannelEffects,
  useMessageHandlers,
} from './hooks'

/**
 * Channel Chat 主 Hook
 *
 * 整合多個子 hooks 來管理頻道聊天的所有狀態和操作
 * 已重構為更小的、可重用的子 hooks
 */
export function useChannelChat() {
  // Basic state
  const [messageText, setMessageText] = useState('')
  const [showMemberSidebar, setShowMemberSidebar] = useState(false)

  // Dialog states (拆分到 useDialogStates)
  const dialogStates = useDialogStates()

  // Selection states (拆分到 useSelectionState)
  const selectionState = useSelectionState()

  // Use selective hooks for better performance
  const {
    channels,
    currentWorkspace,
    loading,
    selectedChannel,
    selectChannel,
    loadChannels,
    updateChannel,
    deleteChannel,
  } = useWorkspaceChannels()

  const { channelMessages, messagesLoading, loadMessages } = useWorkspaceChat()

  const {
    advanceLists,
    sharedOrderLists,
    loadAdvanceLists,
    loadSharedOrderLists,
    deleteAdvanceList,
  } = useWorkspaceWidgets()

  // Derived state
  const currentMessages =
    selectedChannel?.id && channelMessages?.[selectedChannel.id]
      ? channelMessages[selectedChannel.id]
      : []
  const isMessagesLoading = selectedChannel?.id
    ? (messagesLoading?.[selectedChannel.id] ?? false)
    : false

  // Edit state (拆分到 useChannelEditState)
  const editState = useChannelEditState(dialogStates.showSettingsDialog, selectedChannel)

  // Channel operations (拆分到 useChannelOperations)
  const channelOps = useChannelOperations(
    selectedChannel,
    selectChannel,
    updateChannel,
    deleteChannel,
    dialogStates.setShowSettingsDialog
  )

  // Message operations
  const { handleSendMessage, handleReaction, handleDeleteMessage, user } = useMessageOperations()
  const {
    attachedFiles,
    setAttachedFiles,
    uploadingFiles,
    uploadProgress,
    uploadFiles,
    clearFiles,
  } = useFileUpload()
  const { messagesEndRef } = useScrollToBottom(currentMessages?.length || 0)

  // Message handlers (拆分到 useMessageHandlers)
  const messageHandlers = useMessageHandlers(
    messageText,
    setMessageText,
    selectedChannel,
    user,
    attachedFiles,
    currentMessages,
    uploadFiles,
    clearFiles,
    handleSendMessage,
    handleReaction,
    handleDeleteMessage
  )

  // Realtime subscription for messages
  useChatRealtime(selectedChannel?.id)

  // Effects (拆分到 useChannelEffects)
  useChannelEffects(
    currentWorkspace,
    channels,
    selectedChannel,
    loadChannels,
    selectChannel,
    loadMessages,
    loadAdvanceLists,
    loadSharedOrderLists
  )

  return {
    // State
    messageText,
    setMessageText,
    showMemberSidebar,
    setShowMemberSidebar,
    isSwitching: channelOps.isSwitching,

    // Dialog state (從 useDialogStates)
    ...dialogStates,

    // Selected state (從 useSelectionState)
    ...selectionState,

    // Edit state (從 useChannelEditState)
    ...editState,

    // Store data
    channels,
    currentWorkspace,
    loading,
    selectedChannel,
    currentMessages,
    isMessagesLoading,
    advanceLists,
    sharedOrderLists,

    // Store actions
    loadSharedOrderLists,
    deleteAdvanceList,

    // Message operations
    user,
    attachedFiles,
    setAttachedFiles,
    uploadingFiles,
    uploadProgress,
    messagesEndRef,

    // Handlers (從 useMessageHandlers 和 useChannelOperations)
    handleSubmitMessage: messageHandlers.handleSubmitMessage,
    handleReactionClick: messageHandlers.handleReactionClick,
    handleDeleteMessageClick: messageHandlers.handleDeleteMessageClick,
    handleChannelSwitch: channelOps.handleChannelSwitch,
    handleDeleteChannel: channelOps.handleDeleteChannel,
    handleUpdateChannel: () =>
      channelOps.handleUpdateChannel(editState.editChannelName, editState.editChannelDescription),
  }
}
