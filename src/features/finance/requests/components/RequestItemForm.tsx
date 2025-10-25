'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { NewItemFormData, categoryOptions } from '../types';

interface RequestItemFormProps {
  newItem: NewItemFormData;
  setNewItem: (item: NewItemFormData | ((prev: NewItemFormData) => NewItemFormData)) => void;
  onAddItem: () => void;
  suppliers: Array<{ id: string; name: string }>;
}

export function RequestItemForm({ newItem, setNewItem, onAddItem, suppliers }: RequestItemFormProps) {
  const subtotal = newItem.unit_price * newItem.quantity;

  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-morandi-primary">新增請款項目</h3>
        <Button
          type="button"
          onClick={onAddItem}
          disabled={!newItem.supplier_id || !newItem.description}
          className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-6"
          size="lg"
        >
          <Plus size={18} className="mr-2" />
          新增項目
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-secondary">類別</label>
          <Select
            value={newItem.category}
            onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as any }))}
          >
            <SelectTrigger className="mt-2 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-secondary">供應商</label>
          <Select
            value={newItem.supplier_id}
            onValueChange={(value) => setNewItem(prev => ({ ...prev, supplier_id: value }))}
          >
            <SelectTrigger className="mt-2 bg-background">
              <SelectValue placeholder="選擇供應商" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-4">
          <label className="text-sm font-medium text-morandi-secondary">項目描述</label>
          <Input
            value={newItem.description}
            onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
            placeholder="輸入項目描述"
            className="mt-2"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-secondary">單價</label>
          <Input
            type="number"
            value={newItem.unit_price}
            onChange={(e) => setNewItem(prev => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
            placeholder="0"
            className="mt-2"
          />
        </div>

        <div className="col-span-1">
          <label className="text-sm font-medium text-morandi-secondary">數量</label>
          <Input
            type="number"
            value={newItem.quantity}
            onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            placeholder="1"
            className="mt-2"
          />
        </div>
      </div>

      {/* Subtotal display */}
      <div className="mt-4 flex justify-end">
        <div className="bg-morandi-container/20 rounded px-4 py-2">
          <span className="text-sm font-medium text-morandi-secondary mr-2">小計:</span>
          <span className="text-lg font-semibold text-morandi-gold">
            NT$ {subtotal.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
