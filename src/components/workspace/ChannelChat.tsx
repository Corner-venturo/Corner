'use client'

import { Hash } from 'lucide-react'
import { ChannelSidebar } from './ChannelSidebar'
import { ChannelTabs } from './ChannelTabs'
import { useChannelChat } from './channel-chat/useChannelChat'
import { ChatHeader } from './channel-chat/ChatHeader'
import { ChatMessages } from './channel-chat/ChatMessages'
import { DialogsContainer } from './channel-chat/DialogsContainer'

export function ChannelChat() {
  const {
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
  } = useChannelChat()

  if (loading && channels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="h-full flex overflow-hidden border border-border rounded-lg bg-card shadow-sm">
      <ChannelSidebar
        selectedChannelId={selectedChannel?.id || null}
        onSelectChannel={handleChannelSwitch}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {selectedChannel ? (
          <ChannelTabs
            channel={selectedChannel}
            headerActions={
              <ChatHeader
                showMemberSidebar={showMemberSidebar}
                onToggleMemberSidebar={() => setShowMemberSidebar(!showMemberSidebar)}
              />
            }
          >
            <ChatMessages
              messages={currentMessages || []}
              advanceLists={advanceLists}
              sharedOrderLists={sharedOrderLists}
              channelName={selectedChannel.name}
              currentUserId={user?.id}
              isLoading={isMessagesLoading}
              showMemberSidebar={showMemberSidebar}
              messageText={messageText}
              attachedFiles={attachedFiles}
              uploadingFiles={uploadingFiles}
              uploadProgress={uploadProgress}
              messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
              onReaction={handleReactionClick}
              onDeleteMessage={handleDeleteMessageClick}
              onCreatePayment={(itemId, item) => {
                setSelectedAdvanceItem(item as Parameters<typeof setSelectedAdvanceItem>[0])
                setSelectedAdvanceListId(
                  advanceLists.find(al => al.items?.some(i => i.id === itemId))?.id || ''
                )
                setShowCreatePaymentDialog(true)
              }}
              onDeleteAdvanceList={deleteAdvanceList}
              onCreateReceipt={(_orderId, order) => {
                setSelectedOrder(order as Parameters<typeof setSelectedOrder>[0])
                setShowCreateReceiptDialog(true)
              }}
              onMessageChange={setMessageText}
              onSubmit={handleSubmitMessage}
              onFilesChange={setAttachedFiles}
              onShowShareOrders={() => setShowShareOrdersDialog(true)}
              onShowShareQuote={() => setShowShareQuoteDialog(true)}
              onShowNewPayment={() => setShowNewPaymentDialog(true)}
              onShowNewReceipt={() => setShowNewReceiptDialog(true)}
              onShowShareAdvance={() => setShowShareAdvanceDialog(true)}
              onShowNewTask={() => setShowNewTaskDialog(true)}
            />
          </ChannelTabs>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash size={48} className="text-morandi-secondary/50 mx-auto mb-4" />
              <p className="text-morandi-secondary">選擇一個頻道開始對話</p>
            </div>
          </div>
        )}
      </div>

      <DialogsContainer
        showShareAdvanceDialog={showShareAdvanceDialog}
        setShowShareAdvanceDialog={setShowShareAdvanceDialog}
        selectedChannel={selectedChannel}
        user={user}
        showShareOrdersDialog={showShareOrdersDialog}
        setShowShareOrdersDialog={setShowShareOrdersDialog}
        onShareOrdersSuccess={() => {
          setShowShareOrdersDialog(false)
          if (selectedChannel?.id) {
            loadSharedOrderLists(selectedChannel.id)
          }
        }}
        showCreateReceiptDialog={showCreateReceiptDialog}
        setShowCreateReceiptDialog={setShowCreateReceiptDialog}
        selectedOrder={selectedOrder}
        setSelectedOrder={setSelectedOrder}
        showCreatePaymentDialog={showCreatePaymentDialog}
        setShowCreatePaymentDialog={setShowCreatePaymentDialog}
        selectedAdvanceItem={selectedAdvanceItem}
        setSelectedAdvanceItem={setSelectedAdvanceItem}
        selectedAdvanceListId={selectedAdvanceListId}
        setSelectedAdvanceListId={setSelectedAdvanceListId}
        onCreatePaymentSuccess={() => {
          setShowCreatePaymentDialog(false)
          setSelectedAdvanceItem(null)
          setSelectedAdvanceListId('')
          if (selectedChannel?.id) {
            // advanceLists; // This was an unused expression
          }
        }}
        showSettingsDialog={showSettingsDialog}
        setShowSettingsDialog={setShowSettingsDialog}
        editChannelName={editChannelName}
        setEditChannelName={setEditChannelName}
        editChannelDescription={editChannelDescription}
        setEditChannelDescription={setEditChannelDescription}
        onDeleteChannel={handleDeleteChannel}
        onUpdateChannel={handleUpdateChannel}
        showShareQuoteDialog={showShareQuoteDialog}
        setShowShareQuoteDialog={setShowShareQuoteDialog}
        showShareTourDialog={showShareTourDialog}
        setShowShareTourDialog={setShowShareTourDialog}
        showNewPaymentDialog={showNewPaymentDialog}
        setShowNewPaymentDialog={setShowNewPaymentDialog}
        showNewReceiptDialog={showNewReceiptDialog}
        setShowNewReceiptDialog={setShowNewReceiptDialog}
        showNewTaskDialog={showNewTaskDialog}
        setShowNewTaskDialog={setShowNewTaskDialog}
      />
    </div>
  )
}
