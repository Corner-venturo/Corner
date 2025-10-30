'use client'

import { forwardRef } from 'react'
import type { Message, AdvanceList, SharedOrderList } from '@/stores/workspace-store'
import { MessageItem } from './MessageItem'
import { EmptyState } from './EmptyState'
import { AdvanceListCard } from '../AdvanceListCard'
import { OrderListCard } from '../OrderListCard'

interface MessageListProps {
  messages: Message[]
  advanceLists: AdvanceList[]
  sharedOrderLists: SharedOrderList[]
  channelName: string
  currentUserId?: string
  isLoading: boolean
  onReaction: (messageId: string, emoji: string) => void
  onDeleteMessage: (messageId: string) => void
  onCreatePayment?: (itemId: string, item: unknown) => void
  onDeleteAdvanceList?: (listId: string) => void
  onCreateReceipt?: (orderId: string, order: unknown) => void
  messagesEndRef: React.RefObject<HTMLDivElement>
  theme: {
    colors: {
      surface: string
    }
    spacing: {
      lg: string
    }
  }
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(function MessageList(
  {
    messages,
    advanceLists,
    sharedOrderLists,
    channelName,
    currentUserId,
    isLoading,
    onReaction,
    onDeleteMessage,
    onCreatePayment,
    onDeleteAdvanceList,
    onCreateReceipt,
    messagesEndRef,
    theme,
  },
  ref
) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="animate-spin w-6 h-6 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const hasNoContent =
    messages.length === 0 && advanceLists.length === 0 && sharedOrderLists.length === 0

  if (hasNoContent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <EmptyState channelName={channelName} />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto space-y-4 min-h-0 transition-opacity duration-150 bg-white p-6"
    >
      {messages.map(message => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          onReaction={onReaction}
          onDelete={onDeleteMessage}
        />
      ))}

      {/* 代墊清單卡片 */}
      {advanceLists.map(advanceList => (
        <AdvanceListCard
          key={advanceList.id}
          advanceList={advanceList}
          userName={advanceList.author?.display_name}
          currentUserId={currentUserId || ''}
          userRole="admin"
          onCreatePayment={onCreatePayment || (() => {})}
          onDelete={onDeleteAdvanceList || (() => {})}
        />
      ))}

      {/* 訂單列表卡片 */}
      {sharedOrderLists.map(orderList => (
        <OrderListCard
          key={orderList.id}
          orderList={orderList}
          userName={orderList.author?.display_name}
          currentUserId={currentUserId || ''}
          userRole="admin"
          onCreateReceipt={onCreateReceipt || (() => {})}
        />
      ))}

      <div ref={messagesEndRef} />
    </div>
  )
})
