/**
 * LinkTourDialog - 報價單成交時選擇關聯旅遊團
 * 可選擇：新建旅遊團 / 關聯現有旅遊團
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
  Plane,
} from 'lucide-react'
import { useTourStore } from '@/stores'
import type { Tour } from '@/stores/types'

interface LinkTourDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateNew: () => void
  onLinkExisting: (tour: Tour) => void
}

type DialogStep = 'select' | 'tour-list'

export function LinkTourDialog({
  isOpen,
  onClose,
  onCreateNew,
  onLinkExisting,
}: LinkTourDialogProps) {
  const [step, setStep] = useState<DialogStep>('select')
  const { items: tours, fetchAll: fetchTours, loading: loadingTours } = useTourStore()

  // 載入資料
  useEffect(() => {
    if (isOpen) {
      fetchTours()
    }
  }, [isOpen, fetchTours])

  // 重置狀態
  useEffect(() => {
    if (!isOpen) {
      setStep('select')
    }
  }, [isOpen])

  // 過濾可用的旅遊團（尚未關聯報價單的）
  const availableTours = useMemo(() => {
    return tours
      .filter(t => !t.quote_id && t.status !== 'cancelled')
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }, [tours])

  const handleCreateNew = () => {
    onCreateNew()
    onClose()
  }

  const handleLinkExisting = (tour: Tour) => {
    onLinkExisting(tour)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        {step === 'select' ? (
          <>
            <DialogHeader>
              <DialogTitle>成交 - 關聯旅遊團</DialogTitle>
              <DialogDescription>
                報價單成交後，請選擇關聯方式
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-4">
              {/* 新建旅遊團 */}
              <button
                onClick={handleCreateNew}
                className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-[var(--morandi-gold)]/30 bg-[var(--morandi-gold)]/5 hover:bg-[var(--morandi-gold)]/10 hover:border-[var(--morandi-gold)]/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--morandi-gold)]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-5 h-5 text-[var(--morandi-gold)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--morandi-primary)]">新建旅遊團</div>
                  <div className="text-sm text-[var(--morandi-secondary)]">建立新的旅遊團，自動帶入報價單資料</div>
                </div>
              </button>

              {/* 關聯現有旅遊團 */}
              <button
                onClick={() => setStep('tour-list')}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Link className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--morandi-text)] flex items-center gap-2">
                    關聯現有旅遊團
                    {availableTours.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                        {availableTours.length}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[var(--morandi-secondary)]">選擇現有的旅遊團進行關聯</div>
                </div>
              </button>
            </div>
          </>
        ) : step === 'tour-list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <button
                  onClick={() => setStep('select')}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <Plane className="w-4 h-4" />
                </button>
                選擇旅遊團
              </DialogTitle>
              <DialogDescription>
                選擇要關聯的旅遊團
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {loadingTours ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--morandi-secondary)]" />
                  <span className="ml-2 text-sm text-[var(--morandi-secondary)]">載入中...</span>
                </div>
              ) : availableTours.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {availableTours.map(tour => (
                    <button
                      key={tour.id}
                      onClick={() => handleLinkExisting(tour)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded bg-[var(--morandi-gold)]/20 flex items-center justify-center shrink-0">
                        <Plane className="w-4 h-4 text-[var(--morandi-gold)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-[var(--morandi-gold)]">{tour.code}</span>
                          <span className="font-medium text-[var(--morandi-text)] truncate">
                            {tour.name || '未命名旅遊團'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--morandi-secondary)] mt-1">
                          {tour.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {tour.location}
                            </span>
                          )}
                          {tour.departure_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {tour.departure_date}
                            </span>
                          )}
                          {tour.status && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {tour.status === 'draft' ? '草稿' :
                               tour.status === 'confirmed' ? '已確認' :
                               tour.status === 'completed' ? '已完成' : tour.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="w-10 h-10 text-[var(--morandi-secondary)]/30 mx-auto mb-3" />
                  <p className="text-sm text-[var(--morandi-secondary)]">目前沒有可關聯的旅遊團</p>
                  <p className="text-xs text-[var(--morandi-secondary)]/70 mt-1">請選擇「新建旅遊團」</p>
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
