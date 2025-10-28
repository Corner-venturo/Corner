'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Star } from 'lucide-react';
import type { SupplierPaymentAccount } from '@/types/supplier.types';

interface PaymentAccountsManagerProps {
  accounts: Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[];
  onChange: (accounts: Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[]) => void;
}

export function PaymentAccountsManager({ accounts, onChange }: PaymentAccountsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>>({
    account_name: '',
    account_holder: '',
    bank_name: '',
    bank_code: '',
    bank_branch: '',
    account_number: '',
    swift_code: '',
    currency: 'TWD',
    account_type: 'checking',
    is_default: accounts.length === 0, // 第一個帳戶自動設為預設
    is_active: true,
    note: ''
  });

  const handleAddAccount = () => {
    if (!formData.account_name.trim() || !formData.account_holder.trim() || !formData.bank_name.trim() || !formData.account_number.trim()) {
      alert('請填寫必填欄位：帳戶名稱、戶名、銀行名稱、帳號');
      return;
    }

    const newAccounts = [...accounts];

    // 如果設為預設，將其他帳戶改為非預設
    if (formData.is_default) {
      newAccounts.forEach(acc => acc.is_default = false);
    }

    if (editingIndex !== null) {
      newAccounts[editingIndex] = formData;
    } else {
      newAccounts.push(formData);
    }

    onChange(newAccounts);
    resetForm();
  };

  const handleEditAccount = (index: number) => {
    setFormData(accounts[index]);
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDeleteAccount = (index: number) => {
    const newAccounts = accounts.filter((_, i) => i !== index);

    // 如果刪除的是預設帳戶，將第一個帳戶設為預設
    if (accounts[index].is_default && newAccounts.length > 0) {
      newAccounts[0].is_default = true;
    }

    onChange(newAccounts);
  };

  const handleSetDefault = (index: number) => {
    const newAccounts = accounts.map((acc, i) => ({
      ...acc,
      is_default: i === index
    }));
    onChange(newAccounts);
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      account_holder: '',
      bank_name: '',
      bank_code: '',
      bank_branch: '',
      account_number: '',
      swift_code: '',
      currency: 'TWD',
      account_type: 'checking',
      is_default: accounts.length === 0,
      is_active: true,
      note: ''
    });
    setEditingIndex(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-morandi-primary">
          付款帳戶 ({accounts.length} 個)
        </h3>
        {!showForm && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>新增帳戶</span>
          </Button>
        )}
      </div>

      {/* 帳戶列表 */}
      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="p-3 border border-border rounded-md bg-background hover:bg-morandi-container/10 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-morandi-primary">{account.account_name}</span>
                    {account.is_default && (
                      <Badge variant="default" className="text-xs bg-morandi-gold">
                        <Star className="w-3 h-3 mr-1" />
                        預設
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {account.currency}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-morandi-secondary">
                    <div>{account.account_holder}</div>
                    <div>{account.bank_name} {account.bank_branch && `- ${account.bank_branch}`}</div>
                    <div className="font-mono">{account.account_number}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!account.is_default && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(index)}
                      title="設為預設"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditAccount(index)}
                  >
                    編輯
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAccount(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="p-4 border border-morandi-gold rounded-md bg-morandi-container/5 space-y-4">
          <h4 className="text-sm font-medium text-morandi-primary">
            {editingIndex !== null ? '編輯帳戶' : '新增帳戶'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">帳戶名稱 *</label>
              <Input
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="如：主要帳戶、泰國當地帳戶"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">戶名 *</label>
              <Input
                value={formData.account_holder}
                onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                placeholder="帳戶持有人姓名"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">銀行名稱 *</label>
              <Input
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="如：台灣銀行、Bangkok Bank"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">帳號 *</label>
              <Input
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="銀行帳號"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">銀行代碼</label>
              <Input
                value={formData.bank_code || ''}
                onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                placeholder="如：004"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">分行名稱</label>
              <Input
                value={formData.bank_branch || ''}
                onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                placeholder="如：松山分行"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">SWIFT Code</label>
              <Input
                value={formData.swift_code || ''}
                onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
                placeholder="國際匯款用"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">幣別</label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD - 新台幣</SelectItem>
                  <SelectItem value="USD">USD - 美元</SelectItem>
                  <SelectItem value="THB">THB - 泰銖</SelectItem>
                  <SelectItem value="JPY">JPY - 日圓</SelectItem>
                  <SelectItem value="CNY">CNY - 人民幣</SelectItem>
                  <SelectItem value="EUR">EUR - 歐元</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">帳戶類型</label>
              <Select
                value={formData.account_type || 'checking'}
                onValueChange={(value: 'checking' | 'savings') => setFormData({ ...formData, account_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">支票帳戶</SelectItem>
                  <SelectItem value="savings">儲蓄帳戶</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 mt-6">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded border-morandi-gold text-morandi-gold focus:ring-morandi-gold"
              />
              <label className="text-sm text-morandi-primary">設為預設帳戶</label>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-morandi-primary">備註</label>
              <Input
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="其他說明"
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleAddAccount}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {editingIndex !== null ? '更新' : '新增'}
            </Button>
          </div>
        </div>
      )}

      {accounts.length === 0 && !showForm && (
        <div className="text-center py-8 text-morandi-secondary text-sm">
          尚未新增付款帳戶
        </div>
      )}
    </div>
  );
}
