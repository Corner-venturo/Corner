/**
 * SuppliersDialog - Dialog for creating/editing suppliers
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentAccountsManager } from '@/components/suppliers/PaymentAccountsManager';
import { Supplier, SupplierPaymentAccount } from '../types';
import { SUPPLIER_TYPE_LABELS } from '../constants';

type SupplierFormData = Omit<{
  name: string;
  country: string;
  region: string;
  cities: string[];
  type: Supplier['type'];
  contact: {
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  status: Supplier['status'];
  note: string;
}, 'supplier_code'>;

type SupplierPaymentAccountForm = Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>;

interface SuppliersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formData: SupplierFormData;
  paymentAccounts: SupplierPaymentAccountForm[];
  activeCountries: Array<{ code: string; name: string; emoji?: string }>;
  availableRegions: Array<{ id: string; name: string }>;
  availableCities: Array<{ id: string; name: string }>;
  onFormFieldChange: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void;
  onContactFieldChange: <K extends keyof SupplierFormData['contact']>(field: K, value: SupplierFormData['contact'][K]) => void;
  onPaymentAccountsChange: (accounts: SupplierPaymentAccountForm[]) => void;
  onCountryChange: (countryId: string) => void;
  onRegionChange: (regionId: string) => void;
  onCityToggle: (cityId: string) => void;
  onSubmit: () => void;
}

export const SuppliersDialog: React.FC<SuppliersDialogProps> = ({
  isOpen,
  onClose,
  formData,
  paymentAccounts,
  activeCountries,
  availableRegions,
  availableCities,
  onFormFieldChange,
  onContactFieldChange,
  onPaymentAccountsChange,
  onCountryChange,
  onRegionChange,
  onCityToggle,
  onSubmit,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增供應商</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* 基本資訊 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-morandi-primary">基本資訊</h3>
              <p className="text-xs text-morandi-secondary">供應商編號將自動生成</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">供應商名稱 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => onFormFieldChange('name', e.target.value)}
                  placeholder="輸入供應商名稱"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">國家 *</label>
                <Select
                  value={formData.country}
                  onValueChange={onCountryChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選擇國家" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCountries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.emoji} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 地區選擇（如果該國家有地區） */}
              {availableRegions.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-morandi-primary">地區</label>
                  <Select
                    value={formData.region}
                    onValueChange={onRegionChange}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="選擇地區" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRegions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 城市選擇（多選） */}
              {availableCities.length > 0 && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-morandi-primary">
                    服務城市 * ({formData.cities.length} 個已選)
                  </label>
                  <div className="mt-2 p-3 border border-border rounded-md bg-background max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {availableCities.map((city) => (
                        <label
                          key={city.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-morandi-container/20 p-2 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.cities.includes(city.id)}
                            onChange={() => onCityToggle(city.id)}
                            className="rounded border-morandi-gold text-morandi-gold focus:ring-morandi-gold"
                          />
                          <span className="text-sm text-morandi-primary">{city.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-morandi-primary">服務類別 *</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Supplier['type']) => onFormFieldChange('type', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUPPLIER_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 付款帳戶 */}
          <div className="space-y-4">
            <PaymentAccountsManager
              accounts={paymentAccounts}
              onChange={onPaymentAccountsChange}
            />
          </div>

          {/* 聯絡資訊 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-morandi-primary">聯絡資訊</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">聯絡人 *</label>
                <Input
                  value={formData.contact.contact_person}
                  onChange={(e) => onContactFieldChange('contact_person', e.target.value)}
                  placeholder="聯絡人姓名"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">電話</label>
                <Input
                  value={formData.contact.phone}
                  onChange={(e) => onContactFieldChange('phone', e.target.value)}
                  placeholder="聯絡電話"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">電子信箱</label>
                <Input
                  type="email"
                  value={formData.contact.email}
                  onChange={(e) => onContactFieldChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">網站</label>
                <Input
                  value={formData.contact.website}
                  onChange={(e) => onContactFieldChange('website', e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">地址</label>
              <Input
                value={formData.contact.address}
                onChange={(e) => onContactFieldChange('address', e.target.value)}
                placeholder="完整地址"
                className="mt-1"
              />
            </div>
          </div>

          {/* 備註 */}
          <div>
            <label className="text-sm font-medium text-morandi-primary">備註</label>
            <Input
              value={formData.note}
              onChange={(e) => onFormFieldChange('note', e.target.value)}
              placeholder="供應商備註資訊"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              取消
            </Button>
            <Button
              onClick={onSubmit}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              新增供應商
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
