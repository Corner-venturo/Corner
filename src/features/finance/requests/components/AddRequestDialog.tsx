import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TourSearchSelect } from './TourSearchSelect'
import { OrderSearchSelect } from './OrderSearchSelect'
import { RequestDateInput } from './RequestDateInput'
import { SupplierSearchSelect } from './SupplierSearchSelect' // New Import
import { EditableRequestItemList } from './RequestItemList'
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
    tourSearchValue,
    setTourSearchValue,
    orderSearchValue,
    setOrderSearchValue,
    supplierSearchValue, // New
    setSupplierSearchValue, // New
    showTourDropdown,
    setShowTourDropdown,
    showOrderDropdown,
    setShowOrderDropdown,
    showSupplierDropdown, // New
    setShowSupplierDropdown, // New
    filteredTours,
    filteredOrders,
    filteredSuppliers, // New
    total_amount,
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm,
    suppliers, // This 'suppliers' is all combined suppliers for item list
    tours,
    orders,
  } = useRequestForm()

  const { generateRequestNumber, createRequest } = useRequestOperations()

  const handleCancel = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    try {
      await createRequest({
        ...formData,
        request_number: generateRequestNumber(),
        items: requestItems,
        total_amount,
      })
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('新增請款單失敗:', error)
    }
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

              <SupplierSearchSelect
                value={supplierSearchValue}
                onChange={setSupplierSearchValue}
                onSelect={supplier => {
                  setFormData(prev => ({
                    ...prev,
                    supplier_id: supplier.id,
                    supplier_name: supplier.name || '',
                  }))
                  setSupplierSearchValue(supplier.name || '')
                }}
                suppliers={filteredSuppliers}
                showDropdown={showSupplierDropdown}
                onShowDropdown={setShowSupplierDropdown}
                label="請款供應商 (主要)"
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
