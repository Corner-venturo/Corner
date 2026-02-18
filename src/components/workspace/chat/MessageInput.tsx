'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Send, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FilePreview } from './FilePreview'
import { UploadProgress } from './UploadProgress'
import { QuickActionMenu, createQuickActions, createBotQuickActions, type QuickAction } from './QuickActionMenu'
import { validateFile } from './utils'
import { alert } from '@/lib/ui/alert-dialog'
import type { Channel } from '@/stores/workspace'
import { logger } from '@/lib/utils/logger'
import { useEmployeesSlim } from '@/data'
import { useAuthStore } from '@/stores/auth-store'
import { COMP_WORKSPACE_LABELS } from '../constants/labels'
import { SYSTEM_BOT_ID } from '@/lib/constants/workspace'

interface MessageInputProps {
  channel: Channel
  isAdmin: boolean
  channelName: string
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  attachedFiles: File[]
  onFilesChange: (files: File[]) => void
  uploadingFiles: boolean
  uploadProgress: number
  onShowShareOrders: () => void
  onShowShareQuote: () => void
  onShowNewPayment: () => void
  onShowNewReceipt: () => void
  onShowShareAdvance: () => void
  onShowNewTask: () => void
  // 機器人專用 handlers
  onCheckTicketStatus?: () => void
  onTourReview?: () => void
}

// 全形轉半形
function toHalfWidth(str: string): string {
  return str
    .replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
    .replace(/\u3000/g, ' ') // 全形空格
}

export function MessageInput({
  channel,
  isAdmin,
  channelName,
  value,
  onChange,
  onSubmit,
  attachedFiles,
  onFilesChange,
  uploadingFiles,
  uploadProgress,
  onShowShareOrders,
  onShowShareQuote,
  onShowNewPayment,
  onShowNewReceipt,
  onShowShareAdvance,
  onShowNewTask,
  onCheckTicketStatus,
  onTourReview,
}: MessageInputProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [isComposing, setIsComposing] = useState(false) // IME 組字狀態
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messageInputRef = useRef<HTMLDivElement>(null)
  const quickMenuRef = useRef<HTMLDivElement>(null)
  const { items: employees } = useEmployeesSlim()
  const { user } = useAuthStore()

  const isAnnouncementChannel = !!channel.is_announcement
  const isDisabled = isAnnouncementChannel && !isAdmin

  // 取得 DM 對方的 ID
  // 使用 dm_target_id 欄位，若該欄位是自己則對方是 created_by
  const dmTargetId = useMemo(() => {
    if (channel.type !== 'direct') return null

    // 優先使用 dm_target_id 欄位
    if (channel.dm_target_id) {
      // 如果 dm_target_id 是自己，對方就是創建者
      if (channel.dm_target_id === user?.id) {
        return channel.created_by
      }
      return channel.dm_target_id
    }

    // 向後相容：舊頻道沒有 dm_target_id，從名稱解析
    const parts = channel.name.replace('dm:', '').split(':')
    return parts.find(id => id !== user?.id) || null
  }, [channel.type, channel.dm_target_id, channel.created_by, channel.name, user?.id])

  // 取得 DM 對方名字
  const displayChannelName = useMemo(() => {
    if (channel.type === 'direct') {
      // 檢查是否是機器人
      if (dmTargetId === SYSTEM_BOT_ID) {
        return COMP_WORKSPACE_LABELS.VENTURO_機器人
      }

      // 用 dmTargetId 查詢員工名稱
      if (dmTargetId) {
        const emp = employees.find(e => e.id === dmTargetId)
        if (emp) {
          return emp.chinese_name || emp.display_name || COMP_WORKSPACE_LABELS.同事
        }
      }

      return COMP_WORKSPACE_LABELS.私訊
    }
    return channelName
  }, [channel.type, dmTargetId, employees, channelName])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else if (validation.error) {
        errors.push(validation.error)
      }
    })

    if (errors.length > 0) {
      void alert(errors.join('\n'), 'error')
    }

    if (validFiles.length > 0) {
      onFilesChange([...attachedFiles, ...validFiles])
    }

    if (e.target) {
      e.target.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    onFilesChange(attachedFiles.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 只在真的離開容器時才設為 false
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    // 1. 優先嘗試從瀏覽器拖曳的圖片 URL
    const html = e.dataTransfer.getData('text/html')
    if (html) {
      const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
      if (imgMatch && imgMatch[1]) {
        const imageUrl = imgMatch[1]
        // 跳過 data: URL 和 blob: URL
        if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
          try {
            // 下載圖片並轉換為 File
            const response = await fetch(imageUrl, { mode: 'cors' })
            if (!response.ok) throw new Error(COMP_WORKSPACE_LABELS.下載失敗)
            const blob = await response.blob()
            if (!blob.type.startsWith('image/')) throw new Error(COMP_WORKSPACE_LABELS.不是圖片)
            const fileName = imageUrl.split('/').pop()?.split('?')[0] || 'image.jpg'
            const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })

            const validation = validateFile(file)
            if (validation.valid) {
              onFilesChange([...attachedFiles, file])
              return
            }
          } catch {
            void alert(COMP_WORKSPACE_LABELS.此網站不允許下載圖片_請改用右鍵另存圖片後上傳, 'warning')
            return
          }
        }
      }
    }

    // 2. 嘗試從 URL 下載圖片
    const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain')
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif']
      const lowerUrl = url.toLowerCase()
      const isImageUrl = imageExtensions.some(ext => lowerUrl.includes(ext)) ||
                         lowerUrl.includes('image') ||
                         lowerUrl.includes('photo')

      if (isImageUrl) {
        try {
          const response = await fetch(url, { mode: 'cors' })
          if (!response.ok) throw new Error(COMP_WORKSPACE_LABELS.下載失敗)
          const blob = await response.blob()
          if (!blob.type.startsWith('image/')) throw new Error(COMP_WORKSPACE_LABELS.不是圖片)
          const fileName = url.split('/').pop()?.split('?')[0] || 'image.jpg'
          const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' })

          const validation = validateFile(file)
          if (validation.valid) {
            onFilesChange([...attachedFiles, file])
            return
          }
        } catch (err) {
          logger.log(COMP_WORKSPACE_LABELS.無法下載圖片_可能是_CORS_限制, url)
          void alert(COMP_WORKSPACE_LABELS.此網站不允許下載圖片_請改用右鍵另存圖片後上傳, 'warning')
          return
        }
      }
    }

    // 3. 處理本機檔案
    const files = Array.from(e.dataTransfer.files)

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach(file => {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else if (validation.error) {
        errors.push(validation.error)
      }
    })

    if (errors.length > 0) {
      void alert(errors.join('\n'), 'error')
    }

    if (validFiles.length > 0) {
      onFilesChange([...attachedFiles, ...validFiles])
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const files: File[] = []

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      e.preventDefault()
      const validFiles: File[] = []
      const errors: string[] = []

      files.forEach(file => {
        const validation = validateFile(file)
        if (validation.valid) {
          validFiles.push(file)
        } else if (validation.error) {
          errors.push(validation.error)
        }
      })

      if (errors.length > 0) {
        void alert(errors.join('\n'), 'error')
      }

      if (validFiles.length > 0) {
        onFilesChange([...attachedFiles, ...validFiles])
      }
    }
  }

  // 檢查是否為機器人 DM 頻道
  const isBotDM = useMemo(() => {
    if (channel.type === 'direct') {
      return dmTargetId === SYSTEM_BOT_ID
    }
    return false
  }, [channel.type, dmTargetId])

  // 根據頻道類型選擇不同的快捷操作
  const quickActions: QuickAction[] = useMemo(() => {
    if (isBotDM && onCheckTicketStatus && onTourReview) {
      return createBotQuickActions({
        onCheckTicketStatus: () => {
          onCheckTicketStatus()
          setShowQuickMenu(false)
        },
        onTourReview: () => {
          onTourReview()
          setShowQuickMenu(false)
        },
      })
    }

    return createQuickActions({
      onShareOrders: () => {
        onShowShareOrders()
        setShowQuickMenu(false)
      },
      onShareQuote: () => {
        onShowShareQuote()
        setShowQuickMenu(false)
      },
      onNewPayment: () => {
        onShowNewPayment()
        setShowQuickMenu(false)
      },
      onNewReceipt: () => {
        onShowNewReceipt()
        setShowQuickMenu(false)
      },
      onShareAdvance: () => {
        onShowShareAdvance()
        setShowQuickMenu(false)
      },
      onNewTask: () => {
        onShowNewTask()
        setShowQuickMenu(false)
      },
      onUploadFile: () => {
        fileInputRef.current?.click()
        setShowQuickMenu(false)
      },
    })
  }, [isBotDM, onCheckTicketStatus, onTourReview, onShowShareOrders, onShowShareQuote, onShowNewPayment, onShowNewReceipt, onShowShareAdvance, onShowNewTask])

  // 🔥 阻止整個頁面的拖曳預設行為（防止圖片在新分頁打開）
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      // 只在拖曳區域外阻止預設行為
      const messageInputContainer = messageInputRef.current?.closest('.p-4')
      const isInDropZone = messageInputContainer?.contains(e.target as Node)

      if (e.dataTransfer?.types?.includes('Files') && !isInDropZone) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    // 只阻止 document body 上的事件，不影響拖曳區域
    document.body.addEventListener('dragover', preventDefaults)
    document.body.addEventListener('drop', preventDefaults)

    return () => {
      document.body.removeEventListener('dragover', preventDefaults)
      document.body.removeEventListener('drop', preventDefaults)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false)
      }
    }

    if (showQuickMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showQuickMenu])

  return (
    <div
      className={cn(
        'p-4 border-t border-morandi-gold/20 bg-card shrink-0 transition-colors',
        isDragging && 'bg-morandi-gold/10 border-morandi-gold'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <FilePreview files={attachedFiles} onRemove={handleRemoveFile} />

      <UploadProgress progress={uploadingFiles ? uploadProgress : 0} />

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="flex items-center gap-1 relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-9 h-9 text-morandi-secondary hover:text-morandi-gold hover:bg-morandi-gold/10"
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            disabled={isDisabled}
          >
            <Plus size={18} />
          </Button>

          <QuickActionMenu ref={quickMenuRef} isOpen={showQuickMenu} actions={quickActions} />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            disabled={isDisabled}
          />
        </div>

        <div className="flex-1 relative" ref={messageInputRef} onPaste={handlePaste}>
          <textarea
            value={value}
            onChange={e => {
              // 全形轉半形
              const converted = toHalfWidth(e.target.value)
              onChange(converted)
            }}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={e => {
              // Shift+Enter 換行，Enter 送出
              // 注意：IME 組字中不送出
              if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
                e.preventDefault()
                if (value.trim() || attachedFiles.length > 0) {
                  onSubmit(e as unknown as React.FormEvent)
                }
              }
            }}
            placeholder={isDisabled ? COMP_WORKSPACE_LABELS.只有管理員才能在此頻道發言 : `傳送訊息給 ${displayChannelName}...`}
            className="w-full min-h-[40px] max-h-[120px] px-3 py-2 pr-10 bg-card border border-morandi-container rounded-md resize-none text-sm focus:outline-none focus:border-morandi-gold transition-colors disabled:bg-muted disabled:cursor-not-allowed"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '40px',
            }}
            onInput={e => {
              // 自動調整高度
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 120) + 'px'
            }}
            disabled={isDisabled}
          />
          <button
            type="button"
            className="absolute right-2 top-3 p-1 text-morandi-secondary hover:text-morandi-gold transition-colors pointer-events-auto z-10"
            disabled={isDisabled}
          >
            <Smile size={16} />
          </button>
        </div>

        <Button
          type="submit"
          disabled={(!value.trim() && attachedFiles.length === 0) || uploadingFiles || isDisabled}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingFiles ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </Button>
      </form>
    </div>
  )
}