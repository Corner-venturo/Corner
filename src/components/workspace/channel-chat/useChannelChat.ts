import { useState, useEffect } from 'react';
import { useWorkspaceChannels, useWorkspaceChat, useWorkspaceWidgets } from '@/stores/workspace-store';
import { useMessageOperations, useFileUpload, useScrollToBottom } from '../chat';
import { useChatRealtime } from '@/hooks/useChatRealtime';
import { DEFAULT_CHANNEL_NAME, CHANNEL_SWITCH_DELAY, ALERT_MESSAGES } from './constants';
import { UI_DELAYS } from '@/lib/constants/timeouts';

export function useChannelChat() {
  // State
  const [messageText, setMessageText] = useState('');
  const [showMemberSidebar, setShowMemberSidebar] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [showShareQuoteDialog, setShowShareQuoteDialog] = useState(false);
  const [showShareTourDialog, setShowShareTourDialog] = useState(false);
  const [showNewPaymentDialog, setShowNewPaymentDialog] = useState(false);
  const [showNewReceiptDialog, setShowNewReceiptDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showShareAdvanceDialog, setShowShareAdvanceDialog] = useState(false);
  const [showShareOrdersDialog, setShowShareOrdersDialog] = useState(false);
  const [showCreateReceiptDialog, setShowCreateReceiptDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<unknown>(null);
  const [selectedAdvanceItem, setSelectedAdvanceItem] = useState<unknown>(null);
  const [selectedAdvanceListId, setSelectedAdvanceListId] = useState<string>('');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');
  const [editChannelDescription, setEditChannelDescription] = useState('');

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
  } = useWorkspaceChannels();

  const {
    channelMessages,
    messagesLoading,
    loadMessages,
  } = useWorkspaceChat();

  const {
    advanceLists,
    sharedOrderLists,
    loadAdvanceLists,
    loadSharedOrderLists,
    deleteAdvanceList,
  } = useWorkspaceWidgets();

  // Derived state
  const currentMessages = selectedChannel?.id && channelMessages?.[selectedChannel.id]
    ? channelMessages[selectedChannel.id]
    : [];
  const isMessagesLoading = selectedChannel?.id
    ? (messagesLoading?.[selectedChannel.id] ?? false)
    : false;

  // Hooks
  const { handleSendMessage, handleReaction, handleDeleteMessage, user } = useMessageOperations();
  const { attachedFiles, setAttachedFiles, uploadingFiles, uploadProgress, uploadFiles, clearFiles } = useFileUpload();
  const { messagesEndRef } = useScrollToBottom(currentMessages?.length || 0);

  // Realtime subscription for messages
  useChatRealtime(selectedChannel?.id);

  // Effects
  useEffect(() => {
    if (currentWorkspace?.id) {
      loadChannels(currentWorkspace.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace?.id]);

  useEffect(() => {
    if (channels.length > 0 && !selectedChannel) {
      const defaultChannel = channels.find(c => c.name === DEFAULT_CHANNEL_NAME) || channels[0];
      selectChannel(defaultChannel);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.length, selectedChannel?.id]);

  useEffect(() => {
    if (showSettingsDialog && selectedChannel) {
      setEditChannelName(selectedChannel.name);
      setEditChannelDescription(selectedChannel.description || '');
    }
  }, [showSettingsDialog, selectedChannel]);

  useEffect(() => {
    if (!selectedChannel?.id) {
      return;
    }

    Promise.all([
      loadMessages(selectedChannel.id),
      loadAdvanceLists(selectedChannel.id),
      loadSharedOrderLists(selectedChannel.id)
    ]).catch((error) => {
      // Silent error handling
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannel?.id]);

  // Handlers
  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim() && attachedFiles.length === 0) {
      return;
    }

    if (!selectedChannel) {
      return;
    }

    if (!user) {
      alert(ALERT_MESSAGES.LOGIN_REQUIRED);
      return;
    }

    try {
      const uploadedAttachments = attachedFiles.length > 0
        ? await uploadFiles(selectedChannel.id)
        : undefined;

      await handleSendMessage(selectedChannel.id, messageText, uploadedAttachments);

      setMessageText('');
      clearFiles();
    } catch (error) {
      alert(ALERT_MESSAGES.SEND_FAILED);
    }
  };

  const handleReactionClick = (messageId: string, emoji: string) => {
    handleReaction(messageId, emoji, currentMessages);
  };

  const handleDeleteMessageClick = async (messageId: string) => {
    await handleDeleteMessage(messageId);
  };

  const handleChannelSwitch = (channel: typeof selectedChannel) => {
    if (selectedChannel?.id !== channel?.id) {
      setIsSwitching(true);

      setTimeout(() => {
        selectChannel(channel);

        setTimeout(() => setIsSwitching(false), UI_DELAYS.FAST_FEEDBACK);
      }, CHANNEL_SWITCH_DELAY);
    }
  };

  const handleDeleteChannel = async () => {
    if (!selectedChannel) {
      return;
    }

    const confirmed = confirm(`${ALERT_MESSAGES.DELETE_CHANNEL_CONFIRM.replace('頻道', `#${selectedChannel.name} 頻道`)}`);

    if (confirmed) {
      try {
        await deleteChannel(selectedChannel.id);
        selectChannel(null);
        setShowSettingsDialog(false);
        alert(ALERT_MESSAGES.CHANNEL_DELETED);
      } catch (error) {
        alert(ALERT_MESSAGES.DELETE_FAILED);
      }
    }
  };

  const handleUpdateChannel = async () => {
    if (!selectedChannel) {
      return;
    }

    if (!editChannelName.trim()) {
      alert(ALERT_MESSAGES.CHANNEL_NAME_REQUIRED);
      return;
    }

    try {
      await updateChannel(selectedChannel.id, {
        name: editChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: editChannelDescription.trim() || undefined
      });
      setShowSettingsDialog(false);
      alert(ALERT_MESSAGES.UPDATE_SUCCESS);
    } catch (error) {
      alert(ALERT_MESSAGES.UPDATE_FAILED);
    }
  };

  return {
    // State
    messageText,
    setMessageText,
    showMemberSidebar,
    setShowMemberSidebar,
    isSwitching,

    // Dialog state
    showShareQuoteDialog,
    setShowShareQuoteDialog,
    showShareTourDialog,
    setShowShareTourDialog,
    showNewPaymentDialog,
    setShowNewPaymentDialog,
    showNewReceiptDialog,
    setShowNewReceiptDialog,
    showNewTaskDialog,
    setShowNewTaskDialog,
    showShareAdvanceDialog,
    setShowShareAdvanceDialog,
    showShareOrdersDialog,
    setShowShareOrdersDialog,
    showCreateReceiptDialog,
    setShowCreateReceiptDialog,
    showCreatePaymentDialog,
    setShowCreatePaymentDialog,
    showSettingsDialog,
    setShowSettingsDialog,

    // Selected state
    selectedOrder,
    setSelectedOrder,
    selectedAdvanceItem,
    setSelectedAdvanceItem,
    selectedAdvanceListId,
    setSelectedAdvanceListId,

    // Edit state
    editChannelName,
    setEditChannelName,
    editChannelDescription,
    setEditChannelDescription,

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

    // Handlers
    handleSubmitMessage,
    handleReactionClick,
    handleDeleteMessageClick,
    handleChannelSwitch,
    handleDeleteChannel,
    handleUpdateChannel,
  };
}
