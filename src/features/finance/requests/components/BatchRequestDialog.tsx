'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BatchTourSelect } from './BatchTourSelect'
import { RequestDateInput } from './RequestDateInput'
import { EditableRequestItemList } from './RequestItemList'
import { useBatchRequestForm } from '../hooks/useBatchRequestForm'
import { useRequestForm } from '../hooks/useRequestForm'
import { useRequestOperations } from '../hooks/useRequestOperations'

interface BatchRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BatchRequestDialog({ open, onOpenChange }: BatchRequestDialogProps) {
  const {
    formData,
    setFormData,
    selectedTourIds,
    batchTourSearch,
    setBatchTourSearch,
    showBatchTourDropdown,
    setShowBatchTourDropdown,
    filteredTours: batchFilteredTours,
    toggleTourSelection,
    removeTourFromSelection,
    resetForm: resetBatchForm,
    tours,
  } = useBatchRequestForm()

  const {
    requestItems,
    total_amount,
    addNewEmptyItem,
    updateItem,
    removeItem,
    resetForm: resetItemForm,
    suppliers,
  } = useRequestForm()

  const { createBatchRequests } = useRequestOperations()

  const handleSubmit = async () => {
    await createBatchRequests(formData, requestItems, selectedTourIds, tours)
    resetBatchForm()
    resetItemForm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetBatchForm()
    resetItemForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批次請款</DialogTitle>
          <p className="text-sm text-morandi-secondary">為多個旅遊團建立相同內容的請款單</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tour Selection */}
          <BatchTourSelect
            searchValue={batchTourSearch}
            onSearchChange={setBatchTourSearch}
            tours={batchFilteredTours}
            selectedTourIds={selectedTourIds}
            onToggleTour={toggleTourSelection}
            onRemoveTour={removeTourFromSelection}
            showDropdown={showBatchTourDropdown}
            onShowDropdown={setShowBatchTourDropdown}
            allTours={tours}
          />

          {/* Basic Info */}
          <div className="border border-border rounded-md p-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              disabled={selectedTourIds.length === 0 || requestItems.length === 0}
              className="bg-morandi-primary hover:bg-morandi-primary/90 text-white rounded-md"
            >
              建立批次請款 ({selectedTourIds.length} 個團，共 {requestItems.length} 項，總計 NT${' '}
              {(total_amount * selectedTourIds.length).toLocaleString()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
