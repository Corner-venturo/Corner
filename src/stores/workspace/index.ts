// Unified workspace store - combines all workspace stores with backward compatibility

// 🔥 使用新的 Facade (基於 createStore)
import { useChannelsStore } from './channels-store'
import { useChatStore } from './chat-store'
import { useMembersStore } from './members-store'
import { useWidgetsStore } from './widgets-store'
import { useCanvasStore } from './canvas-store'

// Re-export all types
export * from './types'

// Re-export individual stores
export { useChannelsStore } from './channels-store'
export { useChatStore } from './chat-store'
export { useMembersStore } from './members-store'
export { useWidgetsStore } from './widgets-store'
export { useCanvasStore } from './canvas-store'

/**
 * Selective subscription hooks - use these for better performance
 * These hooks subscribe only to the specific store needed by the component
 */

/**
 * Hook for channel-related operations
 * Use this when component only needs channels, groups, and channel management
 */
export const useWorkspaceChannels = () => {
  const channelsStore = useChannelsStore()
  return {
    // State
    workspaces: channelsStore.workspaces,
    currentWorkspace: channelsStore.currentWorkspace,
    bulletins: channelsStore.bulletins,
    channels: channelsStore.channels,
    channelGroups: channelsStore.channelGroups,
    selectedChannel: channelsStore.selectedChannel,
    currentChannel: channelsStore.currentChannel,
    searchQuery: channelsStore.searchQuery,
    channelFilter: channelsStore.channelFilter,
    loading: channelsStore.loading,
    error: channelsStore.error,

    // Actions
    loadWorkspaces: channelsStore.loadWorkspaces,
    setCurrentWorkspace: channelsStore.setCurrentWorkspace,
    loadBulletins: channelsStore.loadBulletins,
    createBulletin: channelsStore.createBulletin,
    updateBulletin: channelsStore.updateBulletin,
    deleteBulletin: channelsStore.deleteBulletin,
    loadChannels: channelsStore.loadChannels,
    createChannel: channelsStore.createChannel,
    updateChannel: channelsStore.updateChannel,
    deleteChannel: channelsStore.deleteChannel,
    toggleChannelFavorite: channelsStore.toggleChannelFavorite,
    loadChannelGroups: channelsStore.loadChannelGroups,
    createChannelGroup: channelsStore.createChannelGroup,
    deleteChannelGroup: channelsStore.deleteChannelGroup,
    toggleGroupCollapse: channelsStore.toggleGroupCollapse,
    setSearchQuery: channelsStore.setSearchQuery,
    setChannelFilter: channelsStore.setChannelFilter,
    updateChannelOrder: channelsStore.updateChannelOrder,
    reorderChannels: channelsStore.reorderChannels,
    selectChannel: channelsStore.selectChannel,
    clearError: channelsStore.clearError,
  }
}

/**
 * Hook for chat/message operations
 * Use this when component only needs messages and chat functionality
 */
export const useWorkspaceChat = () => {
  const chatStore = useChatStore()
  return {
    // State
    messages: chatStore.messages,
    channelMessages: chatStore.channelMessages,
    messagesLoading: chatStore.messagesLoading,

    // Actions
    loadMessages: chatStore.loadMessages,
    sendMessage: chatStore.sendMessage,
    addMessage: chatStore.addMessage,
    updateMessage: chatStore.updateMessage,
    deleteMessage: chatStore.deleteMessage,
    softDeleteMessage: chatStore.softDeleteMessage,
    togglePinMessage: chatStore.togglePinMessage,
    addReaction: chatStore.addReaction,
    updateMessageReactions: chatStore.updateMessageReactions,
    clearMessages: chatStore.clearMessages,
    setCurrentChannelMessages: chatStore.setCurrentChannelMessages,
  }
}

/**
 * Hook for channel members management
 * Use this when component only needs member information and operations
 */
export const useWorkspaceMembers = () => {
  const membersStore = useMembersStore()
  return {
    // State
    channelMembers: membersStore.channelMembers,
    error: membersStore.error,

    // Actions
    loadChannelMembers: membersStore.loadChannelMembers,
    removeChannelMember: membersStore.removeChannelMember,
    clearError: membersStore.clearError,
  }
}

/**
 * Hook for widgets (advance lists and shared orders)
 * Use this when component only needs widget functionality
 */
export const useWorkspaceWidgets = () => {
  const widgetsStore = useWidgetsStore()
  return {
    // State
    advanceLists: widgetsStore.advanceLists,
    sharedOrderLists: widgetsStore.sharedOrderLists,
    loading: widgetsStore.loading,

    // Actions
    shareAdvanceList: widgetsStore.shareAdvanceList,
    processAdvanceItem: widgetsStore.processAdvanceItem,
    updateAdvanceStatus: widgetsStore.updateAdvanceStatus,
    loadAdvanceLists: widgetsStore.loadAdvanceLists,
    deleteAdvanceList: widgetsStore.deleteAdvanceList,
    shareOrderList: widgetsStore.shareOrderList,
    updateOrderReceiptStatus: widgetsStore.updateOrderReceiptStatus,
    loadSharedOrderLists: widgetsStore.loadSharedOrderLists,
    clearWidgets: widgetsStore.clearWidgets,
  }
}

/**
 * Hook for canvas and documents
 * Use this when component only needs canvas/document functionality
 */
export const useWorkspaceCanvas = () => {
  const canvasStore = useCanvasStore()
  return {
    // State
    personalCanvases: canvasStore.personalCanvases,
    richDocuments: canvasStore.richDocuments,
    activeCanvasTab: canvasStore.activeCanvasTab,

    // Actions
    createPersonalCanvas: canvasStore.createPersonalCanvas,
    loadPersonalCanvases: canvasStore.loadPersonalCanvases,
    setActiveCanvasTab: canvasStore.setActiveCanvasTab,
    loadRichDocuments: canvasStore.loadRichDocuments,
    createRichDocument: canvasStore.createRichDocument,
    updateRichDocument: canvasStore.updateRichDocument,
    deleteRichDocument: canvasStore.deleteRichDocument,
  }
}

/**
 * Unified workspace store hook - LEGACY, maintains backward compatibility
 * For new code, prefer using the selective hooks above for better performance
 * This combines all workspace stores into a single interface
 */
export const useWorkspaceStore = () => {
  const channelsStore = useChannelsStore()
  const chatStore = useChatStore()
  const membersStore = useMembersStore()
  const widgetsStore = useWidgetsStore()
  const canvasStore = useCanvasStore()

  return {
    // Workspaces & Channels
    workspaces: channelsStore.workspaces,
    currentWorkspace: channelsStore.currentWorkspace,
    bulletins: channelsStore.bulletins,
    channels: channelsStore.channels,
    channelGroups: channelsStore.channelGroups,
    selectedChannel: channelsStore.selectedChannel,
    currentChannel: channelsStore.currentChannel,
    searchQuery: channelsStore.searchQuery,
    channelFilter: channelsStore.channelFilter,

    loadWorkspaces: channelsStore.loadWorkspaces,
    setCurrentWorkspace: channelsStore.setCurrentWorkspace,
    loadBulletins: channelsStore.loadBulletins,
    createBulletin: channelsStore.createBulletin,
    updateBulletin: channelsStore.updateBulletin,
    deleteBulletin: channelsStore.deleteBulletin,
    loadChannels: channelsStore.loadChannels,
    createChannel: channelsStore.createChannel,
    updateChannel: channelsStore.updateChannel,
    deleteChannel: channelsStore.deleteChannel,
    toggleChannelFavorite: channelsStore.toggleChannelFavorite,
    loadChannelGroups: channelsStore.loadChannelGroups,
    createChannelGroup: channelsStore.createChannelGroup,
    deleteChannelGroup: channelsStore.deleteChannelGroup,
    toggleGroupCollapse: channelsStore.toggleGroupCollapse,
    setSearchQuery: channelsStore.setSearchQuery,
    setChannelFilter: channelsStore.setChannelFilter,
    updateChannelOrder: channelsStore.updateChannelOrder,
    reorderChannels: channelsStore.reorderChannels,

    // Channel selection with coordinated state
    selectChannel: async (channel: typeof channelsStore.selectedChannel) => {
      await channelsStore.selectChannel(channel)

      if (channel) {
        // Load data for the selected channel
        await chatStore.loadMessages(channel.id)
        await widgetsStore.loadAdvanceLists(channel.id)
        await widgetsStore.loadSharedOrderLists(channel.id)

        // Update chat store's current messages
        const messages = chatStore.channelMessages[channel.id] || []
        chatStore.setCurrentChannelMessages(channel.id, messages)
      } else {
        // Clear messages when no channel selected
        chatStore.clearMessages()
        widgetsStore.clearWidgets()
      }
    },

    // Chat & Messages
    messages: chatStore.messages,
    channelMessages: chatStore.channelMessages,
    messagesLoading: chatStore.messagesLoading,

    loadMessages: chatStore.loadMessages,
    sendMessage: chatStore.sendMessage,
    addMessage: chatStore.addMessage,
    updateMessage: chatStore.updateMessage,
    deleteMessage: chatStore.deleteMessage,
    softDeleteMessage: chatStore.softDeleteMessage,
    togglePinMessage: chatStore.togglePinMessage,
    addReaction: chatStore.addReaction,
    updateMessageReactions: chatStore.updateMessageReactions,

    // Members
    channelMembers: membersStore.channelMembers,
    loadChannelMembers: membersStore.loadChannelMembers,
    removeChannelMember: membersStore.removeChannelMember,

    // Widgets (Advance Lists & Shared Orders)
    advanceLists: widgetsStore.advanceLists,
    sharedOrderLists: widgetsStore.sharedOrderLists,

    shareAdvanceList: widgetsStore.shareAdvanceList,
    processAdvanceItem: widgetsStore.processAdvanceItem,
    updateAdvanceStatus: widgetsStore.updateAdvanceStatus,
    loadAdvanceLists: widgetsStore.loadAdvanceLists,
    deleteAdvanceList: widgetsStore.deleteAdvanceList,
    shareOrderList: widgetsStore.shareOrderList,
    updateOrderReceiptStatus: widgetsStore.updateOrderReceiptStatus,
    loadSharedOrderLists: widgetsStore.loadSharedOrderLists,

    // Canvas & Documents
    personalCanvases: canvasStore.personalCanvases,
    richDocuments: canvasStore.richDocuments,
    activeCanvasTab: canvasStore.activeCanvasTab,

    createPersonalCanvas: canvasStore.createPersonalCanvas,
    loadPersonalCanvases: canvasStore.loadPersonalCanvases,
    setActiveCanvasTab: canvasStore.setActiveCanvasTab,
    loadRichDocuments: canvasStore.loadRichDocuments,
    createRichDocument: canvasStore.createRichDocument,
    updateRichDocument: canvasStore.updateRichDocument,
    deleteRichDocument: canvasStore.deleteRichDocument,

    // Combined state
    loading: channelsStore.loading || widgetsStore.loading,
    error: channelsStore.error || membersStore.error,
    clearError: () => {
      channelsStore.clearError()
      membersStore.clearError()
    },
  }
}
