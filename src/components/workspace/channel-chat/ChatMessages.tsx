'use client'

import { useState } from 'react'
import { MessageList, MessageInput, MemberSidebar } from '../chat'
import { validateFile } from '../chat/utils'
import { Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message, AdvanceList, SharedOrderList, AdvanceItem } from '@/stores/workspace'

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

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles: File[] = []
    const errors: string[] = []

    console.log('[ChatMessages] handleDrop - droppedFiles:', droppedFiles.length)

    // 處理直接拖曳的檔案
    droppedFiles.forEach(file => {
      console.log('[ChatMessages] Validating file:', file.name, file.type, file.size)
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
        console.log('[ChatMessages] File validated successfully:', file.name)
      } else if (validation.error) {
        errors.push(validation.error)
        console.log('[ChatMessages] File validation failed:', validation.error)
      }
    })

    // 🔥 處理從網頁拖曳的圖片 URL（Windows 和 Mac 都支援）
    if (droppedFiles.length === 0) {
      // 嘗試取得圖片 URL
      const html = e.dataTransfer.getData('text/html')
      const text = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')

      console.log('[ChatMessages] No files, trying to extract image URL from HTML/text')

      let imageUrl: string | null = null

      // 從 HTML 中提取 img src
      if (html) {
        const match = html.match(/<img[^>]+src=["']([^"']+)["']/i)
        if (match) {
          imageUrl = match[1]
          console.log('[ChatMessages] Found image URL from HTML:', imageUrl)
        }
      }

      // 如果沒有從 HTML 取得，嘗試直接用 URL
      if (!imageUrl && text) {
        const urlMatch = text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i)
        if (urlMatch) {
          imageUrl = text.trim()
          console.log('[ChatMessages] Found image URL from text:', imageUrl)
        }
      }

      if (imageUrl) {
        try {
          // 下載圖片並轉換為 File
          console.log('[ChatMessages] Fetching image from URL:', imageUrl)
          const response = await fetch(imageUrl)
          if (!response.ok) throw new Error('無法下載圖片')

          const blob = await response.blob()
          console.log('[ChatMessages] Image fetched, blob type:', blob.type, 'size:', blob.size)

          // 從 URL 取得檔名
          const urlParts = imageUrl.split('/')
          let fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image'
          if (!fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            // 根據 MIME 類型加上副檔名
            const ext = blob.type.split('/')[1] || 'png'
            fileName = `image.${ext}`
          }

          const file = new File([blob], fileName, { type: blob.type })
          const validation = validateFile(file)

          if (validation.valid) {
            validFiles.push(file)
            console.log('[ChatMessages] Web image validated successfully:', file.name)
          } else if (validation.error) {
            errors.push(validation.error)
            console.log('[ChatMessages] Web image validation failed:', validation.error)
          }
        } catch (err) {
          // CORS 錯誤時，提示用戶
          console.error('[ChatMessages] Failed to fetch image:', err)
          errors.push('無法直接下載此圖片（可能有跨域限制），請右鍵另存圖片後再上傳')
        }
      }
    }

    if (errors.length > 0) {
      alert(errors.join('\n'))
    }

    if (validFiles.length > 0) {
      console.log('[ChatMessages] Adding files to attachedFiles, count:', validFiles.length)
      console.log('[ChatMessages] Current attachedFiles:', attachedFiles.length)
      onFilesChange([...attachedFiles, ...validFiles])
    } else {
      console.log('[ChatMessages] No valid files to add')
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
