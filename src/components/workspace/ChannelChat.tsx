'use client'

import { Hash } from 'lucide-react'
import { ChannelSidebar } from './ChannelSidebar'
import { ChannelTabs } from './ChannelTabs'
import { useChannelChat } from './channel-chat/useChannelChat'
import { ChatHeader } from './channel-chat/ChatHeader'
import { ChatMessages } from './channel-chat/ChatMessages'
import { DialogsContainer } from './channel-chat/DialogsContainer'
import { ThreadPanel } from './channel-chat/ThreadPanel'
import { useTravelerMode } from './channel-chat/useTravelerMode'
import { TravelerMessageList } from './channel-chat/TravelerMessageList'
import { QuickMessages } from './channel-chat/QuickMessages'
import { TravelerMessageInput } from './channel-chat/TravelerMessageInput'
import { cn } from '@/lib/utils'

export function ChannelChat() {
  const {
    // State
    messageText,
    setMessageText,
    threadMessageText,
    setThreadMessageText,
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

    // Slack 風格討論串狀態
    activeThreadMessage,
    threadReplies,
    isThreadPanelOpen,
    openThread,
    closeThread,
    getReplyCount,

    // Store data
    channels,
    loading,
    selectedChannel,
    currentMessages,
    isMessagesLoading,
    advanceLists,
    sharedOrderLists,
    isAdmin, // Get isAdmin from the hook

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
    handleThreadSubmitMessage,
    handleChannelSwitch,
    handleDeleteChannel,
    handleUpdateChannel,
  } = useChannelChat()

  // 旅伴模式 Hook
  const travelerMode = useTravelerMode(selectedChannel?.tour_id || null)

  if (loading && channels.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div
      className={cn('h-full flex overflow-hidden', travelerMode.mode === 'traveler' ? 'bg-[#1e1b2e]' : 'bg-card')}
      data-chat-mode={travelerMode.mode}
    >
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
                tourId={selectedChannel.tour_id}
                // 旅伴模式相關
                mode={travelerMode.mode}
                onModeChange={travelerMode.setMode}
                activeConversationType={travelerMode.activeConversationType}
                onConversationTypeChange={travelerMode.setActiveConversationType}
                unreadCount={travelerMode.totalUnreadCount}
                isConversationOpen={travelerMode.conversation?.is_open}
              />
            }
          >
            {/* 根據模式顯示不同內容 */}
            {travelerMode.mode === 'traveler' ? (
              // 旅伴群組模式
              <div className="flex-1 flex flex-col overflow-hidden">
                <TravelerMessageList
                  messages={travelerMode.messages}
                  travelers={travelerMode.travelers}
                  employees={travelerMode.employees}
                  isLoading={travelerMode.isMessagesLoading}
                  conversationType={travelerMode.activeConversationType}
                  isConversationOpen={travelerMode.conversation?.is_open ?? false}
                  onToggleOpen={async (isOpen) => {
                    await travelerMode.toggleConversation(isOpen)
                  }}
                  currentUserId={user?.id}
                />
                {travelerMode.conversation?.is_open && (
                  <TravelerMessageInput
                    onSend={travelerMode.sendMessage}
                    disabled={!travelerMode.selectedConversationId}
                    placeholder={
                      travelerMode.activeConversationType === 'tour_announcement'
                        ? '發送公告給所有旅客...'
                        : '回覆客服訊息...'
                    }
                  />
                )}
              </div>
            ) : (
              // 內部頻道模式
              <ChatMessages
                channel={selectedChannel}
                isAdmin={isAdmin}
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
                onReply={openThread}
                getReplyCount={getReplyCount}
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
            )}
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

      {/* Slack 風格討論串側邊面板 */}
      {isThreadPanelOpen && activeThreadMessage && (
        <ThreadPanel
          parentMessage={activeThreadMessage}
          replies={threadReplies}
          onClose={closeThread}
          onSubmit={handleThreadSubmitMessage}
          messageText={threadMessageText}
          onMessageChange={setThreadMessageText}
          currentUserId={user?.id}
        />
      )}

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