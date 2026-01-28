'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Globe, FileText, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DesignItem {
  id: string
  title: string
  type: 'itinerary' | 'brochure'
  status: string
  updatedAt: string
  isSelected: boolean // 是否為選定版本
  packageName?: string // 套件名稱（如果來自提案）
}

interface TourDesignsTabProps {
  tourId: string
  proposalId?: string | null
}

export function TourDesignsTab({ tourId, proposalId }: TourDesignsTabProps) {
  const router = useRouter()
  const [designs, setDesigns] = useState<DesignItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDesigns = async () => {
      setLoading(true)
      const allDesigns: DesignItem[] = []

      // 1. 取得直接關聯到此團的設計（tour_id = tourId）
      const { data: directDesigns } = await supabase
        .from('itineraries')
        .select('id, title, status, updated_at')
        .eq('tour_id', tourId)

      if (directDesigns) {
        directDesigns.forEach(d => {
          allDesigns.push({
            id: d.id,
            title: d.title || '未命名行程',
            type: 'itinerary',
            status: d.status || '草稿',
            updatedAt: d.updated_at,
            isSelected: true,
          })
        })
      }

      // 2. 如果有 proposalId，取得同提案下其他套件的設計
      if (proposalId) {
        const { data: packages } = await supabase
          .from('proposal_packages')
          .select('id, version_name, itinerary_id, is_selected')
          .eq('proposal_id', proposalId)

        if (packages) {
          for (const pkg of packages) {
            if (pkg.itinerary_id) {
              // 檢查是否已經在 allDesigns 中（避免重複）
              const exists = allDesigns.some(d => d.id === pkg.itinerary_id)
              if (!exists) {
                const { data: itinerary } = await supabase
                  .from('itineraries')
                  .select('id, title, status, updated_at')
                  .eq('id', pkg.itinerary_id)
                  .single()

                if (itinerary) {
                  allDesigns.push({
                    id: itinerary.id,
                    title: itinerary.title || '未命名行程',
                    type: 'itinerary',
                    status: itinerary.status || '草稿',
                    updatedAt: itinerary.updated_at,
                    isSelected: pkg.is_selected || false,
                    packageName: pkg.version_name || undefined,
                  })
                }
              }
            }
          }
        }
      }

      // 按更新時間排序，選定版本置頂
      allDesigns.sort((a, b) => {
        if (a.isSelected && !b.isSelected) return -1
        if (!a.isSelected && b.isSelected) return 1
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })

      setDesigns(allDesigns)
      setLoading(false)
    }

    if (tourId) {
      fetchDesigns()
    }
  }, [tourId, proposalId])

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
        <p>尚無設計</p>
        <p className="text-sm mt-1">可從行程表建立網頁行程設計</p>
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
              <div className={cn(
                'p-2 rounded-lg',
                design.type === 'itinerary' ? 'bg-morandi-green/10' : 'bg-morandi-blue/10'
              )}>
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
                      選定版本
                    </span>
                  )}
                  {design.packageName && !design.isSelected && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-morandi-muted/20 text-morandi-secondary">
                      {design.packageName}
                    </span>
                  )}
                </div>
                <div className="text-sm text-morandi-secondary">
                  {design.type === 'itinerary' ? '網頁行程' : '手冊'} · {design.status}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              <ExternalLink className="w-4 h-4" />
              開啟
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
