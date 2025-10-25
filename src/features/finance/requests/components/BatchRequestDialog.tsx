'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BatchTourSelect } from './BatchTourSelect';
import { RequestDateInput } from './RequestDateInput';
import { RequestItemForm } from './RequestItemForm';
import { RequestItemList } from './RequestItemList';
import { useBatchRequestForm } from '../hooks/useBatchRequestForm';
import { useRequestOperations } from '../hooks/useRequestOperations';
import { RequestItem, NewItemFormData } from '../types';
import { useState, useCallback, useMemo } from 'react';
import { useSupplierStore } from '@/stores';

interface BatchRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    filteredTours,
    toggleTourSelection,
    removeTourFromSelection,
    resetForm,
    tours
  } = useBatchRequestForm();

  const { items: suppliers } = useSupplierStore();
  const { createBatchRequests } = useRequestOperations();

  // Local state for items (shared between single and batch)
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [newItem, setNewItem] = useState<NewItemFormData>({
    category: '住宿',
    supplier_id: '',
    description: '',
    unit_price: 0,
    quantity: 1
  });

  // Calculate total amount
  const total_amount = useMemo(() =>
    requestItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  , [requestItems]);

  // Add item to list
  const addItemToList = useCallback(() => {
    if (!newItem.supplier_id || !newItem.description) return;

    const selectedSupplier = suppliers.find(s => s.id === newItem.supplier_id);
    if (!selectedSupplier) return;

    const itemId = Math.random().toString(36).substr(2, 9);
    setRequestItems(prev => [...prev, {
      id: itemId,
      ...newItem,
      supplierName: selectedSupplier.name,
    }]);

    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
  }, [newItem, suppliers]);

  // Remove item from list
  const removeItem = useCallback((itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleSubmit = async () => {
    await createBatchRequests(
      formData,
      requestItems,
      selectedTourIds,
      tours
    );

    resetForm();
    setRequestItems([]);
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    setRequestItems([]);
    setNewItem({
      category: '住宿',
      supplier_id: '',
      description: '',
      unit_price: 0,
      quantity: 1
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批次請款</DialogTitle>
          <p className="text-sm text-morandi-secondary">
            為多個旅遊團建立相同內容的請款單
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tour Selection */}
          <BatchTourSelect
            searchValue={batchTourSearch}
            onSearchChange={setBatchTourSearch}
            tours={filteredTours}
            selectedTourIds={selectedTourIds}
            onToggleTour={toggleTourSelection}
            onRemoveTour={removeTourFromSelection}
            showDropdown={showBatchTourDropdown}
            onShowDropdown={setShowBatchTourDropdown}
            allTours={tours}
          />

          {/* Basic Info */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RequestDateInput
                value={formData.request_date}
                onChange={(date, isSpecialBilling) => {
                  setFormData(prev => ({
                    ...prev,
                    request_date: date,
                    is_special_billing: isSpecialBilling
                  }));
                }}
              />

              <div>
                <label className="text-sm font-medium text-morandi-primary">備註</label>
                <Input
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
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
            suppliers={suppliers}
          />

          {/* Item List */}
          <RequestItemList
            items={requestItems}
            onRemoveItem={removeItem}
            showBatchTotal={true}
            batchCount={selectedTourIds.length}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedTourIds.length === 0 || requestItems.length === 0}
              className="bg-morandi-primary hover:bg-morandi-primary/90 text-white"
            >
              建立批次請款 ({selectedTourIds.length} 個團，共 {requestItems.length} 項，總計 NT$ {(total_amount * selectedTourIds.length).toLocaleString()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
