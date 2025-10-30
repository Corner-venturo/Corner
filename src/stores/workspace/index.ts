// Unified workspace store - combines all workspace stores with backward compatibility

import { useChannelsStore } from './channels-store';
import { useChatStore } from './chat-store';
import { useMembersStore } from './members-store';
import { useWidgetsStore } from './widgets-store';
import { useCanvasStore } from './canvas-store';

// Re-export all types
export * from './types';

// Re-export individual stores
export { useChannelsStore } from './channels-store';
export { useChatStore } from './chat-store';
export { useMembersStore } from './members-store';
export { useWidgetsStore } from './widgets-store';
export { useCanvasStore } from './canvas-store';

/**
 * Unified workspace store hook - maintains backward compatibility
 * This combines all workspace stores into a single interface
 */
export const useWorkspaceStore = () => {
  const channelsStore = useChannelsStore();
  const chatStore = useChatStore();
  const membersStore = useMembersStore();
  const widgetsStore = useWidgetsStore();
  const canvasStore = useCanvasStore();

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
    toggleGroupCollapse: channelsStore.toggleGroupCollapse,
    setSearchQuery: channelsStore.setSearchQuery,
    setChannelFilter: channelsStore.setChannelFilter,
    updateChannelOrder: channelsStore.updateChannelOrder,
    reorderChannels: channelsStore.reorderChannels,

    // Channel selection with coordinated state
    selectChannel: async (channel: typeof channelsStore.selectedChannel) => {
      await channelsStore.selectChannel(channel);

      if (channel) {
        // Load data for the selected channel
        await chatStore.loadMessages(channel.id);
        await widgetsStore.loadAdvanceLists(channel.id);
        await widgetsStore.loadSharedOrderLists(channel.id);

        // Update chat store's current messages
        const messages = chatStore.channelMessages[channel.id] || [];
        chatStore.setCurrentChannelMessages(channel.id, messages);
      } else {
        // Clear messages when no channel selected
        chatStore.clearMessages();
        widgetsStore.clearWidgets();
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
      channelsStore.clearError();
      membersStore.clearError();
    },
  };
};
