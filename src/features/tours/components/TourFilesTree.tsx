'use client'

/**
 * TourFilesTree - 團檔案的樹狀展開介面
 * 
 * 用 TreeView 取代 FinderView，特點：
 * - 點擊展開/收合（不用點進去再返回）
 * - 可以同時看到多個資料夾內容
 * - 支援拖曳移動
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/utils/logger'
import { toast } from 'sonner'
import { TreeView, type TreeItem } from '@/components/files'
import { useRouter } from 'next/navigation'
import { COMP_TOURS_LABELS } from '../constants/labels'

interface TourFilesTreeProps {
  tourId: string
  tourCode: string
  quoteId?: string | null
  itineraryId?: string | null
}

// 檔案分類類型（對應 DB enum）
type FileCategory = 'quote' | 'itinerary' | 'confirmation' | 'request' | 'passport' | 'visa' | 'ticket' | 'voucher' | 'insurance' | 'other' | 'contract' | 'invoice' | 'photo' | 'email_attachment' | 'cancellation'

// 預設的團資料夾結構
const DEFAULT_FOLDERS = [
  { id: 'quote', name: COMP_TOURS_LABELS.團體報價單, icon: '📋', dbType: 'quote' as const },
  { id: 'quick_quote', name: COMP_TOURS_LABELS.快速報價, icon: '💰', dbType: 'quick_quote' as const },
  { id: 'itinerary', name: COMP_TOURS_LABELS.行程表, icon: '🗺️', dbType: 'itinerary' as const },
  { id: 'confirmation', name: COMP_TOURS_LABELS.確認單, icon: '✅', dbType: 'confirmation' as const },
  { id: 'contract', name: COMP_TOURS_LABELS.合約, icon: '📝', category: 'contract' as FileCategory },
  { id: 'request', name: COMP_TOURS_LABELS.需求單, icon: '📨', dbType: 'request' as const },
  { id: 'passport', name: COMP_TOURS_LABELS.護照, icon: '🛂', category: 'passport' as FileCategory },
  { id: 'visa', name: COMP_TOURS_LABELS.簽證, icon: '📄', category: 'visa' as FileCategory },
  { id: 'ticket', name: COMP_TOURS_LABELS.機票, icon: '✈️', category: 'ticket' as FileCategory },
  { id: 'voucher', name: COMP_TOURS_LABELS.住宿憑證, icon: '🏨', category: 'voucher' as FileCategory },
  { id: 'insurance', name: COMP_TOURS_LABELS.保險, icon: '🛡️', category: 'insurance' as FileCategory },
  { id: 'other', name: COMP_TOURS_LABELS.其他, icon: '📁', category: 'other' as FileCategory },
]

export function TourFilesTree({ tourId, tourCode, quoteId, itineraryId }: TourFilesTreeProps) {
  const router = useRouter()
  const [items, setItems] = useState<TreeItem[]>([])
  const [loading, setLoading] = useState(true)

  // 載入資料夾結構（含子項目數量）
  const loadFolders = useCallback(async () => {
    setLoading(true)
    try {
      const folderItems: TreeItem[] = []

      for (const folder of DEFAULT_FOLDERS) {
        let childCount = 0

        // 計算數量
        if (folder.dbType === 'quote') {
          // 用 tour_id 查詢，支援 1:N 關聯（排除快速報價）
          const { count } = await supabase
            .from('quotes')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
            .or('quote_type.is.null,quote_type.neq.quick')
          childCount = count || 0
        } else if (folder.dbType === 'quick_quote') {
          const { count } = await supabase
            .from('quotes')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
            .eq('quote_type', 'quick')
          childCount = count || 0
        } else if (folder.dbType === 'itinerary') {
          // 用 tour_id 查詢，支援 1:N 關聯
          const { count } = await supabase
            .from('itineraries')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
          childCount = count || 0
        } else if (folder.dbType === 'confirmation') {
          const { count } = await supabase
            .from('tour_confirmation_sheets')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
          childCount = count || 0
        } else if (folder.dbType === 'request') {
          const { count } = await supabase
            .from('tour_requests')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
          childCount = count || 0
        } else if (folder.category) {
          const { count } = await supabase
            .from('files')
            .select('id', { count: 'exact', head: true })
            .eq('tour_id', tourId)
            .eq('category', folder.category)
          childCount = count || 0
        }

        folderItems.push({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          icon: folder.icon,
          childCount,
          data: { dbType: folder.dbType, category: folder.category },
        })
      }

      setItems(folderItems)
    } catch (err) {
      logger.error(COMP_TOURS_LABELS.載入資料夾失敗, err)
      toast.error(COMP_TOURS_LABELS.載入失敗)
    } finally {
      setLoading(false)
    }
  }, [tourId, quoteId, itineraryId])

  // 載入子項目
  const loadChildren = useCallback(async (folder: TreeItem): Promise<TreeItem[]> => {
    const dbType = folder.data?.dbType as string | undefined
    const category = folder.data?.category as string | undefined
    const children: TreeItem[] = []

    try {
      if (dbType === 'quote') {
        // 用 tour_id 查詢，支援 1:N 關聯（排除快速報價）
        const { data } = await supabase
          .from('quotes')
          .select('id, code, name')
          .eq('tour_id', tourId)
          .or('quote_type.is.null,quote_type.eq.standard')
          .order('created_at', { ascending: false })
        if (data) {
          for (const q of data) {
            children.push({
              id: q.id,
              name: q.name || q.code || COMP_TOURS_LABELS.未命名報價單,
              type: 'file',
              icon: '📋',
              data: { dbType: 'quote', dbId: q.id },
            })
          }
        }
      } else if (dbType === 'quick_quote') {
        const { data } = await supabase
          .from('quotes')
          .select('id, code, name')
          .eq('tour_id', tourId)
          .eq('quote_type', 'quick')
          .order('created_at', { ascending: false })
        if (data) {
          for (const q of data) {
            children.push({
              id: q.id,
              name: q.name || q.code || COMP_TOURS_LABELS.未命名快速報價,
              type: 'file',
              icon: '💰',
              data: { dbType: 'quick_quote', dbId: q.id },
            })
          }
        }
      } else if (dbType === 'itinerary') {
        // 用 tour_id 查詢，支援 1:N 關聯
        const { data } = await supabase
          .from('itineraries')
          .select('id, title, code')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })
        if (data) {
          for (const i of data) {
            children.push({
              id: i.id,
              name: i.title || i.code || COMP_TOURS_LABELS.未命名行程表,
              type: 'file',
              icon: '🗺️',
              data: { dbType: 'itinerary', dbId: i.id },
            })
          }
        }
      } else if (dbType === 'confirmation') {
        const { data } = await supabase
          .from('tour_confirmation_sheets')
          .select('id, status')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })
        if (data) {
          for (const c of data) {
            children.push({
              id: c.id,
              name: `確認單`,
              type: 'file',
              icon: '✅',
              data: { dbType: 'confirmation', dbId: c.id },
            })
          }
        }
      } else if (dbType === 'request') {
        const { data } = await supabase
          .from('tour_requests')
          .select('id, code, supplier_name, request_type')
          .eq('tour_id', tourId)
          .order('created_at', { ascending: false })
        if (data) {
          for (const r of data) {
            children.push({
              id: r.id,
              name: `${r.request_type || COMP_TOURS_LABELS.需求} - ${r.supplier_name || r.code}`,
              type: 'file',
              icon: '📨',
              data: { dbType: 'request', dbId: r.id },
            })
          }
        }
      } else if (category) {
        const { data } = await supabase
          .from('files')
          .select('id, filename, content_type')
          .eq('tour_id', tourId)
          .eq('category', category as FileCategory)
          .order('created_at', { ascending: false })
        if (data) {
          for (const f of data) {
            children.push({
              id: f.id,
              name: f.filename,
              type: 'file',
              data: { fileId: f.id, mimeType: f.content_type },
            })
          }
        }
      }
    } catch (err) {
      logger.error(COMP_TOURS_LABELS.載入子項目失敗, err)
    }

    return children
  }, [tourId, quoteId, itineraryId])

  // 處理項目雙擊（開啟）
  const handleDoubleClick = useCallback((item: TreeItem) => {
    const dbType = item.data?.dbType as string | undefined
    const dbId = item.data?.dbId as string | undefined

    if (dbType && dbId) {
      switch (dbType) {
        case 'quote':
          router.push(`/quotes/${dbId}`)
          break
        case 'quick_quote':
          router.push(`/quotes/quick/${dbId}`)
          break
        case 'itinerary':
          router.push(`/itinerary/block-editor?itinerary_id=${dbId}`)
          break
        case 'confirmation':
          router.push(`/tours/${tourCode}/confirmation`)
          break
        case 'request':
          toast.info(COMP_TOURS_LABELS.需求單功能開發中)
          break
      }
    } else if (item.data?.fileId) {
      // 實體檔案 - 下載或預覽
      toast.info(COMP_TOURS_LABELS.檔案預覽功能開發中)
    }
  }, [router, tourCode])

  // 處理拖曳移動
  const handleMove = useCallback((sourceId: string, targetId: string) => {
    // 檔案移動功能 — 目前僅顯示提示
    toast.info(`移動 ${sourceId} 到 ${targetId}`)
  }, [])

  // 初始載入
  useEffect(() => {
    loadFolders()
  }, [loadFolders])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-background">
      <TreeView
        items={items}
        onLoadChildren={loadChildren}
        onDoubleClick={handleDoubleClick}
        onMove={handleMove}
        draggable
      />
    </div>
  )
}
