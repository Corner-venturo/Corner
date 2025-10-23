'use client';

import { useState, useMemo, useCallback } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useSupplierStore } from '@/stores';
import {
  Building2,
  Hotel,
  UtensilsCrossed,
  Car,
  Ticket,
  UserCheck,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Supplier } from '@/types/supplier.types';
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table';
import { supplierService } from '@/features/suppliers/services/supplier.service';
import { useRegionStore } from '@/stores';

const supplierTypeIcons = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  transport: Car,
  ticket: Ticket,
  guide: UserCheck,
  other: Package
};

const supplierTypeLabels = {
  hotel: '飯店住宿',
  restaurant: '餐廳',
  transport: '交通',
  ticket: '門票',
  guide: '導遊',
  other: '其他'
};

const supplierTypeColors = {
  hotel: 'bg-blue-500',
  restaurant: 'bg-green-500',
  transport: 'bg-orange-500',
  ticket: 'bg-purple-500',
  guide: 'bg-pink-500',
  other: 'bg-gray-500'
};

export default function SuppliersPage() {
  const { items: suppliers, create: addSupplier, filter } = useSupplierStore();
  const { items: regions, fetchAll: fetchRegions } = useRegionStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 懶載入：打開新增對話框時才載入 regions
  const handleOpenAddDialog = useCallback(() => {
    if (regions.length === 0) {
      fetchRegions();
    }
    setIsAddDialogOpen(true);
  }, [regions.length, fetchRegions]);

  // 從 regions 取得國家列表
  const activeCountries = useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  const [newSupplier, setNewSupplier] = useState({
    supplier_code: '',
    name: '',
    country: '',
    location: '',
    type: 'hotel' as Supplier['type'],
    contact: {
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      website: ''
    },
    status: 'active' as Supplier['status'],
    note: ''
  });

  const handleAddSupplier = useCallback(async () => {
    if (!newSupplier.name.trim() || !newSupplier.contact.contact_person.trim()) return;
    if (!newSupplier.country) {
      alert('請選擇國家');
      return;
    }

    // 自動生成供應商編號
    const supplierCode = await supplierService.generateSupplierCode(newSupplier.country);

    addSupplier({
      ...newSupplier,
      supplier_code: supplierCode
    } as any);

    setNewSupplier({
      supplier_code: '',
      name: '',
      country: '',
      location: '',
      type: 'hotel',
      contact: {
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        website: ''
      },
      status: 'active',
      note: ''
    });
    setIsAddDialogOpen(false);
  }, [newSupplier, addSupplier]);

  // 過濾供應商 - 使用 useMemo 優化
  const filteredSuppliers = useMemo(() => {
    if (!suppliers || !Array.isArray(suppliers)) return [];
    return suppliers.filter(supplier => {
      const matchesSearch = searchQuery === '' ||
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (supplier.supplier_code && supplier.supplier_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.country && supplier.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (supplier.location && supplier.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        supplier.contact.contact_person.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [suppliers, searchQuery]);

  // 定義表格欄位
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: '供應商名稱',
      sortable: true,
      render: (value) => <span className="font-medium text-morandi-primary">{value}</span>,
    },
    {
      key: 'supplier_code',
      label: '供應商編號',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'country',
      label: '國家',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'location',
      label: '地點',
      sortable: true,
      render: (value) => <span className="text-morandi-primary">{value || '-'}</span>,
    },
    {
      key: 'type',
      label: '服務項目',
      sortable: true,
      render: (value) => (
        <Badge variant="secondary" className="text-xs">
          {supplierTypeLabels[value as Supplier['type']]}
        </Badge>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="供應商管理"
        icon={Building2}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '供應商管理', href: '/database/suppliers' }
        ]}
        showSearch={true}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="搜尋供應商名稱、聯絡人或服務項目..."
        onAdd={handleOpenAddDialog}
        addLabel="新增供應商"
      />

      {/* 供應商列表 */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={columns}
          data={filteredSuppliers}
          loading={false}
        />
      </div>

      {/* 新增供應商對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="輸入供應商名稱"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">國家 *</label>
                  <Select
                    value={newSupplier.country}
                    onValueChange={(value) => setNewSupplier(prev => ({ ...prev, country: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="選擇國家" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCountries.map((dest) => (
                        <SelectItem key={dest.code} value={dest.name}>
                          {dest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">地點</label>
                  <Input
                    value={newSupplier.location}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="輸入地點"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">服務類別 *</label>
                  <Select
                    value={newSupplier.type}
                    onValueChange={(value: Supplier['type']) => setNewSupplier(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(supplierTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 聯絡資訊 */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-morandi-primary">聯絡資訊</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">聯絡人 *</label>
                  <Input
                    value={newSupplier.contact.contact_person}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contact: { ...prev.contact, contact_person: e.target.value }
                    }))}
                    placeholder="聯絡人姓名"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">電話</label>
                  <Input
                    value={newSupplier.contact.phone}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    placeholder="聯絡電話"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">電子信箱</label>
                  <Input
                    type="email"
                    value={newSupplier.contact.email}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    placeholder="example@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">網站</label>
                  <Input
                    value={newSupplier.contact.website}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contact: { ...prev.contact, website: e.target.value }
                    }))}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-morandi-primary">地址</label>
                <Input
                  value={newSupplier.contact.address}
                  onChange={(e) => setNewSupplier(prev => ({
                    ...prev,
                    contact: { ...prev.contact, address: e.target.value }
                  }))}
                  placeholder="完整地址"
                  className="mt-1"
                />
              </div>
            </div>

            {/* 備註 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary">備註</label>
              <Input
                value={newSupplier.note}
                onChange={(e) => setNewSupplier(prev => ({ ...prev, note: e.target.value }))}
                placeholder="供應商備註資訊"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                onClick={handleAddSupplier}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增供應商
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}