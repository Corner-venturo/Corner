'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Plus } from 'lucide-react'
import { ResponsiveHeader } from '@/components/layout/responsive-header'
import { Button } from '@/components/ui/button'
import { DesignList } from './DesignList'
import { useDesigns } from '../hooks/useDesigns'
import { type Design } from '../types'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { logger } from '@/lib/utils/logger'

/**
 * 設計管理頁面
 */
export function DesignPage() {
  const router = useRouter()
  const { deleteDesign } = useDesigns()

  // 新增設計 - 直接跳轉到設計工具
  const handleCreate = useCallback(() => {
    router.push('/brochure')
  }, [router])

  // 編輯設計 - 跳轉到設計工具並帶入參數
  const handleEdit = useCallback((design: Design) => {
    if (!design.tour_id) {
      toast.error('此設計缺少關聯的旅遊團')
      return
    }
    const params = new URLSearchParams()
    params.set('tour_id', design.tour_id)
    if (design.itinerary_id) {
      params.set('itinerary_id', design.itinerary_id)
    }
    router.push(`/brochure?${params.toString()}`)
  }, [router])

  // 處理刪除
  const handleDelete = useCallback(async (design: Design) => {
    const confirmed = await confirm(
      `確定要刪除「${design.name}」嗎？此操作無法復原。`,
      'warning'
    )
    if (!confirmed) return

    try {
      await deleteDesign(design.id)
      toast.success('已刪除設計')
    } catch (error) {
      logger.error('刪除設計失敗:', error)
      toast.error('刪除失敗，請稍後再試')
    }
  }, [deleteDesign])

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="設計"
        icon={Palette}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '設計', href: '/design' },
        ]}
        actions={
          <Button
            onClick={handleCreate}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Plus size={16} />
            新增設計
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <DesignList
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
