'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Palette, Plus, type LucideIcon } from 'lucide-react'
import { ContentPageLayout } from '@/components/layout/content-page-layout'
import { Button } from '@/components/ui/button'
import { DesignList } from './DesignList'
import { useDesigns } from '../hooks/useDesigns'
import { type Design, type DesignCategory } from '../types'
import { toast } from 'sonner'
import { confirm } from '@/lib/ui/alert-dialog'
import { LABELS, DESIGN_COMPONENT_LABELS } from '../constants/labels'
import { logger } from '@/lib/utils/logger'

interface DesignPageProps {
  /** 頁面標題（預設：設計） */
  title?: string
  /** 頁面圖示（預設：Palette） */
  icon?: LucideIcon
  /** 麵包屑 */
  breadcrumb?: Array<{ label: string; href: string }>
  /** 依設計分類篩選 */
  categoryFilter?: DesignCategory[]
}

/**
 * 設計管理頁面
 */
export function DesignPage({
  title = LABELS.design,
  icon = Palette,
  breadcrumb,
  categoryFilter,
}: DesignPageProps) {
  const router = useRouter()
  const { deleteDesign, duplicateDesign } = useDesigns()

  const defaultBreadcrumb = [
    { label: LABELS.home, href: '/dashboard' },
    { label: title, href: '#' },
  ]

  // 新增設計 - 直接跳轉到設計工具
  const handleCreate = useCallback(() => {
    router.push('/design/new')
  }, [router])

  // 編輯設計 - 跳轉到設計工具並帶入參數
  const handleEdit = useCallback((design: Design) => {
    if (!design.tour_id) {
      toast.error(DESIGN_COMPONENT_LABELS.此設計缺少關聯的旅遊團)
      return
    }
    const params = new URLSearchParams()
    params.set('tour_id', design.tour_id)
    if (design.itinerary_id) {
      params.set('itinerary_id', design.itinerary_id)
    }
    router.push(`/design/new?${params.toString()}`)
  }, [router])

  // 處理複製
  const handleDuplicate = useCallback(async (design: Design) => {
    try {
      await duplicateDesign(design)
      toast.success(DESIGN_COMPONENT_LABELS.已複製設計)
    } catch (error) {
      logger.error('複製設計失敗:', error)
      toast.error(DESIGN_COMPONENT_LABELS.複製失敗請稍後再試)
    }
  }, [duplicateDesign])

  // 處理刪除
  const handleDelete = useCallback(async (design: Design) => {
    const confirmed = await confirm(
      LABELS.deleteConfirm(design.name),
      'warning'
    )
    if (!confirmed) return

    try {
      await deleteDesign(design.id)
      toast.success(DESIGN_COMPONENT_LABELS.已刪除設計)
    } catch (error) {
      logger.error('刪除設計失敗:', error)
      toast.error(DESIGN_COMPONENT_LABELS.刪除失敗請稍後再試)
    }
  }, [deleteDesign])

  return (
    <ContentPageLayout
      title={title}
      icon={icon}
      breadcrumb={breadcrumb ?? defaultBreadcrumb}
      headerActions={
        <Button
          onClick={handleCreate}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
        >
          <Plus size={16} />
          {LABELS.addDesign}
        </Button>
      }
    >
      <DesignList
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        categoryFilter={categoryFilter}
      />
    </ContentPageLayout>
  )
}
