/**
 * SelectTourDialog - 選擇團體建立合約
 */

'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Calendar, Users } from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')

  // 篩選團體
  const filteredTours = tours.filter(tour => {
    const search = searchTerm.toLowerCase()
    return (
      tour.name?.toLowerCase().includes(search) ||
      tour.code?.toLowerCase().includes(search)
    )
  })

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>選擇團體建立合約</DialogTitle>
        </DialogHeader>

        {/* 搜尋框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-morandi-secondary" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="搜尋團號或團名..."
            className="pl-9"
          />
        </div>

        {/* 團體列表 */}
        <div className="max-h-[400px] overflow-auto space-y-2">
          {filteredTours.length === 0 ? (
            <div className="text-center py-8 text-morandi-secondary">
              {tours.length === 0 ? '所有團體都已建立合約' : '找不到符合的團體'}
            </div>
          ) : (
            filteredTours.map(tour => (
              <div
                key={tour.id}
                className="p-3 border border-morandi-border rounded-lg hover:bg-morandi-container/20 cursor-pointer transition-colors"
                onClick={() => onSelect(tour)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-morandi-primary">{tour.name}</div>
                    <div className="text-sm text-morandi-secondary">{tour.code}</div>
                  </div>
                  <div className="text-right text-sm text-morandi-secondary">
                    {tour.departure_date && (
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        {format(new Date(tour.departure_date), 'yyyy/MM/dd', { locale: zhTW })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
