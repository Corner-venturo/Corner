'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertTriangle, Plus, Minus, Calendar } from 'lucide-react'
import type { ItinerarySyncInfo } from './hooks/useTourEdit'
import type { DailyItineraryDay } from '@/stores/types'
import { COMP_TOURS_LABELS } from './constants/labels'

interface ItinerarySyncDialogProps {
  open: boolean
  syncInfo: ItinerarySyncInfo | null
  onSync: (action: 'adjust' | 'ignore', daysToRemove?: number[]) => void
  onClose: () => void
}

export function ItinerarySyncDialog({
  open,
  syncInfo,
  onSync,
  onClose,
}: ItinerarySyncDialogProps) {
  // State for tracking which days to remove (when decreasing)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  // Get daily itinerary from sync info
  const dailyItinerary = useMemo(() => {
    if (!syncInfo?.itinerary?.daily_itinerary) return []
    return syncInfo.itinerary.daily_itinerary as DailyItineraryDay[]
  }, [syncInfo])

  // Calculate how many days need to be removed
  const daysToRemoveCount = useMemo(() => {
    if (!syncInfo || syncInfo.action !== 'decrease') return 0
    return syncInfo.currentDays - syncInfo.newDays
  }, [syncInfo])

  // Initialize selected days (default: last N days)
  React.useEffect(() => {
    if (syncInfo?.action === 'decrease' && dailyItinerary.length > 0) {
      const defaultSelected = dailyItinerary
        .map((_, idx) => idx)
        .slice(-daysToRemoveCount)
      setSelectedDays(defaultSelected)
    } else {
      setSelectedDays([])
    }
  }, [syncInfo, dailyItinerary, daysToRemoveCount])

  // Toggle day selection
  const toggleDay = useCallback((dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex)
      } else {
        return [...prev, dayIndex]
      }
    })
  }, [])

  // Check if selection is valid
  const isSelectionValid = useMemo(() => {
    if (!syncInfo) return false
    if (syncInfo.action === 'increase') return true
    return selectedDays.length === daysToRemoveCount
  }, [syncInfo, selectedDays, daysToRemoveCount])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (!syncInfo) return

    if (syncInfo.action === 'decrease') {
      onSync('adjust', selectedDays)
    } else {
      onSync('adjust')
    }
  }, [syncInfo, selectedDays, onSync])

  // Handle ignore
  const handleIgnore = useCallback(() => {
    onSync('ignore')
  }, [onSync])

  if (!syncInfo) return null

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent level={2} className="max-w-lg" aria-describedby="sync-dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {COMP_TOURS_LABELS.LABEL_5905}
          </DialogTitle>
          <DialogDescription id="sync-dialog-description">
            {COMP_TOURS_LABELS.LABEL_9765}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Summary info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{COMP_TOURS_LABELS.LABEL_4788}</span>
              <span className="font-medium">{syncInfo.itinerary.title || syncInfo.itinerary.name || COMP_TOURS_LABELS.未命名行程}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{COMP_TOURS_LABELS.LABEL_6069}</span>
              <span className="font-medium">{syncInfo.currentDays} 天</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{COMP_TOURS_LABELS.LABEL_357}</span>
              <span className="font-medium text-primary">{syncInfo.newDays} 天</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">{COMP_TOURS_LABELS.LABEL_493}</span>
              <span className={`font-medium flex items-center gap-1 ${
                syncInfo.action === 'increase' ? 'text-green-600' : 'text-amber-600'
              }`}>
                {syncInfo.action === 'increase' ? (
                  <>
                    <Plus className="h-4 w-4" />
                    增加 {syncInfo.newDays - syncInfo.currentDays} 天
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4" />
                    減少 {syncInfo.currentDays - syncInfo.newDays} 天
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Day selection for decrease */}
          {syncInfo.action === 'decrease' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                請選擇要移除的 <span className="font-medium text-foreground">{daysToRemoveCount}</span> {COMP_TOURS_LABELS.LABEL_7016}
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {dailyItinerary.map((day, idx) => (
                  <label
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDays.includes(idx)
                        ? 'bg-destructive/10 border-destructive/50'
                        : 'bg-background hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedDays.includes(idx)}
                      onCheckedChange={() => toggleDay(idx)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{day.dayLabel}</span>
                        <span className="text-muted-foreground text-sm">{day.date}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {day.title || COMP_TOURS_LABELS.未設定標題}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedDays.length !== daysToRemoveCount && (
                <p className="text-sm text-amber-600">
                  請選擇剛好 {daysToRemoveCount} 天（目前已選 {selectedDays.length} 天）
                </p>
              )}
            </div>
          )}

          {/* Message for increase */}
          {syncInfo.action === 'increase' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                將在行程表末尾新增 <span className="font-medium text-foreground">{syncInfo.newDays - syncInfo.currentDays}</span> {COMP_TOURS_LABELS.LABEL_5498}
              </p>
              <p className="text-sm text-muted-foreground">
                {COMP_TOURS_LABELS.ADD_1897}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleIgnore}>
            {COMP_TOURS_LABELS.LABEL_1982}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isSelectionValid}
            className={syncInfo.action === 'decrease' ? 'bg-amber-600 hover:bg-amber-700' : ''}
          >
            {syncInfo.action === 'decrease' ? COMP_TOURS_LABELS.確認移除 : COMP_TOURS_LABELS.確認新增}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
