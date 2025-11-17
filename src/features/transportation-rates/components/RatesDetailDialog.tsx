/**
 * RatesDetailDialog - 國家車資詳細表格懸浮視窗
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EditableRatesTable } from '@/components/transportation/editable-rates-table'
import { TransportationRate } from '@/types/transportation-rates.types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { Bus, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RatesDetailDialogProps {
  isOpen: boolean
  onClose: () => void
  countryName: string
  rates: TransportationRate[]
  onUpdate: () => void
  onInsert?: (rate: TransportationRate) => void
  isEditMode: boolean
}

export const RatesDetailDialog: React.FC<RatesDetailDialogProps> = ({
  isOpen,
  onClose,
  countryName,
  rates,
  onUpdate,
  onInsert,
  isEditMode,
}) => {
  const { user } = useAuthStore()
  const [hideKKDAYColumns, setHideKKDAYColumns] = useState(true)

  // 更新單筆資料
  const handleUpdate = async (id: string, updates: Partial<TransportationRate>) => {
    const { error } = await supabase.from('transportation_rates').update(updates).eq('id', id)

    if (error) {
      logger.error('Error updating rate:', error)
      toast.error('更新失敗')
      return
    }

    toast.success('更新成功')
    onUpdate()
  }

  // 刪除資料
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這筆車資資料嗎？')) return

    const { error } = await supabase.from('transportation_rates').delete().eq('id', id)

    if (error) {
      logger.error('Error deleting rate:', error)
      toast.error('刪除失敗')
      return
    }

    toast.success('刪除成功')
    onUpdate()
  }

  // 新增資料
  const handleCreate = async (data: Partial<TransportationRate>) => {
    const { error } = await supabase.from('transportation_rates').insert({
      ...data,
      workspace_id: user?.workspace_id || null,
      country_id: data.country_id || '',
      country_name: countryName,
      vehicle_type: data.vehicle_type || data.category || '',
      price: data.price_twd || 0,
      currency: 'TWD',
      unit: 'trip',
      is_active: true,
      display_order: 0,
    })

    if (error) {
      logger.error('Error creating rate:', error)
      toast.error('新增失敗')
      return
    }

    toast.success('新增成功')
    onUpdate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Bus size={20} className="text-morandi-gold" />
              {countryName} - 車資管理
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideKKDAYColumns(!hideKKDAYColumns)}
              className="gap-2"
            >
              {hideKKDAYColumns ? <Eye size={16} /> : <EyeOff size={16} />}
              {hideKKDAYColumns ? '顯示 KKDAY 欄位' : '隱藏 KKDAY 欄位'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <EditableRatesTable
            rates={rates}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={handleCreate}
            onInsert={onInsert}
            isLoading={false}
            isEditMode={isEditMode}
            hideKKDAYColumns={hideKKDAYColumns}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
