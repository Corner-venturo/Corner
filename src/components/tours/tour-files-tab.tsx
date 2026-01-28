'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useWorkspaceChannels } from '@/stores/workspace-store'
import { useOfficeDocument } from '@/features/office/hooks/useOfficeDocument'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import {
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Download,
  ExternalLink,
  Upload,
  MessageSquare,
  FolderOpen,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import type { MessageAttachment } from '@/stores/workspace/types'
import { ensureMessageAttachments } from '@/stores/workspace/utils'
import { useRouter } from 'next/navigation'

interface TourFilesTabProps {
  tourId: string
  tourCode: string
}

// 統一的檔案項目介面
interface UnifiedFile {
  id: string
  name: string
  type: 'file' | 'chat' | 'document'
  mimeType?: string
  size?: number
  url?: string
  path?: string
  createdAt: string
  createdBy?: string
  // For office documents
  documentType?: 'spreadsheet' | 'document' | 'slides'
  documentId?: string
}

// 檔案圖示
function getFileIcon(file: UnifiedFile) {
  if (file.type === 'document') {
    switch (file.documentType) {
      case 'spreadsheet':
        return FileSpreadsheet
      case 'document':
        return FileText
      default:
        return FileText
    }
  }

  const mimeType = file.mimeType || ''
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return FileText
  return File
}

// 格式化檔案大小
function formatFileSize(bytes?: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TourFilesTab({ tourId, tourCode }: TourFilesTabProps) {
  const router = useRouter()
  const { channels } = useWorkspaceChannels()
  const { fetchDocumentsByTour } = useOfficeDocument()

  const [files, setFiles] = useState<UnifiedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<'all' | 'file' | 'chat' | 'document'>('all')

  // 找到該團的頻道
  const tourChannel = channels.find(ch => ch.tour_id === tourId)

  // 載入所有檔案
  const loadFiles = useCallback(async () => {
    setLoading(true)
    const allFiles: UnifiedFile[] = []

    try {
      // 1. 載入上傳的檔案（files 表）
      const { data: uploadedFiles, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('tour_id', tourId)
        .order('created_at', { ascending: false })

      if (filesError) {
        logger.error('載入檔案失敗', { error: filesError })
      } else if (uploadedFiles) {
        for (const f of uploadedFiles) {
          allFiles.push({
            id: f.id,
            name: f.original_filename || f.filename,
            type: 'file',
            mimeType: f.content_type || undefined,
            size: f.size_bytes || undefined,
            path: f.storage_path,
            createdAt: f.created_at,
            createdBy: f.created_by || undefined,
          })
        }
      }

      // 2. 載入對話中的附件
      if (tourChannel) {
        const { data: messages, error: messagesError } = await supabase
          .from('messages')
          .select('id, attachments, created_at, created_by')
          .eq('channel_id', tourChannel.id)
          .not('attachments', 'is', null)
          .order('created_at', { ascending: false })

        if (messagesError) {
          logger.error('載入對話附件失敗', { error: messagesError })
        } else if (messages) {
          for (const msg of messages) {
            const attachments = ensureMessageAttachments(msg.attachments)
            for (const att of attachments) {
              allFiles.push({
                id: att.id || `${msg.id}-${att.fileName}`,
                name: att.fileName || att.name || '未命名檔案',
                type: 'chat',
                mimeType: att.mimeType,
                size: att.fileSize || att.size,
                url: att.publicUrl || att.url,
                path: att.path,
                createdAt: msg.created_at || new Date().toISOString(),
                createdBy: msg.created_by || undefined,
              })
            }
          }
        }
      }

      // 3. 載入 Office 文件
      const officeDocuments = await fetchDocumentsByTour(tourId)
      for (const doc of officeDocuments) {
        allFiles.push({
          id: doc.id,
          name: doc.name,
          type: 'document',
          documentType: doc.type as 'spreadsheet' | 'document' | 'slides',
          documentId: doc.id,
          createdAt: doc.created_at,
          createdBy: doc.created_by || undefined,
        })
      }

      // 依時間排序
      allFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setFiles(allFiles)
    } catch (error) {
      logger.error('載入檔案失敗', { error })
    } finally {
      setLoading(false)
    }
  }, [tourId, tourChannel, fetchDocumentsByTour])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // 篩選後的檔案
  const filteredFiles = activeFilter === 'all'
    ? files
    : files.filter(f => f.type === activeFilter)

  // 統計
  const stats = {
    total: files.length,
    files: files.filter(f => f.type === 'file').length,
    chat: files.filter(f => f.type === 'chat').length,
    documents: files.filter(f => f.type === 'document').length,
  }

  // 下載檔案
  const handleDownload = async (file: UnifiedFile) => {
    if (file.url) {
      window.open(file.url, '_blank')
    } else if (file.path) {
      const { data } = await supabase.storage
        .from('workspace-files')
        .createSignedUrl(file.path, 60)
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    }
  }

  // 開啟 Office 文件
  const handleOpenDocument = (file: UnifiedFile) => {
    if (file.documentId) {
      router.push(`/office/editor?id=${file.documentId}&name=${encodeURIComponent(file.name)}&type=${file.documentType}`)
    }
  }

  // 建立新文件
  const handleCreateDocument = () => {
    router.push(`/office/editor?type=spreadsheet&name=新試算表&tourId=${tourId}`)
  }

  return (
    <div className="space-y-4">
      {/* 工具列 */}
      <div className="flex items-center justify-between">
        {/* 篩選按鈕 */}
        <div className="flex items-center gap-1">
          <Button
            variant={activeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('all')}
            className="h-8"
          >
            全部 ({stats.total})
          </Button>
          <Button
            variant={activeFilter === 'file' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('file')}
            className="h-8"
          >
            <Upload size={14} className="mr-1" />
            上傳 ({stats.files})
          </Button>
          <Button
            variant={activeFilter === 'chat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('chat')}
            className="h-8"
          >
            <MessageSquare size={14} className="mr-1" />
            對話 ({stats.chat})
          </Button>
          <Button
            variant={activeFilter === 'document' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter('document')}
            className="h-8"
          >
            <FileSpreadsheet size={14} className="mr-1" />
            文件 ({stats.documents})
          </Button>
        </div>

        {/* 操作按鈕 */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateDocument}
            className="h-8"
          >
            <Plus size={14} className="mr-1" />
            新增試算表
          </Button>
        </div>
      </div>

      {/* 檔案列表 */}
      <div className="border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-morandi-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold mx-auto mb-3" />
            <p>載入中...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="py-12 text-center text-morandi-secondary">
            <FolderOpen size={32} className="mx-auto mb-3 opacity-50" />
            <p>尚無檔案</p>
            <p className="text-xs mt-1">上傳檔案、在對話中分享、或建立文件</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-morandi-container/20"
                >
                  {/* 圖示 */}
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    file.type === 'document' ? 'bg-green-100 text-green-600' :
                    file.type === 'chat' ? 'bg-blue-100 text-blue-600' :
                    'bg-morandi-container text-morandi-secondary'
                  )}>
                    <Icon size={20} />
                  </div>

                  {/* 資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary truncate">{file.name}</div>
                    <div className="text-xs text-morandi-secondary flex items-center gap-2">
                      {/* 來源標籤 */}
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[10px] font-medium',
                        file.type === 'document' ? 'bg-green-100 text-green-700' :
                        file.type === 'chat' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {file.type === 'document' ? '文件' : file.type === 'chat' ? '對話' : '上傳'}
                      </span>
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      <span>
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: zhTW })}
                      </span>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-1">
                    {file.type === 'document' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleOpenDocument(file)}
                      >
                        <ExternalLink size={14} className="mr-1" />
                        開啟
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDownload(file)}
                      >
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
