'use client'

import { useState } from 'react'
import { MessageList, MessageInput, MemberSidebar } from '../chat'
import { validateFile } from '../chat/utils'
import { Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, AdvanceList, SharedOrderList, Channel } from '@/stores/workspace'
import { alert } from '@/lib/ui/alert-dialog'

interface MessageListTheme {
  colors: {
    surface: string
  }
  spacing: {
    lg: string
  }
}

const theme: MessageListTheme = {
  colors: {
    surface: 'bg-white'
  },
  spacing: {
    lg: '1rem'
  }
}

interface ChannelChatMessagesProps {
  channel: Channel; // Use the full channel object
  isAdmin: boolean; // Pass down isAdmin
  messages: Message[]
  advanceLists: AdvanceList[]
  sharedOrderLists: SharedOrderList[]
  channelName: string
  currentUserId?: string
  isLoading: boolean
  showMemberSidebar: boolean
  messageText: string
  attachedFiles: File[]
  uploadingFiles: boolean
  uploadProgress: number
  messagesEndRef: React.RefObject<HTMLDivElement>
  onReaction: (messageId: string, emoji: string) => void
  onDeleteMessage: (messageId: string) => Promise<void>
  onReply?: (message: Message) => void
  getReplyCount?: (messageId: string) => number
  onCreatePayment: (itemId: string, item: unknown) => void
  onDeleteAdvanceList: (listId: string) => Promise<void>
  onCreateReceipt: (orderId: string, order: unknown) => void
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
  channel,
  isAdmin,
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
  onReply,
  getReplyCount,
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
  const [isDragging, setIsDragging] = useState(false)

  // 🔥 處理整個聊天區域的拖曳
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 確保離開的是整個區域
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    console.log('🔥 handleDrop triggered')

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []

    console.log('🔥 droppedFiles count:', droppedFiles.length)

    // 處理直接拖曳的檔案
    droppedFiles.forEach(file => {
      console.log('🔥 Processing file:', file.name, file.type, file.size)
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
        console.log('🔥 File valid:', file.name)
      } else if (validation.error) {
        errors.push(validation.error)
        console.log('🔥 File invalid:', validation.error)
      }
    })

    // 🔥 處理從網頁拖曳的圖片 URL（Windows 和 Mac 都支援）
    if (droppedFiles.length === 0) {
      const html = e.dataTransfer.getData('text/html')
      const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')

      let imageUrl: string | null = null

      // 從 HTML 中提取 img src
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
        if (match && match[1]) {
          // 跳過 data: URL 和 blob: URL
          if (!match[1].startsWith('data:') && !match[1].startsWith('blob:')) {
            imageUrl = match[1]
          }
        }
      }

      // 如果沒有從 HTML 取得，嘗試直接用 URL
      if (!imageUrl && text) {
        const trimmedText = text.trim()
        if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
          // 檢查是否像圖片 URL
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif']
          const lowerUrl = trimmedText.toLowerCase()
          const isImageUrl = imageExtensions.some(ext => lowerUrl.includes(ext)) ||
                             lowerUrl.includes('image') ||
                             lowerUrl.includes('photo')
          if (isImageUrl) {
            imageUrl = trimmedText
          }
        }
      }

      if (imageUrl) {
        console.log('🔥 嘗試下載網頁圖片:', imageUrl)
        try {
          const response = await fetch(imageUrl, { mode: 'cors' })
          if (!response.ok) throw new Error('無法下載圖片')

          const blob = await response.blob()

          // 檢查是否為有效圖片
          if (!blob.type.startsWith('image/') && blob.size === 0) {
            throw new Error('下載的內容不是有效圖片')
          }

          const urlParts = imageUrl.split('/')
          let fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image'
          if (!fileName.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i)) {
            const ext = blob.type.split('/')[1] || 'png'
            fileName = `image.${ext}`
          }

          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })
          const validation = validateFile(file)

          if (validation.valid) {
            validFiles.push(file)
            console.log('🔥 成功下載並轉換為檔案:', fileName)
          } else if (validation.error) {
            errors.push(validation.error)
          }
        } catch (err) {
          console.warn('🔥 無法下載圖片（可能是 CORS 限制）:', imageUrl)
          errors.push('此網站不允許下載圖片，請改用右鍵另存圖片後上傳')
        }
      }
    }

    if (errors.length > 0) {
      console.log('🔥 Errors:', errors)
      void alert(errors.join('\n'), 'error')
    }

    console.log('🔥 validFiles count:', validFiles.length)
    console.log('🔥 current attachedFiles:', attachedFiles.length)

    if (validFiles.length > 0) {
      console.log('🔥 Calling onFilesChange with', [...attachedFiles, ...validFiles].length, 'files')
      onFilesChange([...attachedFiles, ...validFiles])
    } else {
      console.log('🔥 No valid files to add')
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col flex-1 min-h-0 relative',
        isDragging && 'bg-morandi-gold/5'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖曳提示覆蓋層 */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-morandi-gold/10 border-2 border-dashed border-morandi-gold rounded-lg pointer-events-none">
          <div className="text-center bg-white/90 p-6 rounded-xl shadow-lg">
            <Paperclip size={48} className="mx-auto mb-3 text-morandi-gold" />
            <p className="text-morandi-gold font-semibold text-lg">放開以上傳檔案</p>
            <p className="text-morandi-secondary text-sm mt-1">支援圖片、PDF、文件等格式</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <MessageList
          messages={messages}
          advanceLists={advanceLists}
          sharedOrderLists={sharedOrderLists}
          channelName={channelName}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onReaction={onReaction}
          onDeleteMessage={onDeleteMessage}
          onReply={onReply}
          getReplyCount={getReplyCount}
          onCreatePayment={onCreatePayment}
  onDeleteAdvanceList={onDeleteAdvanceList}
          onCreateReceipt={onCreateReceipt}
          messagesEndRef={messagesEndRef}
          theme={theme}
        />

        <MemberSidebar isOpen={showMemberSidebar} />
      </div>

      <MessageInput
        channel={channel}
        isAdmin={isAdmin}
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
    </div>
  )
}