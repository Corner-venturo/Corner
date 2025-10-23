'use client';

import React, { useState } from 'react';
import { useAccountingStore } from '@/stores/accounting-store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEnterSubmit } from '@/hooks/useEnterSubmit';

interface AddTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddTransactionDialog({ isOpen, onClose }: AddTransactionDialogProps) {
  const { accounts, categories, addTransaction } = useAccountingStore();
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [formData, setFormData] = useState({
    account_id: accounts.length > 0 ? accounts[0].id : '',
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    to_account_id: '', // 轉帳目標帳戶
  });

  const handleSubmit = () => {
    if (!formData.account_id || !formData.amount || (!formData.category_id && transactionType !== 'transfer')) {
      return;
    }

    const account = accounts.find(acc => acc.id === formData.account_id);
    const category = categories.find(cat => cat.id === formData.category_id);
    const toAccount = formData.to_account_id ? accounts.find(acc => acc.id === formData.to_account_id) : undefined;

    const transactionData = {
      account_id: formData.account_id,
      account_name: account?.name || '',
      category_id: transactionType === 'transfer' ? categories.find(c => c.type === 'transfer')?.id || '' : formData.category_id,
      category_name: transactionType === 'transfer' ? '轉帳' : (category?.name || ''),
      type: transactionType,
      amount: parseFloat(formData.amount),
      currency: 'TWD',
      description: formData.description,
      date: formData.date,
      ...(transactionType === 'transfer' && {
        to_account_id: formData.to_account_id,
        to_account_name: toAccount?.name || '',
      }),
    };

    addTransaction(transactionData);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      account_id: '',
      category_id: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      to_account_id: '',
    });
    setTransactionType('expense');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredCategories = categories.filter(category =>
    transactionType === 'transfer' ? category.type === 'transfer' : category.type === transactionType
  );

  const transactionTypes = [
    { id: 'income', label: '收入', icon: ArrowUpRight, color: 'text-morandi-green', bgColor: 'bg-morandi-green/10' },
    { id: 'expense', label: '支出', icon: ArrowDownRight, color: 'text-morandi-red', bgColor: 'bg-morandi-red/10' },
    { id: 'transfer', label: '轉帳', icon: ArrowRightLeft, color: 'text-morandi-blue', bgColor: 'bg-morandi-blue/10' },
  ];

  const { handleKeyDown, compositionProps } = useEnterSubmit(handleSubmit);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增交易</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 交易類型選擇 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary mb-3 block">交易類型</label>
            <div className="grid grid-cols-3 gap-2">
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = transactionType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setTransactionType(type.id as any)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all flex flex-col items-center space-y-2',
                      isSelected
                        ? `border-current ${type.color} ${type.bgColor}`
                        : 'border-morandi-container hover:border-morandi-container-hover text-morandi-secondary'
                    )}
                  >
                    <Icon size={24} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 帳戶選擇 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">
              {transactionType === 'transfer' ? '從帳戶' : '帳戶'}
            </label>
            <select
              value={formData.account_id}
              onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
              className="mt-1 w-full p-3 border border-border rounded-md bg-background"
            >
              <option value="">請選擇帳戶</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} (NT$ {account.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* 轉帳目標帳戶 */}
          {transactionType === 'transfer' && (
            <div>
              <label className="text-sm font-medium text-morandi-primary">轉入帳戶</label>
              <select
                value={formData.to_account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, to_account_id: e.target.value }))}
                className="mt-1 w-full p-3 border border-border rounded-md bg-background"
              >
                <option value="">請選擇目標帳戶</option>
                {accounts
                  .filter(account => account.id !== formData.account_id)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} (NT$ {account.balance.toLocaleString()})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 分類選擇 */}
          {transactionType !== 'transfer' && (
            <div>
              <label className="text-sm font-medium text-morandi-primary">分類</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                className="mt-1 w-full p-3 border border-border rounded-md bg-background"
              >
                <option value="">請選擇分類</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 金額 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">金額</label>
            <div className="mt-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-morandi-secondary">NT$</span>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                onKeyDown={handleKeyDown}
                {...compositionProps}
                placeholder="0"
                className="pl-12 text-lg font-semibold"
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* 日期 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">日期</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1"
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">備註</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              onKeyDown={handleKeyDown}
              {...compositionProps}
              placeholder="輸入備註（選填）"
              className="mt-1"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.account_id || !formData.amount || (!formData.category_id && transactionType !== 'transfer') || (transactionType === 'transfer' && !formData.to_account_id)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              新增交易
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}