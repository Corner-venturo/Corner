/**
 * LinkItineraryDialog - 報價單連結行程表對話框
 * 可選擇：新建行程表 / 關聯現有行程表
 */

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Link,
  Loader2,
  MapPin,
  Calendar,
  Map,
  ChevronLeft,
} from 'lucide-react'
import { useItineraryStore } from '@/stores'
import type { Itinerary } from '@/stores/types'

interface LinkItineraryDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateNew: () => void
  onLinkExisting: (itinerary: Itinerary) => void
  currentItineraryId?: string | null
}

type DialogStep = 'select' | 'itinerary-list'

export function LinkItineraryDialog({
  isOpen,
  onClose,
  onCreateNew,
  onLinkExisting,
  currentItineraryId,
}: LinkItineraryDialogProps) {
  const [step, setStep] = useState<DialogStep>('select')
  const { items: itineraries, fetchAll: fetchItineraries, loading: loadingItineraries } = useItineraryStore()

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchItineraries()
    }
  }, [isOpen, fetchItineraries])

  // 重置狀態
  useEffect(() => {
    if (!isOpen) {
      setStep('select')
    }
  }, [isOpen])

  // 過濾可用的行程表（尚未關聯報價單的）
  const availableItineraries = useMemo(() => {
    return itineraries
      .filter(it => !it.quote_id && it.id !== currentItineraryId)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [itineraries, currentItineraryId])

  const handleCreateNew = () => {
    onCreateNew()
    onClose()
  }

  const handleLinkExisting = (itinerary: Itinerary) => {
    onLinkExisting(itinerary)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>行程表</DialogTitle>
              <DialogDescription>
                選擇建立新行程表或關聯現有行程表
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {/* 新建行程表 */}
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-[var(--morandi-gold)]/30 bg-[var(--morandi-gold)]/5 hover:bg-[var(--morandi-gold)]/10 hover:border-[var(--morandi-gold)]/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--morandi-gold)]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-[var(--morandi-gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--morandi-primary)]">新建行程表</div>
                  <div className="text-sm text-[var(--morandi-secondary)]">建立新的行程表，自動帶入報價單資料</div>
                </div>
              </button>

              {/* 關聯現有行程表 */}
              <button
                onClick={() => setStep('itinerary-list')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Link className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--morandi-text)] flex items-center gap-2">
                    關聯現有行程表
                    {availableItineraries.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {availableItineraries.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--morandi-secondary)]">選擇現有的行程表進行關聯</div>
                </div>
              </button>
            </div>
          </>
        ) : step === 'itinerary-list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                選擇行程表
              </DialogTitle>
              <DialogDescription>
                選擇要關聯的行程表
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {loadingItineraries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--morandi-secondary)]" />
                  <span className="ml-2 text-sm text-[var(--morandi-secondary)]">載入中...</span>
                </div>
              ) : availableItineraries.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableItineraries.map(itinerary => (
                    <button
                      key={itinerary.id}
                      onClick={() => handleLinkExisting(itinerary)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded bg-[var(--morandi-gold)]/20 flex items-center justify-center shrink-0">
                        <Map className="w-4 h-4 text-[var(--morandi-gold)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[var(--morandi-gold)]">{itinerary.code}</span>
                          <span className="font-medium text-[var(--morandi-text)] truncate">
                            {itinerary.name || '未命名行程表'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--morandi-secondary)] mt-1">
                          {itinerary.destination && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {itinerary.destination}
                            </span>
                          )}
                          {itinerary.departure_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {itinerary.departure_date}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Map className="w-10 h-10 text-[var(--morandi-secondary)]/30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--morandi-secondary)]">目前沒有可關聯的行程表</p>
                  <p className="text-xs text-[var(--morandi-secondary)]/70 mt-1">請選擇「新建行程表」</p>
                </div>
              )}
            </div>

            <div className="flex justify-start mt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('select')}>
                ← 返回
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
