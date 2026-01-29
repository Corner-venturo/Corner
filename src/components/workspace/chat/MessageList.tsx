'use client'

import { forwardRef, useMemo, useRef, useEffect } from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import type { Message, AdvanceList, SharedOrderList } from '@/stores/workspace-store'
import { useEmployeesSlim } from '@/data'
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
  channelType?: string
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
    channelType,
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
  const { items: employees = [] } = useEmployeesSlim()

  // 根據 created_by 查找員工名字
  const getEmployeeName = (userId: string) => {
    const employee = employees.find(e => e.id === userId)
    return employee?.display_name || (employee as { name?: string } | undefined)?.name || '未知'
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

  // 🔥 所有 Hooks 必須在 early return 之前
  const virtuosoRef = useRef<VirtuosoHandle>(null)

  // 當訊息數量變化時，滾動到底部
  useEffect(() => {
    if (allItems.length > 0) {
      // 使用 setTimeout 確保 DOM 更新後再滾動
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: allItems.length - 1,
          behavior: 'smooth',
          align: 'end',
        })
      }, 100)
    }
  }, [allItems.length])

  // Early returns 必須在所有 Hooks 之後
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card">
        <div className="animate-spin w-6 h-6 border-2 border-morandi-gold border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const hasNoContent =
    messages.length === 0 && advanceLists.length === 0 && sharedOrderLists.length === 0

  if (hasNoContent) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card">
        <EmptyState channelName={channelName} channelType={channelType} currentUserId={currentUserId} />
      </div>
    )
  }

  return (
    <div ref={ref} className="flex-1 bg-card" style={{ height: '100%' }}>
      <Virtuoso
        ref={virtuosoRef}
        data={allItems}
        followOutput="smooth"
        initialTopMostItemIndex={allItems.length - 1}
        alignToBottom
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
                    orderList={item.data}
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
