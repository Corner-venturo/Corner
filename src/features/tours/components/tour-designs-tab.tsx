'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Globe, FileText, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { COMP_TOURS_LABELS } from '../constants/labels'
import { logger } from '@/lib/utils/logger'

interface DesignItem {
  id: string
  title: string
  type: 'itinerary' | 'brochure'
  status: string
  updatedAt: string
  isSelected: boolean // 是否為選定版本
}

interface TourDesignsTabProps {
  tourId: string
}

export function TourDesignsTab({ tourId }: TourDesignsTabProps) {
  const router = useRouter()
  const [designs, setDesigns] = useState<DesignItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDesigns = async () => {
      setLoading(true)
      const allDesigns: DesignItem[] = []

      // 取得直接關聯到此團的設計（tour_id = tourId）
      const { data: directDesigns } = await supabase
        .from('itineraries')
        .select('id, title, status, updated_at')
        .eq('tour_id', tourId)

      if (directDesigns) {
        directDesigns.forEach(d => {
          allDesigns.push({
            id: d.id,
            title: d.title || COMP_TOURS_LABELS.未命名行程,
            type: 'itinerary',
            status: d.status || COMP_TOURS_LABELS.草稿,
            updatedAt: d.updated_at,
            isSelected: true,
          })
        })
      }

      // 按更新時間排序
      allDesigns.sort((a, b) => {
        if (a.isSelected && !b.isSelected) return -1
        if (!a.isSelected && b.isSelected) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      setDesigns(allDesigns)
      setLoading(false)
    }

    if (tourId) {
      fetchDesigns().catch(err => logger.error('[fetchDesigns]', err))
    }
  }, [tourId])

  const handleOpenDesign = (design: DesignItem) => {
    if (design.type === 'itinerary') {
      router.push(`/itinerary/new?itinerary_id=${design.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-morandi-muted" />
      </div>
    )
  }

  if (designs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-morandi-muted">
        <Globe className="w-12 h-12 mb-4 opacity-50" />
        <p>{COMP_TOURS_LABELS.EMPTY_3090}</p>
        <p className="text-sm mt-1">{COMP_TOURS_LABELS.LABEL_5671}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="space-y-3">
        {designs.map(design => (
          <div
            key={design.id}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer hover:bg-morandi-bg/50',
              design.isSelected
                ? 'border-morandi-green/50 bg-morandi-green/5'
                : 'border-morandi-muted/30'
            )}
            onClick={() => handleOpenDesign(design)}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  design.type === 'itinerary' ? 'bg-morandi-green/10' : 'bg-morandi-blue/10'
                )}
              >
                {design.type === 'itinerary' ? (
                  <Globe className="w-5 h-5 text-morandi-green" />
                ) : (
                  <FileText className="w-5 h-5 text-morandi-blue" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-morandi-primary">{design.title}</span>
                  {design.isSelected && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-morandi-green/20 text-morandi-green">
                      {COMP_TOURS_LABELS.LABEL_6192}
                    </span>
                  )}
                </div>
                <div className="text-sm text-morandi-secondary">
                  {design.type === 'itinerary'
                    ? COMP_TOURS_LABELS.網頁行程
                    : COMP_TOURS_LABELS.手冊}{' '}
                  · {design.status}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <ExternalLink className="w-4 h-4" />
              {COMP_TOURS_LABELS.LABEL_1670}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
