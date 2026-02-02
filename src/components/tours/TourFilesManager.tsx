'use client'

/**
 * TourFilesManager - 團文件中心
 * 
 * 統一顯示所有團相關文件：
 * - DB 驅動的文件（報價單、行程表、確認單、合約、需求單）
 * - 上傳的文件（護照、簽證、憑證等）
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'
import { useToast } from '@/components/ui/use-toast'
import {
  Folder,
  FileText,
  FileSpreadsheet,
  Image,
  File,
  Download,
  Upload,
  ChevronLeft,
  Plus,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow, format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { createTourFolders, DEFAULT_TOUR_FOLDERS } from '@/lib/utils/tour-folders'
import { useRouter } from 'next/navigation'

interface TourFilesManagerProps {
  tourId: string
  tourCode: string
}

interface FolderConfig {
  name: string
  category: string
  icon: string
  color: string
  dataSource: 'db' | 'files'
  table: string
  createLabel: string
}

interface DocumentItem {
  id: string
  name: string
  type: 'db' | 'file'
  subType?: string // quote, itinerary, etc.
  createdAt: string
  status?: string
  mimeType?: string
  size?: number
  path?: string
}

export function TourFilesManager({ tourId, tourCode }: TourFilesManagerProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  
  const [selectedFolder, setSelectedFolder] = useState<FolderConfig | null>(null)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [folderCounts, setFolderCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 載入各資料夾的數量
  const loadFolderCounts = useCallback(async () => {
    setLoading(true)
    const counts: Record<string, number> = {}

    try {
      // 並行查詢各資料夾的數量
      await Promise.all(DEFAULT_TOUR_FOLDERS.map(async (folder) => {
        if (folder.dataSource === 'db') {
          // 根據不同的表查詢
          let query = supabase.from(folder.table).select('id', { count: 'exact', head: true })
          
          if (folder.table === 'quotes') {
            query = query.eq('tour_id', tourId)
          } else if (folder.table === 'proposal_packages') {
            // 行程表關聯到 proposal，需要先找 proposal
            const { count } = await supabase
              .from('proposals')
              .select('id', { count: 'exact', head: true })
              .eq('converted_tour_id', tourId)
            counts[folder.category] = count || 0
            return
          } else if (folder.table === 'tour_confirmation_sheets') {
            query = query.eq('tour_id', tourId)
          } else if (folder.table === 'contracts') {
            query = query.eq('tour_id', tourId)
          } else if (folder.table === 'tour_requests') {
            query = query.eq('tour_id', tourId)
          }

          const { count } = await query
          counts[folder.category] = count || 0
        } else {
          // files 表
          const { count } = await supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
            .eq('category', folder.category)
          counts[folder.category] = count || 0
        }
      }))

      setFolderCounts(counts)
    } catch (err) {
      logger.error('載入資料夾數量失敗', err)
    } finally {
      setLoading(false)
    }
  }, [tourId])

  // 載入資料夾內容
  const loadFolderContent = useCallback(async (folder: FolderConfig) => {
    setLoadingDocs(true)
    const docs: DocumentItem[] = []

    try {
      if (folder.dataSource === 'db') {
        if (folder.table === 'quotes') {
          const { data } = await supabase
            .from('quotes')
            .select('id, quote_number, title, status, created_at')
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false })
          
          if (data) {
            docs.push(...data.map(q => ({
              id: q.id,
              name: q.title || q.quote_number || '未命名報價單',
              type: 'db' as const,
              subType: 'quote',
              createdAt: q.created_at,
              status: q.status,
            })))
          }
        } else if (folder.table === 'proposal_packages') {
          // 行程表 - 從 proposals 關聯
          const { data: proposals } = await supabase
            .from('proposals')
            .select('id, title, created_at, packages:proposal_packages(id, version_name)')
            .eq('converted_tour_id', tourId)
            .order('created_at', { ascending: false })
          
          if (proposals) {
            for (const p of proposals) {
              // 每個 proposal 的 packages
              const packages = p.packages as { id: string; version_name: string }[] || []
              for (const pkg of packages) {
                docs.push({
                  id: pkg.id,
                  name: pkg.version_name || p.title || '未命名行程表',
                  type: 'db',
                  subType: 'itinerary',
                  createdAt: p.created_at,
                })
              }
            }
          }
        } else if (folder.table === 'tour_confirmation_sheets') {
          const { data } = await supabase
            .from('tour_confirmation_sheets')
            .select('id, status, created_at')
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false })
          
          if (data) {
            docs.push(...data.map(c => ({
              id: c.id,
              name: `確認單 ${format(new Date(c.created_at), 'yyyy/MM/dd')}`,
              type: 'db' as const,
              subType: 'confirmation',
              createdAt: c.created_at,
              status: c.status,
            })))
          }
        } else if (folder.table === 'contracts') {
          const { data } = await supabase
            .from('contracts')
            .select('id, name, contract_number, status, created_at')
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false })
          
          if (data) {
            docs.push(...data.map(c => ({
              id: c.id,
              name: c.name || c.contract_number || '未命名合約',
              type: 'db' as const,
              subType: 'contract',
              createdAt: c.created_at,
              status: c.status,
            })))
          }
        } else if (folder.table === 'tour_requests') {
          const { data } = await supabase
            .from('tour_requests')
            .select('id, category, supplier_name, status, created_at')
            .eq('tour_id', tourId)
            .order('created_at', { ascending: false })
          
          if (data) {
            docs.push(...data.map(r => ({
              id: r.id,
              name: `${r.category || '需求'} - ${r.supplier_name || '未指定'}`,
              type: 'db' as const,
              subType: 'request',
              createdAt: r.created_at,
              status: r.status,
            })))
          }
        }
      } else {
        // files 表
        const { data } = await supabase
          .from('files')
          .select('id, filename, original_filename, content_type, size_bytes, storage_path, created_at')
          .eq('tour_id', tourId)
          .eq('category', folder.category)
          .order('created_at', { ascending: false })
        
        if (data) {
          docs.push(...data.map(f => ({
            id: f.id,
            name: f.original_filename || f.filename,
            type: 'file' as const,
            createdAt: f.created_at,
            mimeType: f.content_type || undefined,
            size: f.size_bytes || undefined,
            path: f.storage_path,
          })))
        }
      }

      setDocuments(docs)
    } catch (err) {
      logger.error('載入資料夾內容失敗', err)
    } finally {
      setLoadingDocs(false)
    }
  }, [tourId])

  useEffect(() => {
    loadFolderCounts()
  }, [loadFolderCounts])

  useEffect(() => {
    if (selectedFolder) {
      loadFolderContent(selectedFolder)
    }
  }, [selectedFolder, loadFolderContent])

  // 處理文件點擊（DB 驅動的文件）
  const handleDocumentClick = (doc: DocumentItem) => {
    if (doc.type === 'db') {
      // 根據類型導航到對應頁面
      switch (doc.subType) {
        case 'quote':
          router.push(`/quotes/${doc.id}`)
          break
        case 'itinerary':
          // 開啟行程表 dialog 或頁面
          router.push(`/proposals?package=${doc.id}`)
          break
        case 'confirmation':
          router.push(`/confirmations/${doc.id}`)
          break
        case 'contract':
          router.push(`/contracts?id=${doc.id}`)
          break
        case 'request':
          // 可能需要開啟 dialog
          toast({ title: '需求單詳情', description: `ID: ${doc.id}` })
          break
      }
    }
  }

  // 處理檔案下載
  const handleDownload = async (doc: DocumentItem) => {
    if (doc.type === 'file' && doc.path) {
      const { data } = await supabase.storage
        .from('workspace-files')
        .createSignedUrl(doc.path, 60)
      
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    }
  }

  // 處理建立新文件
  const handleCreate = (folder: FolderConfig) => {
    switch (folder.category) {
      case 'quote':
        router.push(`/quotes/new?tour_id=${tourId}`)
        break
      case 'itinerary':
        router.push(`/proposals/new?tour_id=${tourId}`)
        break
      case 'confirmation':
        router.push(`/confirmations/new?tour_id=${tourId}`)
        break
      case 'contract':
        router.push(`/contracts/new?tour_id=${tourId}`)
        break
      case 'request':
        // 需求單通常從需求總覽建立
        toast({ title: '請從「需求總覽」建立需求單' })
        break
      default:
        // 上傳檔案的資料夾
        toast({ title: '上傳功能開發中' })
    }
  }

  // 處理拖曳上傳
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (!selectedFolder || selectedFolder.dataSource !== 'files') {
      toast({ title: '此資料夾不支援上傳', variant: 'destructive' })
      return
    }

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    toast({ title: `準備上傳 ${files.length} 個檔案...` })
    // TODO: 實作實際上傳邏輯
  }, [selectedFolder, toast])

  // 格式化檔案大小
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // 取得狀態標籤樣式
  const getStatusBadge = (status?: string) => {
    if (!status) return null
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700',
      sent: 'bg-blue-100 text-blue-700',
      confirmed: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    const labels: Record<string, string> = {
      draft: '草稿',
      pending: '待處理',
      sent: '已發送',
      confirmed: '已確認',
      cancelled: '已取消',
    }
    return (
      <span className={cn('px-2 py-0.5 rounded text-xs', styles[status] || 'bg-gray-100')}>
        {labels[status] || status}
      </span>
    )
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
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {DEFAULT_TOUR_FOLDERS.map((folder) => (
            <button
              key={folder.category}
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
                {folderCounts[folder.category] || 0} 項
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 資料夾內容 */}
      {selectedFolder && (
        <div
          className={cn(
            'border border-border rounded-lg overflow-hidden',
            isDragging && selectedFolder.dataSource === 'files' && 'border-morandi-gold border-2 bg-morandi-gold/5'
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {/* 標題列 */}
          <div className="flex items-center justify-between px-4 py-3 bg-morandi-container/30 border-b border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedFolder(null); setDocuments([]) }}
                className="h-8 px-2"
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-xl">{selectedFolder.icon}</span>
              <span className="font-medium">{selectedFolder.name}</span>
              <span className="text-sm text-morandi-secondary">
                ({documents.length} 項)
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => handleCreate(selectedFolder)}
              className="h-8 gap-1"
            >
              <Plus size={14} />
              {selectedFolder.createLabel}
            </Button>
          </div>

          {/* 內容列表 */}
          {loadingDocs ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-morandi-gold mx-auto" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center text-morandi-secondary">
              <Folder size={32} className="mx-auto mb-3 opacity-50" />
              <p>尚無資料</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCreate(selectedFolder)}
                className="mt-3"
              >
                <Plus size={14} className="mr-1" />
                {selectedFolder.createLabel}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {documents.map(doc => (
                <div
                  key={doc.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 hover:bg-morandi-container/20',
                    doc.type === 'db' && 'cursor-pointer'
                  )}
                  onClick={() => doc.type === 'db' && handleDocumentClick(doc)}
                >
                  <div className="w-10 h-10 rounded-lg bg-morandi-container flex items-center justify-center text-morandi-secondary">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-morandi-primary truncate flex items-center gap-2">
                      {doc.name}
                      {getStatusBadge(doc.status)}
                    </div>
                    <div className="text-xs text-morandi-secondary flex items-center gap-2">
                      {doc.size && <span>{formatFileSize(doc.size)}</span>}
                      <span>
                        {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: zhTW })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.type === 'db' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={(e) => { e.stopPropagation(); handleDocumentClick(doc) }}
                      >
                        <ExternalLink size={14} />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
