/**
 * SelectTourDialog - 選擇團體建立合約
 */

'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Combobox, ComboboxOption } from '@/components/ui/combobox'
import { X, Check, Calendar } from 'lucide-react'
import { Tour } from '@/stores/types'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface SelectTourDialogProps {
  isOpen: boolean
  onClose: () => void
  tours: Tour[]
  onSelect: (tour: Tour) => void
}

export const SelectTourDialog: React.FC<SelectTourDialogProps> = ({
  isOpen,
  onClose,
  tours,
  onSelect,
}) => {
  const [selectedTourId, setSelectedTourId] = useState('')

  // 將 tours 轉換為 Combobox 選項格式
  const tourOptions: ComboboxOption<Tour>[] = useMemo(() => {
    return tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
      data: tour,
    }))
  }, [tours])

  // 處理選擇確認
  const handleConfirm = () => {
    const selectedTour = tours.find(t => t.id === selectedTourId)
    if (selectedTour) {
      onSelect(selectedTour)
      setSelectedTourId('')
    }
  }

  // 處理關閉
  const handleClose = () => {
    setSelectedTourId('')
    onClose()
  }

  // 自訂選項渲染（顯示團號、團名和日期）
  const renderTourOption = (option: ComboboxOption<Tour>) => {
    const tour = option.data
    return (
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="font-medium text-morandi-primary">{tour?.name}</div>
          <div className="text-xs text-morandi-secondary">{tour?.code}</div>
        </div>
        {tour?.departure_date && (
          <div className="flex items-center gap-1 text-xs text-morandi-secondary">
            <Calendar size={12} />
            {format(new Date(tour.departure_date), 'yyyy/MM/dd', { locale: zhTW })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>選擇團體建立合約</DialogTitle>
        </DialogHeader>

        {/* 使用 Combobox 選擇旅遊團 */}
        <div className="py-4">
          {tours.length === 0 ? (
            <div className="text-center py-8 text-morandi-secondary">
              所有團體都已建立合約
            </div>
          ) : (
            <Combobox<Tour>
              value={selectedTourId}
              onChange={setSelectedTourId}
              options={tourOptions}
              placeholder="搜尋團號或團名..."
              emptyMessage="找不到符合的團體"
              showSearchIcon
              showClearButton
              renderOption={renderTourOption}
              maxHeight="20rem"
            />
          )}
        </div>

        {/* 底部按鈕 */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} className="gap-2">
            <X size={16} />
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedTourId}
            className="gap-2 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Check size={16} />
            確認選擇
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
