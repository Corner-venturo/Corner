'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Tour } from '@/stores/types'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores'
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormDialog } from '@/components/dialog'
import { DateCell } from '@/components/table-cells'
import { Plus, FileText, Image, File, Eye, Edit2, Trash2, Upload, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface TourDocument {
  id: string
  tour_id: string
  workspace_id: string
  name: string
  description: string | null
  file_path: string
  public_url: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string | null
  updated_at: string | null
  // 來源標記
  source?: 'upload' | 'channel'
  message_id?: string // 如果來自頻道訊息
}

interface TourDocumentsTabProps {
  tour: Tour
}

// 根據 MIME 類型取得圖標
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File
  if (mimeType.startsWith('image/')) return Image
  if (mimeType === 'application/pdf') return FileText
  return File
}

// 格式化檔案大小
function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function TourDocumentsTab({ tour }: TourDocumentsTabProps) {
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState<TourDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // 編輯對話框
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingDoc, setEditingDoc] = useState<TourDocument | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // 載入文件列表（包含直接上傳 + 頻道附件）
  const loadDocuments = useCallback(async () => {
    if (!tour.id) return

    setLoading(true)
    try {
      // 1. 載入直接上傳的文件
      const { data: uploadedDocs, error: uploadError } = await supabase
        .from('tour_documents')
        .select('*')
        .eq('tour_id', tour.id)
        .order('created_at', { ascending: false })

      if (uploadError) throw uploadError

      // 標記來源為上傳
      const docsWithSource: TourDocument[] = (uploadedDocs || []).map(doc => ({
        ...doc,
        source: 'upload' as const,
      }))

      // 2. 載入頻道附件（透過 channel.tour_id 關聯）
      const { data: channelData } = await supabase
        .from('channels')
        .select('id')
        .eq('tour_id', tour.id)
        .single()

      let channelDocs: TourDocument[] = []
      if (channelData?.id) {
        const { data: messages } = await supabase
          .from('messages')
          .select('id, attachments, created_at, workspace_id')
          .eq('channel_id', channelData.id)
          .not('attachments', 'is', null)
          .order('created_at', { ascending: false })

        // 將訊息附件轉換為 TourDocument 格式
        channelDocs = (messages || []).flatMap(msg => {
          const attachments = msg.attachments as Array<{
            id?: string
            fileName?: string
            name?: string
            fileSize?: number
            size?: number
            mimeType?: string
            type?: string
            path?: string
            publicUrl?: string
            url?: string
          }> | null

          if (!attachments || !Array.isArray(attachments)) return []

          return attachments.map((att, idx) => ({
            id: att.id || `${msg.id}-${idx}`,
            tour_id: tour.id,
            workspace_id: msg.workspace_id || '',
            name: att.fileName || att.name || '未命名檔案',
            description: '來自工作空間頻道',
            file_path: att.path || '',
            public_url: att.publicUrl || att.url || '',
            file_name: att.fileName || att.name || '',
            file_size: att.fileSize || att.size || null,
            mime_type: att.mimeType || att.type || null,
            uploaded_by: null,
            created_at: msg.created_at,
            updated_at: msg.created_at,
            source: 'channel' as const,
            message_id: msg.id,
          }))
        })
      }

      // 合併兩個來源，按時間排序
      const allDocs = [...docsWithSource, ...channelDocs].sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

      setDocuments(allDocs)
    } catch (error) {
      logger.error('載入文件失敗:', error)
      toast.error('載入文件失敗')
    } finally {
      setLoading(false)
    }
  }, [tour.id])

  // 初始載入 + Realtime 訂閱
  useEffect(() => {
    loadDocuments()

    // 訂閱 tour_documents 表的變更
    const channel = supabase
      .channel(`tour-docs-${tour.id}`)
      .on<TourDocument>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tour_documents',
          filter: `tour_id=eq.${tour.id}`,
        },
        (payload: RealtimePostgresChangesPayload<TourDocument>) => {
          if (payload.eventType === 'INSERT') {
            const newDoc = { ...payload.new, source: 'upload' as const }
            setDocuments(prev => [newDoc, ...prev])
            toast.success('新文件已上傳', { duration: 2000 })
          } else if (payload.eventType === 'UPDATE') {
            setDocuments(prev =>
              prev.map(doc =>
                doc.id === payload.new.id ? { ...payload.new, source: 'upload' as const } : doc
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    // 清理訂閱
    return () => {
      supabase.removeChannel(channel)
    }
  }, [tour.id, loadDocuments])

  // 上傳文件
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user?.workspace_id) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        // 產生唯一檔名
        const timestamp = Date.now()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filePath = `tour-documents/${tour.id}/${timestamp}_${safeFileName}`

        // 上傳到 Storage
        const { error: uploadError } = await supabase.storage
          .from('workspace-files')
          .upload(filePath, file, { cacheControl: '3600', upsert: false })

        if (uploadError) throw uploadError

        // 取得公開 URL
        const { data: urlData } = supabase.storage
          .from('workspace-files')
          .getPublicUrl(filePath)

        // 儲存到資料庫
        const { error: dbError } = await supabase
          .from('tour_documents')
          .insert({
            tour_id: tour.id,
            workspace_id: user.workspace_id,
            name: file.name.replace(/\.[^/.]+$/, ''), // 移除副檔名作為名稱
            file_path: filePath,
            public_url: urlData.publicUrl,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type || null,
            uploaded_by: user?.id || null,
          })

        if (dbError) throw dbError
      }

      // Realtime 會自動更新列表，不需要手動 reload
      // 但多檔上傳時只會收到最後一個的通知，所以還是顯示總數
      if (files.length > 1) {
        toast.success(`已上傳 ${files.length} 個文件`)
      }
    } catch (error) {
      logger.error('上傳失敗:', error)
      toast.error('上傳失敗')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 開啟文件
  const handleOpen = (doc: TourDocument) => {
    window.open(doc.public_url, '_blank')
  }

  // 開啟編輯對話框
  const handleEdit = (doc: TourDocument) => {
    setEditingDoc(doc)
    setEditName(doc.name)
    setEditDescription(doc.description || '')
    setEditDialogOpen(true)
  }

  // 儲存編輯
  const handleSaveEdit = async () => {
    if (!editingDoc || !editName.trim()) {
      await alert('請輸入文件名稱', 'warning')
      return
    }

    try {
      const { error } = await supabase
        .from('tour_documents')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
        })
        .eq('id', editingDoc.id)

      if (error) throw error

      toast.success('已更新')
      setEditDialogOpen(false)
      // Realtime 會自動更新列表
    } catch (error) {
      logger.error('更新失敗:', error)
      toast.error('更新失敗')
    }
  }

  // 刪除文件
  const handleDelete = async (doc: TourDocument) => {
    const confirmed = await confirm(
      `確定要刪除「${doc.name}」嗎？`,
      { type: 'warning', confirmText: '刪除', cancelText: '取消' }
    )

    if (!confirmed) return

    try {
      // 刪除 Storage 檔案
      await supabase.storage
        .from('workspace-files')
        .remove([doc.file_path])

      // 刪除資料庫記錄
      const { error } = await supabase
        .from('tour_documents')
        .delete()
        .eq('id', doc.id)

      if (error) throw error

      toast.success('已刪除')
      // Realtime 會自動更新列表
    } catch (error) {
      logger.error('刪除失敗:', error)
      toast.error('刪除失敗')
    }
  }

  // 表格欄位
  const columns: TableColumn<TourDocument>[] = [
    {
      key: 'icon',
      label: '',
      width: '50px',
      render: (_, row) => {
        const Icon = getFileIcon(row.mime_type)
        const isImage = row.mime_type?.startsWith('image/')
        return isImage ? (
          <img
            src={row.public_url}
            alt={row.name}
            className="w-8 h-8 object-cover rounded"
          />
        ) : (
          <Icon size={20} className="text-morandi-secondary" />
        )
      },
    },
    {
      key: 'name',
      label: '文件名稱',
      render: (_, row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-morandi-primary">{row.name}</span>
            {row.source === 'channel' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-blue-50 text-blue-600 rounded">
                <MessageSquare size={10} />
                頻道
              </span>
            )}
          </div>
          <div className="text-xs text-morandi-muted">
            {row.file_name} · {formatFileSize(row.file_size)}
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      label: '說明',
      render: (_, row) => (
        <span className="text-morandi-secondary text-sm">
          {row.description || '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '上傳時間',
      width: '120px',
      render: (value) => <DateCell date={String(value)} showIcon={false} />,
    },
    {
      key: 'actions',
      label: '',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpen(row)}
            className="h-8 w-8 p-0"
            title="開啟"
          >
            <Eye size={16} />
          </Button>
          {row.source !== 'channel' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
                className="h-8 w-8 p-0"
                title="編輯"
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row)}
                className="h-8 w-8 p-0 text-morandi-red hover:text-morandi-red"
                title="刪除"
              >
                <Trash2 size={16} />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 標題和上傳按鈕 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-morandi-primary">文件管理</h3>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
        >
          <Plus size={16} />
          上傳文件
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* 文件列表 */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-morandi-container rounded-lg">
          <Upload size={48} className="mx-auto mb-4 text-morandi-muted opacity-50" />
          <p className="text-morandi-secondary mb-2">尚無文件</p>
          <p className="text-sm text-morandi-muted">點擊上方按鈕或拖曳檔案到此處上傳</p>
        </div>
      ) : (
        <EnhancedTable
          data={documents}
          columns={columns}
          initialPageSize={10}
        />
      )}

      {/* 編輯對話框 */}
      <FormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        title="編輯文件資訊"
        onSubmit={handleSaveEdit}
        submitLabel="儲存"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              文件名稱
            </label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="輸入文件名稱"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-2 block">
              說明
            </label>
            <Input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="輸入文件說明（可選）"
            />
          </div>
        </div>
      </FormDialog>
    </div>
  )
}
