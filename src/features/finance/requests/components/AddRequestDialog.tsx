'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TourSearchSelect } from './TourSearchSelect'
import { OrderSearchSelect } from './OrderSearchSelect'
import { RequestDateInput } from './RequestDateInput'
import { RequestItemForm } from './RequestItemForm'
import { RequestItemList } from './RequestItemList'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'

interface AddRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddRequestDialog({ open, onOpenChange }: AddRequestDialogProps) {
  const {
    formData,
    setFormData,
    requestItems,
    newItem,
    setNewItem,
    tourSearchValue,
    setTourSearchValue,
    orderSearchValue,
    setOrderSearchValue,
    supplierSearchValue,
    setSupplierSearchValue,
    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,
    showSupplierDropdown,
    setShowSupplierDropdown,
    filteredTours,
    filteredOrders,
    filteredSuppliers,
    total_amount,
    addItemToList,
    removeItem,
    resetForm,
    suppliers,
    tours,
    orders,
  } = useRequestForm()

  const { generateRequestNumber, createRequest } = useRequestOperations()

  // 載入資料（開啟對話框時）
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        const { useTourStore, useOrderStore, useSupplierStore, useEmployeeStore } = await import('@/stores')
        const tourStore = useTourStore.getState()
        const orderStore = useOrderStore.getState()
        const supplierStore = useSupplierStore.getState()
        const employeeStore = useEmployeeStore.getState()

        if (tourStore.items.length === 0) {
          await tourStore.fetchAll()
        }
        if (orderStore.items.length === 0) {
          await orderStore.fetchAll()
        }
        if (supplierStore.items.length === 0) {
          await supplierStore.fetchAll()
        }
        if (employeeStore.items.length === 0) {
          await employeeStore.fetchAll()
        }
      }
      loadData()
    }
  }, [open])

  const handleSubmit = async () => {
    const selectedTour = tours.find(t => t.id === formData.tour_id)
    const selectedOrder = orders.find(o => o.id === formData.order_id)

    if (!selectedTour) return

    await createRequest(
      formData,
      requestItems,
      selectedTour.name,
      selectedTour.code,
      selectedOrder?.order_number
    )

    resetForm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增請款單</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            請款單號: {generateRequestNumber()} (自動生成)
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="border border-border rounded-md p-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TourSearchSelect
                value={tourSearchValue}
                onChange={setTourSearchValue}
                onSelect={tour => {
                  setFormData(prev => ({
                    ...prev,
                    tour_id: tour.id,
                    order_id: '',
                  }))
                  setTourSearchValue(`${tour.code} - ${tour.name}`)
                  setOrderSearchValue('')
                }}
                tours={filteredTours}
                showDropdown={showTourDropdown}
                onShowDropdown={setShowTourDropdown}
                label="選擇旅遊團 *"
              />

              <OrderSearchSelect
                value={orderSearchValue}
                onChange={setOrderSearchValue}
                onSelect={order => {
                  setFormData(prev => ({
                    ...prev,
                    order_id: order.id,
                  }))
                  setOrderSearchValue(`${order.order_number} - ${order.contact_person}`)
                }}
                orders={filteredOrders}
                showDropdown={showOrderDropdown}
                onShowDropdown={setShowOrderDropdown}
                disabled={!formData.tour_id}
              />

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
          </div>

          {/* Item Form */}
          <RequestItemForm
            newItem={newItem}
            setNewItem={setNewItem}
            onAddItem={addItemToList}
            suppliers={filteredSuppliers}
            supplierSearchValue={supplierSearchValue}
            setSupplierSearchValue={setSupplierSearchValue}
            showSupplierDropdown={showSupplierDropdown}
            setShowSupplierDropdown={setShowSupplierDropdown}
          />

          {/* Item List */}
          <RequestItemList items={requestItems} onRemoveItem={removeItem} />

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
