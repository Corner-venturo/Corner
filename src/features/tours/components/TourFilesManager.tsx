'use client'

/**
 * TourFilesManager - 團檔案的 Finder 風格介面
 *
 * 整合 FinderView 與團資料，支援：
 * - 巢狀資料夾結構
 * - DB 驅動的虛擬資料夾（報價單、確認單等）
 * - 實體檔案上傳
 * - 拖曳移動
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { createFolder, updateFolder, deleteFolder } from '@/data/entities/folders'
import { createFile, updateFile, deleteFile } from '@/data/entities/files'
import { useAuthStore } from '@/stores/auth-store'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { FinderView, type FinderItem } from '@/features/files/components'
import { useRouter } from 'next/navigation'
import type { Folder, VenturoFile } from '@/types/file-system.types'
import { COMP_TOURS_LABELS } from '../constants/labels'

interface TourFilesManagerProps {
  tourId: string
  tourCode: string
  /** 團關聯的報價單 ID（1:1） */
  quoteId?: string | null
  /** 團關聯的行程表 ID（1:1） */
  itineraryId?: string | null
}

// 檔案分類類型（對應 DB enum）
type FileCategory =
  | 'quote'
  | 'itinerary'
  | 'confirmation'
  | 'request'
  | 'passport'
  | 'visa'
  | 'ticket'
  | 'voucher'
  | 'insurance'
  | 'other'
  | 'contract'
  | 'invoice'
  | 'photo'
  | 'email_attachment'
  | 'cancellation'
type DbType = 'quote' | 'quick_quote' | 'itinerary' | 'confirmation' | 'request'

interface TourFolder {
  name: string
  category: FileCategory | 'quick_quote' // quick_quote 是虛擬分類，不存在於 DB
  icon: string
  dbType?: DbType
}

// 預設的團資料夾結構
const DEFAULT_TOUR_FOLDERS: TourFolder[] = [
  { name: COMP_TOURS_LABELS.團體報價單, category: 'quote', icon: '📋', dbType: 'quote' },
  { name: COMP_TOURS_LABELS.快速報價, category: 'quick_quote', icon: '💰', dbType: 'quick_quote' },
  { name: COMP_TOURS_LABELS.行程表, category: 'itinerary', icon: '🗺️', dbType: 'itinerary' },
  { name: COMP_TOURS_LABELS.確認單, category: 'confirmation', icon: '✅', dbType: 'confirmation' },
  { name: COMP_TOURS_LABELS.合約, category: 'contract', icon: '📝' },
  { name: COMP_TOURS_LABELS.需求單, category: 'request', icon: '📨', dbType: 'request' },
  { name: COMP_TOURS_LABELS.護照, category: 'passport', icon: '🛂' },
  { name: COMP_TOURS_LABELS.簽證, category: 'visa', icon: '📄' },
  { name: COMP_TOURS_LABELS.機票, category: 'ticket', icon: '✈️' },
  { name: COMP_TOURS_LABELS.住宿憑證, category: 'voucher', icon: '🏨' },
  { name: COMP_TOURS_LABELS.保險, category: 'insurance', icon: '🛡️' },
  { name: COMP_TOURS_LABELS.其他, category: 'other', icon: '📁' },
]

export function TourFilesManager({
  tourId,
  tourCode,
  quoteId,
  itineraryId,
}: TourFilesManagerProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const workspaceId = user?.workspace_id

  const [items, setItems] = useState<FinderItem[]>([])
  const [currentPath, setCurrentPath] = useState<FinderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 當前資料夾 ID（null = 根目錄）
  const currentFolderId = currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null

  // 載入資料夾內容
  const loadFolderContent = useCallback(
    async (folderId: string | null) => {
      setLoading(true)
      const newItems: FinderItem[] = []

      try {
        if (folderId === null) {
          // 根目錄：顯示預設資料夾 + 自訂資料夾
          for (const folder of DEFAULT_TOUR_FOLDERS) {
            let count = 0

            // 計算數量
            if (folder.dbType) {
              // DB 驅動的資料夾
              if (folder.dbType === 'quote') {
                // 團體報價單：用 tour_id 查詢（排除快速報價）
                const { count: c } = await supabase
                  .from('quotes')
                  .select('id', { count: 'exact', head: true })
                  .eq('tour_id', tourId)
                  .or('quote_type.is.null,quote_type.eq.standard')
                count = c || 0
              } else if (folder.dbType === 'quick_quote') {
                // 快速報價：1:N，用 quotes.tour_id + quote_type 查
                const { count: c } = await supabase
                  .from('quotes')
                  .select('id', { count: 'exact', head: true })
                  .eq('tour_id', tourId)
                  .eq('quote_type', 'quick')
                count = c || 0
              } else if (folder.dbType === 'itinerary') {
                // 行程表：用 tour_id 查詢
                const { count: c } = await supabase
                  .from('itineraries')
                  .select('id', { count: 'exact', head: true })
                  .eq('tour_id', tourId)
                count = c || 0
              } else {
                // 其他（1:N）：用 tour_id 查
                const table =
                  folder.dbType === 'confirmation' ? 'tour_confirmation_sheets' : 'tour_requests'

                const { count: c } = await supabase
                  .from(table)
                  .select('id', { count: 'exact', head: true })
                  .eq('tour_id', tourId)
                count = c || 0
              }
            } else {
              // 檔案資料夾（這裡的 folder.category 一定是有效的 FileCategory）
              const { count: c } = await supabase
                .from('files')
                .select('id', { count: 'exact', head: true })
                .eq('tour_id', tourId)
                .eq('category', folder.category as FileCategory)
              count = c || 0
            }

            newItems.push({
              id: `folder-${folder.category}`,
              name: folder.name,
              type: 'folder',
              icon: folder.icon,
              parentId: null,
              createdAt: new Date().toISOString(),
              childCount: count,
              dbType: folder.dbType,
            })
          }

          // 載入自訂子資料夾
          const { data: customFolders } = await supabase
            .from('folders')
            .select('*')
            .eq('tour_id', tourId)
            .is('parent_id', null)
            .order('sort_order')
            .limit(500)

          if (customFolders) {
            for (const folder of customFolders) {
              newItems.push({
                id: folder.id,
                name: folder.name,
                type: 'folder',
                icon: folder.icon || '📁',
                color: folder.color || undefined,
                parentId: null,
                createdAt: folder.created_at,
              })
            }
          }
        } else if (folderId.startsWith('folder-')) {
          // 預設資料夾內容
          const category = folderId.replace('folder-', '')
          const folderConfig = DEFAULT_TOUR_FOLDERS.find(f => f.category === category)

          if (folderConfig?.dbType) {
            // DB 驅動的資料夾
            await loadDbFolderContent(folderConfig.dbType, newItems)
          } else {
            // 檔案資料夾
            const { data: files } = await supabase
              .from('files')
              .select('*')
              .eq('tour_id', tourId)
              .eq('category', category as FileCategory)
              .order('created_at', { ascending: false })
              .limit(500)

            if (files) {
              for (const file of files) {
                newItems.push({
                  id: file.id,
                  name: file.original_filename || file.filename,
                  type: 'file',
                  parentId: folderId,
                  createdAt: file.created_at,
                  size: file.size_bytes || undefined,
                  mimeType: file.content_type || undefined,
                  extension: file.extension || undefined,
                })
              }
            }
          }
        } else {
          // 自訂資料夾
          // 載入子資料夾
          const { data: subFolders } = await supabase
            .from('folders')
            .select('*')
            .eq('parent_id', folderId)
            .order('sort_order')
            .limit(500)

          if (subFolders) {
            for (const folder of subFolders) {
              newItems.push({
                id: folder.id,
                name: folder.name,
                type: 'folder',
                icon: folder.icon || '📁',
                color: folder.color || undefined,
                parentId: folderId,
                createdAt: folder.created_at,
              })
            }
          }

          // 載入檔案
          const { data: files } = await supabase
            .from('files')
            .select('*')
            .eq('folder_id', folderId)
            .order('created_at', { ascending: false })
            .limit(500)

          if (files) {
            for (const file of files) {
              newItems.push({
                id: file.id,
                name: file.original_filename || file.filename,
                type: 'file',
                parentId: folderId,
                createdAt: file.created_at,
                size: file.size_bytes || undefined,
                mimeType: file.content_type || undefined,
                extension: file.extension || undefined,
              })
            }
          }
        }

        setItems(newItems)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.載入資料夾失敗, err)
        toast.error(COMP_TOURS_LABELS.載入失敗)
      } finally {
        setLoading(false)
      }
    },
    [tourId, quoteId, itineraryId]
  )

  // 載入 DB 驅動的資料夾內容
  const loadDbFolderContent = async (
    dbType: 'quote' | 'quick_quote' | 'itinerary' | 'confirmation' | 'request',
    items: FinderItem[]
  ) => {
    const folderId = `folder-${dbType}`

    switch (dbType) {
      case 'quote': {
        // 團體報價單：用 tour_id 查詢（排除快速報價）
        const { data } = await supabase
          .from('quotes')
          .select('id, code, name, status, created_at')
          .eq('tour_id', tourId)
          .or('quote_type.is.null,quote_type.eq.standard')
          .order('created_at', { ascending: false })

        if (data) {
          for (const q of data) {
            items.push({
              id: q.id,
              name: q.name || q.code || COMP_TOURS_LABELS.未命名報價單,
              type: 'file',
              icon: '📋',
              parentId: folderId,
              createdAt: q.created_at,
              status: q.status,
              dbType: 'quote',
              dbId: q.id,
            })
          }
        }
        break
      }
      case 'quick_quote': {
        // 快速報價：1:N 關聯，用 quotes.tour_id
        const { data } = await supabase
          .from('quotes')
          .select('id, code, name, status, created_at')
          .eq('tour_id', tourId)
          .eq('quote_type', 'quick')
          .order('created_at', { ascending: false })

        if (data) {
          for (const q of data) {
            items.push({
              id: q.id,
              name: q.name || q.code || COMP_TOURS_LABELS.未命名快速報價,
              type: 'file',
              icon: '💰',
              parentId: folderId,
              createdAt: q.created_at,
              status: q.status,
              dbType: 'quick_quote',
              dbId: q.id,
            })
          }
        }
        break
      }
      case 'itinerary': {
        // 行程表：用 tour_id 查詢
        const { data } = await supabase
          .from('itineraries')
          .select('id, title, code, created_at')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })

        if (data) {
          for (const i of data) {
            items.push({
              id: i.id,
              name: i.title || i.code || COMP_TOURS_LABELS.未命名行程表,
              type: 'file',
              icon: '🗺️',
              parentId: folderId,
              createdAt: i.created_at,
              dbType: 'itinerary',
              dbId: i.id,
            })
          }
        }
        break
      }
      case 'confirmation': {
        const { data } = await supabase
          .from('tour_confirmation_sheets')
          .select('id, status, created_at')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })

        if (data) {
          for (const c of data) {
            items.push({
              id: c.id,
              name: `確認單`,
              type: 'file',
              icon: '✅',
              parentId: folderId,
              createdAt: c.created_at,
              status: c.status,
              dbType: 'confirmation',
              dbId: c.id,
            })
          }
        }
        break
      }
      case 'request': {
        const { data } = await supabase
          .from('tour_requests')
          .select('id, category, supplier_name, status, created_at')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })

        if (data) {
          for (const r of data) {
            items.push({
              id: r.id,
              name: `${r.category || COMP_TOURS_LABELS.需求} - ${r.supplier_name || COMP_TOURS_LABELS.未指定}`,
              type: 'file',
              icon: '📨',
              parentId: folderId,
              createdAt: r.created_at,
              status: r.status,
              dbType: 'request',
              dbId: r.id,
            })
          }
        }
        break
      }
    }
  }

  // 導航到資料夾
  const handleNavigate = useCallback(
    async (folderId: string | null) => {
      setSelectedIds(new Set())

      if (folderId === null) {
        // 回到根目錄
        setCurrentPath([])
      } else {
        // 檢查是否是返回上層
        const existingIndex = currentPath.findIndex(p => p.id === folderId)
        if (existingIndex >= 0) {
          // 返回到該層
          setCurrentPath(currentPath.slice(0, existingIndex + 1))
        } else {
          // 進入新資料夾
          const folder = items.find(i => i.id === folderId && i.type === 'folder')
          if (folder) {
            setCurrentPath([...currentPath, folder])
          }
        }
      }

      await loadFolderContent(folderId)
    },
    [currentPath, items, loadFolderContent]
  )

  // 開啟項目
  const handleOpen = useCallback(
    (item: FinderItem) => {
      if (item.dbType && item.dbId) {
        // DB 驅動的項目
        switch (item.dbType) {
          case 'quote':
            router.push(`/quotes/${item.dbId}`)
            break
          case 'quick_quote':
            router.push(`/quotes/quick/${item.dbId}`)
            break
          case 'itinerary':
            router.push(`/itinerary/block-editor?itinerary_id=${item.dbId}`)
            break
          case 'confirmation':
            router.push(`/tours/${tourId}/confirmation`)
            break
          case 'request':
            toast.info(COMP_TOURS_LABELS.需求單功能開發中)
            break
        }
      } else if (item.type === 'file') {
        // 實體檔案 - 下載或預覽
        handleDownload(item)
      }
    },
    [router, tourId]
  )

  // 下載檔案
  const handleDownload = useCallback(async (item: FinderItem) => {
    try {
      const { data: file } = await supabase
        .from('files')
        .select('storage_path, storage_bucket')
        .eq('id', item.id)
        .single()

      if (file?.storage_path) {
        const { data } = await supabase.storage
          .from(file.storage_bucket || 'workspace-files')
          .createSignedUrl(file.storage_path, 60)

        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank')
        }
      }
    } catch (err) {
      logger.error(COMP_TOURS_LABELS.下載失敗, err)
      toast.error(COMP_TOURS_LABELS.下載失敗)
    }
  }, [])

  // 移動檔案
  const handleMove = useCallback(
    async (itemIds: string[], targetFolderId: string | null) => {
      try {
        // 只移動實體檔案，DB 項目不能移動
        const fileIds = itemIds.filter(id => !id.startsWith('folder-'))

        for (const fileId of fileIds) {
          await supabase.from('files').update({ folder_id: targetFolderId }).eq('id', fileId)
        }

        toast.success(`已移動 ${fileIds.length} 個項目`)
        await loadFolderContent(currentFolderId)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.移動失敗, err)
        toast.error(COMP_TOURS_LABELS.移動失敗)
      }
    },
    [currentFolderId, loadFolderContent]
  )

  // 刪除
  const handleDelete = useCallback(
    async (itemIds: string[]) => {
      if (!confirm(`確定要刪除 ${itemIds.length} 個項目嗎？`)) return

      try {
        for (const id of itemIds) {
          if (id.startsWith('folder-')) continue // 不能刪除預設資料夾

          // 檢查是否是資料夾
          const item = items.find(i => i.id === id)
          if (item?.type === 'folder') {
            await deleteFolder(id)
          } else if (!item?.dbType) {
            // 只能刪除實體檔案
            await deleteFile(id)
          }
        }

        toast.success(COMP_TOURS_LABELS.已刪除)
        setSelectedIds(new Set())
        await loadFolderContent(currentFolderId)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.刪除失敗, err)
        toast.error(COMP_TOURS_LABELS.刪除失敗)
      }
    },
    [currentFolderId, items, loadFolderContent]
  )

  // 建立資料夾
  const handleCreateFolder = useCallback(
    async (name: string, parentId: string | null) => {
      if (!workspaceId) return

      try {
        const actualParentId = parentId?.startsWith('folder-') ? null : parentId

        await createFolder({
          tour_id: tourId,
          name,
          parent_id: actualParentId,
          folder_type: 'tour',
          path: `/${tourCode}/${name}`,
          depth: currentPath.length + 1,
          is_system: false,
          sort_order: items.filter(i => i.type === 'folder').length,
        })

        toast.success(COMP_TOURS_LABELS.已建立資料夾)
        await loadFolderContent(currentFolderId)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.建立資料夾失敗, err)
        toast.error(COMP_TOURS_LABELS.建立失敗)
      }
    },
    [workspaceId, tourId, tourCode, currentPath.length, items, currentFolderId, loadFolderContent]
  )

  // 上傳檔案
  const handleUpload = useCallback(
    async (files: FileList, folderId: string | null) => {
      if (!workspaceId) return

      const category = (
        folderId?.startsWith('folder-') ? folderId.replace('folder-', '') : 'other'
      ) as FileCategory
      const actualFolderId = folderId?.startsWith('folder-') ? null : folderId

      try {
        for (const file of Array.from(files)) {
          // 產生唯一檔名
          const ext = file.name.split('.').pop() || ''
          const filename = `${tourId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

          // 上傳到 Storage
          const { error: uploadError } = await supabase.storage
            .from('workspace-files')
            .upload(filename, file)

          if (uploadError) throw uploadError

          // 寫入 DB
          await createFile({
            tour_id: tourId,
            folder_id: actualFolderId,
            filename,
            original_filename: file.name,
            content_type: file.type,
            size_bytes: file.size,
            extension: ext,
            storage_path: filename,
            storage_bucket: 'workspace-files',
            category: category as string,
            source: 'upload',
          })
        }

        toast.success(`已上傳 ${files.length} 個檔案`)
        await loadFolderContent(currentFolderId)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.上傳失敗, err)
        toast.error(COMP_TOURS_LABELS.上傳失敗)
      }
    },
    [workspaceId, tourId, currentFolderId, loadFolderContent]
  )

  // 重新命名
  const handleRename = useCallback(
    async (itemId: string, newName: string) => {
      try {
        const item = items.find(i => i.id === itemId)
        if (!item) return

        if (item.type === 'folder' && !itemId.startsWith('folder-')) {
          await updateFolder(itemId, { name: newName })
        } else if (item.type === 'file' && !item.dbType) {
          await updateFile(itemId, { original_filename: newName })
        } else {
          toast.error(COMP_TOURS_LABELS.此項目無法重新命名)
          return
        }

        toast.success(COMP_TOURS_LABELS.已重新命名)
        await loadFolderContent(currentFolderId)
      } catch (err) {
        logger.error(COMP_TOURS_LABELS.重新命名失敗, err)
        toast.error(COMP_TOURS_LABELS.重新命名失敗)
      }
    },
    [items, currentFolderId, loadFolderContent]
  )

  // 初始載入
  useEffect(() => {
    loadFolderContent(null)
  }, [loadFolderContent])

  // 根據當前資料夾類型，決定空狀態的新增操作
  const getEmptyStateAction = useCallback(() => {
    if (!currentFolderId?.startsWith('folder-')) return undefined

    const category = currentFolderId.replace('folder-', '')
    const folderConfig = DEFAULT_TOUR_FOLDERS.find(f => f.category === category)

    if (!folderConfig?.dbType) return undefined // 檔案資料夾用上傳

    const actions: Record<string, { label: string; path: string }> = {
      quote: { label: COMP_TOURS_LABELS.前往報價單, path: `/quotes` },
      quick_quote: {
        label: COMP_TOURS_LABELS.新增快速報價,
        path: `/quotes/quick?tour_id=${tourId}`,
      },
      itinerary: {
        label: COMP_TOURS_LABELS.新增行程表,
        path: `/itinerary/block-editor?tour_id=${tourId}`,
      },
      confirmation: {
        label: COMP_TOURS_LABELS.建立確認單,
        path: `/tours/${tourCode}/confirmation`,
      },
      request: { label: COMP_TOURS_LABELS.新增需求單, path: `/tours/${tourCode}?tab=requirements` },
    }

    const action = actions[folderConfig.dbType]
    if (!action) return undefined

    return {
      label: action.label,
      onClick: () => router.push(action.path),
    }
  }, [currentFolderId, tourId, router])

  return (
    <div className="h-[600px] border rounded-lg overflow-hidden bg-background">
      <FinderView
        items={items}
        currentPath={currentPath}
        loading={loading}
        selectedIds={selectedIds}
        onNavigate={handleNavigate}
        onSelect={setSelectedIds}
        onOpen={handleOpen}
        onMove={handleMove}
        onDelete={handleDelete}
        onRename={handleRename}
        onCreateFolder={handleCreateFolder}
        onUpload={handleUpload}
        onDownload={handleDownload}
        emptyStateAction={getEmptyStateAction()}
      />
    </div>
  )
}
