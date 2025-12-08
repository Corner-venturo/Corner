'use client'

import { forwardRef, useMemo } from 'react'
import { Virtuoso } from 'react-virtuoso'
import type { Message, AdvanceList, SharedOrderList } from '@/stores/workspace-store'
import { useEmployeeStore } from '@/stores'
import { MessageItem } from './MessageItem'
import { EmptyState } from './EmptyState'
import { AdvanceListCard } from '../AdvanceListCard'
import { OrderListCard } from '../OrderListCard'

type ListItem =
  | { type: 'message'; data: Message }
  | { type: 'advanceList'; data: AdvanceList }
  | { type: 'orderList'; data: SharedOrderList }

interface MessageListProps {
  messages: Message[]
  advanceLists: AdvanceList[]
  sharedOrderLists: SharedOrderList[]
  channelName: string
  currentUserId?: string
  isLoading: boolean
  onReaction: (messageId: string, emoji: string) => void
  onDeleteMessage: (messageId: string) => void
  onReply?: (message: Message) => void
  getReplyCount?: (messageId: string) => number
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
    onReply,
    getReplyCount,
    onCreatePayment,
    onDeleteAdvanceList,
    onCreateReceipt,
    messagesEndRef,
    theme,
  },
  ref
) {
  const employees = useEmployeeStore(state => state.items) || []

  // 根據 created_by 查找員工名字
  const getEmployeeName = (userId: string) => {
    const employee = employees.find(e => e.id === userId)
    return employee?.display_name || employee?.name || '未知'
  }

  // 合併所有項目為單一列表（必須在 early return 之前）
  const allItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [
      ...messages.map(msg => ({ type: 'message' as const, data: msg })),
      ...advanceLists.map(list => ({ type: 'advanceList' as const, data: list })),
      ...sharedOrderLists.map(list => ({ type: 'orderList' as const, data: list })),
    ]
    return items
  }, [messages, advanceLists, sharedOrderLists])

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
    <div ref={ref} className="flex-1 bg-white" style={{ height: '100%' }}>
      <Virtuoso
        data={allItems}
        followOutput="smooth"
        className="p-6"
        itemContent={(index, item) => {
          // 為每個項目添加間距
          const itemElement = (() => {
            switch (item.type) {
              case 'message':
                return (
                  <MessageItem
                    key={item.data.id}
                    message={item.data}
                    currentUserId={currentUserId}
                    onReaction={onReaction}
                    onDelete={onDeleteMessage}
                    onReply={onReply}
                    replyCount={getReplyCount?.(item.data.id) ?? 0}
                  />
                )
              case 'advanceList':
                return (
                  <AdvanceListCard
                    key={item.data.id}
                    advanceList={item.data}
                    userName={item.data.author?.display_name || getEmployeeName(item.data.created_by)}
                    currentUserId={currentUserId || ''}
                    userRole="admin"
                    onCreatePayment={onCreatePayment || (() => {})}
                    onDelete={onDeleteAdvanceList || (() => {})}
                  />
                )
              case 'orderList':
                return (
                  <OrderListCard
                    key={item.data.id}
                    orderList={item.data as any}
                    userName={item.data.author?.display_name || getEmployeeName(item.data.created_by)}
                    currentUserId={currentUserId || ''}
                    userRole="admin"
                    onCreateReceipt={onCreateReceipt || (() => {})}
                  />
                )
            }
          })()

          // 訊息間距較小，卡片間距較大
          const spacing = item.type === 'message' ? 'mb-px' : 'mb-4'
          return <div className={spacing}>{itemElement}</div>
        }}
        components={{
          Footer: () => <div ref={messagesEndRef} />,
        }}
      />
    </div>
  )
})
