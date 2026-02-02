'use client'

/**
 * TourFilesManager - Finder 風格的團檔案管理
 * 
 * 功能：
 * - 資料夾格狀顯示
 * - 自動分類檔案
 * - 拖曳移動/上傳
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/components/ui/use-toast'
import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Download,
  Upload,
  ChevronLeft,
  MoreHorizontal,
  Trash2,
  Move,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { createTourFolders, DEFAULT_TOUR_FOLDERS, type FileCategory } from '@/lib/utils/tour-folders'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TourFilesManagerProps {
  tourId: string
  tourCode: string
}

interface FolderItem {
  id: string
  name: string
  icon: string
  color: string
  category: string
  fileCount: number
}

interface FileItem {
  id: string
  name: string
  mimeType?: string
  size?: number
  path?: string
  folderId?: string
  category?: string
  createdAt: string
}

// 檔案圖示
function getFileIcon(mimeType?: string) {
  if (!mimeType) return File
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

export function TourFilesManager({ tourId, tourCode }: TourFilesManagerProps) {
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  // 載入資料夾和檔案
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. 載入資料夾
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('id, name, icon, color, default_category')
        .eq('tour_id', tourId)
        .order('sort_order')

      if (folderError) {
        logger.error('載入資料夾失敗', folderError)
      }

      // 2. 如果沒有資料夾，自動建立
      if (!folderData || folderData.length === 0) {
        if (user?.workspace_id) {
          await createTourFolders(tourId, user.workspace_id, tourCode, user.id)
          // 重新載入
          const { data: newFolderData } = await supabase
            .from('folders')
            .select('id, name, icon, color, default_category')
            .eq('tour_id', tourId)
            .order('sort_order')
          
          if (newFolderData) {
            setFolders(newFolderData.map(f => ({
              id: f.id,
              name: f.name,
              icon: f.icon || '📁',
              color: f.color || '#8b8b8b',
              category: f.default_category || 'other',
              fileCount: 0,
            })))
          }
        }
      } else {
        setFolders(folderData.map(f => ({
          id: f.id,
          name: f.name,
          icon: f.icon || '📁',
          color: f.color || '#8b8b8b',
          category: f.default_category || 'other',
          fileCount: 0,
        })))
      }

      // 3. 載入檔案
      const { data: fileData, error: fileError } = await supabase
        .from('files')
        .select('id, filename, original_filename, content_type, size_bytes, storage_path, folder_id, category, created_at')
        .eq('tour_id', tourId)
        .order('created_at', { ascending: false })

      if (fileError) {
        logger.error('載入檔案失敗', fileError)
      }

      if (fileData) {
        setFiles(fileData.map(f => ({
          id: f.id,
          name: f.original_filename || f.filename,
          mimeType: f.content_type || undefined,
          size: f.size_bytes || undefined,
          path: f.storage_path,
          folderId: f.folder_id || undefined,
          category: f.category || undefined,
          createdAt: f.created_at,
        })))
      }
    } catch (err) {
      logger.error('載入資料失敗', err)
    } finally {
      setLoading(false)
    }
  }, [tourId, tourCode, user])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 計算每個資料夾的檔案數
  const foldersWithCount = folders.map(folder => ({
    ...folder,
    fileCount: files.filter(f => 
      f.folderId === folder.id || 
      (!f.folderId && f.category === folder.category)
    ).length,
  }))

  // 目前顯示的檔案
  const currentFiles = selectedFolder
    ? files.filter(f => 
        f.folderId === selectedFolder.id || 
        (!f.folderId && f.category === selectedFolder.category)
      )
    : []

  // 處理拖曳上傳
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length === 0) return

    if (!selectedFolder) {
      toast({ title: '請先選擇資料夾', variant: 'destructive' })
      return
    }

    // TODO: 實作檔案上傳
    toast({ title: `準備上傳 ${droppedFiles.length} 個檔案到「${selectedFolder.name}」` })
  }, [selectedFolder, toast])

  // 移動檔案到資料夾
  const handleMoveFile = async (fileId: string, targetFolderId: string) => {
    const targetFolder = folders.find(f => f.id === targetFolderId)
    
    const { error } = await supabase
      .from('files')
      .update({ 
        folder_id: targetFolderId,
        category: (targetFolder?.category || 'other') as 'quote' | 'contract' | 'passport' | 'itinerary' | 'ticket' | 'voucher' | 'insurance' | 'photo' | 'other' | 'visa' | 'invoice' | 'email_attachment' | 'request' | 'cancellation' | 'confirmation',
      })
      .eq('id', fileId)

    if (error) {
      toast({ title: '移動失敗', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: '已移動到「' + (targetFolder?.name || '其他') + '」' })
      loadData()
    }
  }

  // 下載檔案
  const handleDownload = async (file: FileItem) => {
    if (!file.path) return

    const { data } = await supabase.storage
      .from('workspace-files')
      .createSignedUrl(file.path, 60)

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-morandi-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 資料夾格狀顯示 */}
      {!selectedFolder && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
          {foldersWithCount.map(folder => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder)}
              className={cn(
                'flex flex-col items-center p-4 rounded-lg border border-transparent',
                'hover:bg-morandi-container/50 hover:border-morandi-border',
                'transition-all duration-150'
              )}
            >
              <span className="text-3xl mb-2">{folder.icon}</span>
              <span className="text-sm font-medium text-morandi-primary truncate max-w-full">
                {folder.name}
              </span>
              <span className="text-xs text-morandi-secondary">
                {folder.fileCount} 個檔案
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 檔案列表（選擇資料夾後） */}
      {selectedFolder && (
        <div
          className={cn(
            'border border-border rounded-lg overflow-hidden',
            isDragging && 'border-morandi-gold border-2 bg-morandi-gold/5'
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* 標題列 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-morandi-container/30 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFolder(null)}
              className="h-8 px-2"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-xl">{selectedFolder.icon}</span>
            <span className="font-medium">{selectedFolder.name}</span>
            <span className="text-sm text-morandi-secondary">
              ({currentFiles.length} 個檔案)
            </span>
          </div>

          {/* 檔案列表 */}
          {currentFiles.length === 0 ? (
            <div className="py-12 text-center text-morandi-secondary">
              <Upload size={32} className="mx-auto mb-3 opacity-50" />
              <p>尚無檔案</p>
              <p className="text-xs mt-1">拖曳檔案到這裡上傳</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {currentFiles.map(file => {
                const Icon = getFileIcon(file.mimeType)
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-morandi-container/20"
                  >
                    <div className="w-10 h-10 rounded-lg bg-morandi-container flex items-center justify-center text-morandi-secondary">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-morandi-primary truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-morandi-secondary flex items-center gap-2">
                        {file.size && <span>{formatFileSize(file.size)}</span>}
                        <span>
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true, locale: zhTW })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDownload(file)}
                      >
                        <Download size={14} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <MoreHorizontal size={14} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="text-xs font-medium text-morandi-secondary">
                            移動到...
                          </DropdownMenuItem>
                          {folders
                            .filter(f => f.id !== selectedFolder.id)
                            .map(folder => (
                              <DropdownMenuItem
                                key={folder.id}
                                onClick={() => handleMoveFile(file.id, folder.id)}
                              >
                                <span className="mr-2">{folder.icon}</span>
                                {folder.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
