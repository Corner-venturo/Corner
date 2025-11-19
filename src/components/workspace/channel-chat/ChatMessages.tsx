'use client'

import { MessageList, MessageInput, MemberSidebar } from '../chat'

// @ts-ignore - Theme placeholder
const theme = {}

interface ChannelChatMessagesProps {
  messages: any[]
  advanceLists: any[]
  sharedOrderLists: any[]
  channelName: string
  currentUserId?: string
  isLoading: boolean
  showMemberSidebar: boolean
  messageText: string
  attachedFiles: File[]
  uploadingFiles: string[]
  uploadProgress: Record<string, number>
  messagesEndRef: React.RefObject<HTMLDivElement>
  onReaction: (messageId: string, emoji: string) => void
  onDeleteMessage: (messageId: string) => Promise<void>
  onCreatePayment: (itemId: string, item: any) => void
  onDeleteAdvanceList: (listId: string) => Promise<void>
  onCreateReceipt: (orderId: string, order: any) => void
  onMessageChange: (text: string) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  onFilesChange: (files: File[]) => void
  onShowShareOrders: () => void
  onShowShareQuote: () => void
  onShowNewPayment: () => void
  onShowNewReceipt: () => void
  onShowShareAdvance: () => void
  onShowNewTask: () => void
}

export function ChatMessages({
  messages,
  advanceLists,
  sharedOrderLists,
  channelName,
  currentUserId,
  isLoading,
  showMemberSidebar,
  messageText,
  attachedFiles,
  uploadingFiles,
  uploadProgress,
  messagesEndRef,
  onReaction,
  onDeleteMessage,
  onCreatePayment,
  onDeleteAdvanceList,
  onCreateReceipt,
  onMessageChange,
  onSubmit,
  onFilesChange,
  onShowShareOrders,
  onShowShareQuote,
  onShowNewPayment,
  onShowNewReceipt,
  onShowShareAdvance,
  onShowNewTask,
}: ChannelChatMessagesProps) {
  return (
    <>
      <div className="flex-1 flex min-h-0">
        {/* @ts-ignore - MessageList props compatibility */}
        <MessageList
          messages={messages}
          advanceLists={advanceLists}
          sharedOrderLists={sharedOrderLists}
          channelName={channelName}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onReaction={onReaction}
          onDeleteMessage={onDeleteMessage}
          onCreatePayment={onCreatePayment}
          onDeleteAdvanceList={onDeleteAdvanceList}
          onCreateReceipt={onCreateReceipt}
          messagesEndRef={messagesEndRef}
          theme={theme}
        />

        <MemberSidebar isOpen={showMemberSidebar} />
      </div>

      <MessageInput
        channelName={channelName}
        value={messageText}
        onChange={onMessageChange}
        onSubmit={onSubmit}
        attachedFiles={attachedFiles}
        onFilesChange={onFilesChange}
        uploadingFiles={uploadingFiles}
        uploadProgress={uploadProgress}
        onShowShareOrders={onShowShareOrders}
        onShowShareQuote={onShowShareQuote}
        onShowNewPayment={onShowNewPayment}
        onShowNewReceipt={onShowNewReceipt}
        onShowShareAdvance={onShowShareAdvance}
        onShowNewTask={onShowNewTask}
      />
    </>
  )
}
