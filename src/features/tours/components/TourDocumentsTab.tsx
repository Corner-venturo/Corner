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
import { Plus, FileText, Image, File, Eye, Edit2, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { confirm, alert } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

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
  created_at: string
  updated_at: string
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

  // 載入文件列表
  const loadDocuments = useCallback(async () => {
    if (!tour.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tour_documents')
        .select('*')
        .eq('tour_id', tour.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      logger.error('載入文件失敗:', error)
      toast.error('載入文件失敗')
    } finally {
      setLoading(false)
    }
  }, [tour.id])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

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

      toast.success(`已上傳 ${files.length} 個文件`)
      loadDocuments()
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
      loadDocuments()
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
      loadDocuments()
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
          <div className="font-medium text-morandi-primary">{row.name}</div>
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
