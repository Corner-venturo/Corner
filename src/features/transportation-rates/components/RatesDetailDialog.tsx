/**
 * RatesDetailDialog - 國家車資詳細表格懸浮視窗
 */

'use client'

import { logger } from '@/lib/utils/logger'
import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EditableRatesTable } from '@/components/transportation/editable-rates-table/index'
import { TransportationRate } from '@/types/transportation-rates.types'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { confirm } from '@/lib/ui/alert-dialog'
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
    // @ts-expect-error - transportation_rates table not in generated Supabase types
    const result = await supabase.from('transportation_rates').update(updates).eq('id', id)
    const error = result.error

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
    const confirmed = await confirm('確定要刪除這筆車資資料嗎？', {
      title: '刪除車資',
      type: 'warning',
    })
    if (!confirmed) return

    const result = await supabase.from('transportation_rates').delete().eq('id', id)
    const error = result.error

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
    interface CreateRateData extends Partial<TransportationRate> {
      category?: string
      price_twd?: number
    }
    const dataWithCategory = data as CreateRateData

    if (!user?.workspace_id) {
      toast.error('無法取得工作區資訊')
      return
    }

    const result = await supabase.from('transportation_rates').insert({
      workspace_id: user.workspace_id,
      country_id: data.country_id || null,
      country_name: countryName,
      vehicle_type: data.vehicle_type || dataWithCategory?.category || '',
      price: dataWithCategory?.price_twd || 0,
      currency: 'TWD',
      unit: 'trip',
      is_active: true,
      display_order: 0,
    })
    const error = result.error

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
      <DialogContent level={1} className="max-w-[95vw] h-[90vh] flex flex-col">
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
