import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Combobox } from '@/components/ui/combobox'
import { RequestDateInput } from './RequestDateInput'
import { EditableRequestItemList } from './RequestItemList'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'
import { logger } from '@/lib/utils/logger'

interface AddRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRequestDialog({ open, onOpenChange }: AddRequestDialogProps) {
  const {
    formData,
    setFormData,
    requestItems,
    filteredOrders,
    total_amount,
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm,
    suppliers,
    tours,
    orders,
    currentUser,
  } = useRequestForm()

  const { generateRequestCode, createRequest } = useRequestOperations()

  // 如果只有一個訂單，自動帶入
  useEffect(() => {
    if (formData.tour_id && filteredOrders.length === 1 && !formData.order_id) {
      const order = filteredOrders[0]
      setFormData(prev => ({ ...prev, order_id: order.id }))
    }
  }, [formData.tour_id, filteredOrders, formData.order_id, setFormData])

  // 取得選中的旅遊團以預覽編號
  const selectedTour = tours.find(t => t.id === formData.tour_id)
  const previewCode = selectedTour ? generateRequestCode(selectedTour.code) : '請先選擇旅遊團'

  // 轉換為 Combobox 選項格式
  const tourOptions = tours.map(tour => ({
    value: tour.id,
    label: `${tour.code || ''} - ${tour.name || ''}`,
  }))

  const orderOptions = filteredOrders.map(order => ({
    value: order.id,
    label: `${order.order_number} - ${order.contact_person || '無聯絡人'}`,
  }))

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    try {
      // 找到選中的旅遊團和訂單資訊
      // 注意：使用完整的 tours 列表查找，而不是 filteredTours（搜尋過濾後可能找不到）
      const selectedTour = tours.find(t => t.id === formData.tour_id)
      const selectedOrder = orders.find(o => o.id === formData.order_id)

      if (!selectedTour) {
        logger.error('找不到選擇的旅遊團:', formData.tour_id)
        return
      }

      await createRequest(
        formData,
        requestItems,
        selectedTour.name || '',
        selectedTour.code || '',
        selectedOrder?.order_number ?? undefined,
        currentUser?.display_name || currentUser?.chinese_name || '' // 請款人姓名
      )
      resetForm()
      onOpenChange(false)
    } catch (error) {
      logger.error('新增請款單失敗:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            請款單號: <span className="font-medium text-morandi-primary">{previewCode}</span> (自動生成)
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">選擇旅遊團 *</label>
                <Combobox
                  options={tourOptions}
                  value={formData.tour_id}
                  onChange={value => {
                    setFormData(prev => ({
                      ...prev,
                      tour_id: value,
                      order_id: '',
                    }))
                  }}
                  placeholder="搜尋團號或團名..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">選擇訂單（可選）</label>
                <Combobox
                  options={orderOptions}
                  value={formData.order_id}
                  onChange={value => setFormData(prev => ({ ...prev, order_id: value }))}
                  placeholder={!formData.tour_id ? '請先選擇旅遊團' : '搜尋訂單...'}
                  disabled={!formData.tour_id}
                  className="mt-1"
                />
              </div>

              <RequestDateInput
                value={formData.request_date}
                onChange={(date, isSpecialBilling) => {
                  setFormData(prev => ({
                    ...prev,
                    request_date: date,
                    is_special_billing: isSpecialBilling,
                  }))
                }}
              />

              <div>
                <label className="text-sm font-medium text-morandi-primary">備註</label>
                <Input
                  value={formData.note}
                  onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="輸入備註（可選）"
                  className="mt-1"
                />
              </div>
          </div>

          {/* Item List */}
          <EditableRequestItemList
            items={requestItems}
            suppliers={suppliers}
            updateItem={updateItem}
            removeItem={removeItem}
            addNewEmptyItem={addNewEmptyItem}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.tour_id || requestItems.length === 0}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white rounded-md"
            >
              新增請款單 (共 {requestItems.length} 項，NT$ {total_amount.toLocaleString()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
