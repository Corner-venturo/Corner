'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TourItinerarySelector } from './TourItinerarySelector'
import { useDesigns } from '../hooks/useDesigns'
import { DESIGN_TYPE_CONFIG, DESIGN_CATEGORY_CONFIG, type DesignType, type DesignCategory } from '../types'
import { LABELS, DESIGN_COMPONENT_LABELS } from '../constants/labels'

// 按分類分組設計類型
const DESIGN_TYPES_BY_CATEGORY: Record<DesignCategory, DesignType[]> = {
  brochure: ['brochure_a5', 'brochure_a4'],
  social: ['ig_square', 'ig_portrait', 'ig_story'],
  banner: ['banner_horizontal', 'banner_square'],
}
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

interface CreateDesignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDesignType?: DesignType
  onSuccess?: (designId: string, tourId: string, itineraryId?: string) => void
}

/**
 * 新增設計對話框
 */
export function CreateDesignDialog({
  open,
  onOpenChange,
  defaultDesignType = 'brochure_a4',
  onSuccess,
}: CreateDesignDialogProps) {
  const { createDesign } = useDesigns()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表單狀態
  const [designType, setDesignType] = useState<DesignType>(defaultDesignType)
  const [tourId, setTourId] = useState('')
  const [tourCode, setTourCode] = useState('')
  const [tourName, setTourName] = useState('')
  const [itineraryId, setItineraryId] = useState('')
  const [itineraryName, setItineraryName] = useState('')

  // 重置表單
  const resetForm = () => {
    setDesignType(defaultDesignType)
    setTourId('')
    setTourCode('')
    setTourName('')
    setItineraryId('')
    setItineraryName('')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!tourId) {
      toast.error(DESIGN_COMPONENT_LABELS.請選擇旅遊團)
      return
    }

    setIsSubmitting(true)
    try {
      const design = await createDesign({
        design_type: designType,
        tour_id: tourId,
        tour_code: tourCode,
        tour_name: tourName,
        itinerary_id: itineraryId || undefined,
        itinerary_name: itineraryName || undefined,
        name: `${tourCode || tourName || LABELS.newDesign} - ${DESIGN_TYPE_CONFIG[designType].label}`,
      })

      toast.success(DESIGN_COMPONENT_LABELS.設計已建立)
      handleClose()
      onSuccess?.(design.id, tourId, itineraryId || undefined)
    } catch (error) {
      logger.error('建立設計失敗:', error)
      toast.error(DESIGN_COMPONENT_LABELS.建立設計失敗)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent level={1} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{LABELS.addDesign}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 設計類型選擇 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-3 block">
              {LABELS.designType}
            </label>
            <div className="space-y-4">
              {(Object.keys(DESIGN_TYPES_BY_CATEGORY) as DesignCategory[]).map((category) => (
                <div key={category}>
                  <div className="text-xs text-morandi-secondary mb-2">
                    {DESIGN_CATEGORY_CONFIG[category].label}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {DESIGN_TYPES_BY_CATEGORY[category].map((type) => {
                      const config = DESIGN_TYPE_CONFIG[type]
                      const isSelected = designType === type

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDesignType(type)}
                          className={`
                            p-3 rounded-lg border-2 text-left transition-all
                            ${
                              isSelected
                                ? 'border-morandi-gold bg-morandi-gold/5'
                                : 'border-border hover:border-morandi-gold/50'
                            }
                          `}
                        >
                          <div className="text-sm font-medium">{config.label}</div>
                          <div className="text-xs text-morandi-secondary">
                            {config.size}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 團/行程選擇 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-3 block">
              {LABELS.relatedData}
            </label>
            <TourItinerarySelector
              selectedTourId={tourId}
              selectedItineraryId={itineraryId}
              onTourChange={(id, code, name) => {
                setTourId(id)
                setTourCode(code)
                setTourName(name)
              }}
              onItineraryChange={(id, name) => {
                setItineraryId(id)
                setItineraryName(name)
              }}
            />
          </div>
        </div>

        {/* 按鈕區 */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            {LABELS.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!tourId || isSubmitting}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white gap-2"
          >
            <Plus size={16} />
            {isSubmitting ? LABELS.creating : LABELS.createDesign}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
