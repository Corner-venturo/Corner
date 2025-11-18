'use client'

import React, { useState, useCallback } from 'react'
import { Tour } from '@/stores/types'
import { useTourStore, useOrderStore, useMemberStore } from '@/stores'
import { Plus, FileText, Package, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TourExtraFields } from '../types'

interface TourOperationsAddButtonProps {
  tour: Tour
  tourExtraFields: Record<string, any>
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, any>>>
}

export function TourOperationsAddButton({
  tour,
  tourExtraFields,
  setTourExtraFields,
}: TourOperationsAddButtonProps) {
  const orderStore = useOrderStore()
  const memberStore = useMemberStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Get all orders for this tour
  const tourOrders = orderStore.items.filter(order => order.tour_id === tour.id)

  // Get member data
  const allTourMembers = memberStore.items.filter(member =>
    tourOrders.some(order => order.id === member.order_id)
  )

  // Calculate assigned members
  const assignedMembers = allTourMembers.filter(member => member.assigned_room).length

  return (
    <>
      {/* Room assignment statistics */}
      <span className="px-2 py-1 bg-morandi-green/20 text-morandi-green rounded text-xs">
        已分房: {assignedMembers}人
      </span>

      {/* Add button */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
        title="新增項目"
      >
        <Plus size={14} className="mr-1" />
        新增欄位
      </button>

      {/* Dialog */}
      <TourOperationsAddDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tour={tour}
        tourExtraFields={tourExtraFields}
        setTourExtraFields={setTourExtraFields}
      />
    </>
  )
}

interface TourOperationsAddDialogProps {
  isOpen: boolean
  onClose: () => void
  tour: Tour
  tourExtraFields: Record<string, any>
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, any>>>
}

function TourOperationsAddDialog({
  isOpen,
  onClose,
  tour,
  tourExtraFields,
  setTourExtraFields,
}: TourOperationsAddDialogProps) {
  const handleOptionSelect = useCallback(
    (option: string) => {
      const tour_id = tour.id

      // Initialize field state for this tour if not exists
      if (!tourExtraFields[tour_id]) {
        setTourExtraFields(prev => ({
          ...prev,
          [tour_id]: {
            addOns: false,
            refunds: false,
            customFields: [],
          },
        }))
      }

      switch (option) {
        case 'addon':
          setTourExtraFields(prev => ({
            ...prev,
            [tour_id]: {
              ...prev[tour_id],
              addOns: true,
            },
          }))
          break

        case 'refund':
          setTourExtraFields(prev => ({
            ...prev,
            [tour_id]: {
              ...prev[tour_id],
              refunds: true,
            },
          }))
          break

        case 'blank':
          const fieldName = prompt('請輸入欄位名稱:')
          if (fieldName && fieldName.trim()) {
            const fieldId = Date.now().toString()
            setTourExtraFields(prev => ({
              ...prev,
              [tour_id]: {
                ...prev[tour_id],
                customFields: [
                  ...(prev[tour_id]?.customFields || []),
                  { id: fieldId, name: fieldName.trim() },
                ],
              },
            }))
          }
          break
      }

      onClose()
    },
    [tour.id, tourExtraFields, setTourExtraFields, onClose]
  )

  const options = [
    {
      id: 'blank',
      label: '空白欄位',
      description: '新增自定義空白項目',
      icon: FileText,
      color: 'text-morandi-secondary',
      bgColor: 'hover:bg-morandi-container/30',
    },
    {
      id: 'addon',
      label: '加購項目',
      description: '新增額外購買項目',
      icon: Package,
      color: 'text-morandi-blue',
      bgColor: 'hover:bg-morandi-blue/10',
    },
    {
      id: 'refund',
      label: '退費項目',
      description: '新增退款相關項目',
      icon: RefreshCw,
      color: 'text-morandi-red',
      bgColor: 'hover:bg-morandi-red/10',
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>新增項目</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-morandi-secondary mb-4">
            為旅遊團「{tour.name}」選擇要新增的項目類型：
          </div>

          {options.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={cn(
                  'w-full flex items-center space-x-4 p-4 rounded-lg border border-border transition-colors text-left',
                  option.bgColor
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full bg-morandi-container/20 flex items-center justify-center',
                    option.color
                  )}
                >
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-morandi-primary">{option.label}</div>
                  <div className="text-sm text-morandi-secondary">{option.description}</div>
                </div>
                <div className="text-morandi-secondary">
                  <FileText size={16} />
                </div>
              </button>
            )
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
