'use client';

import { useState, useMemo, useCallback } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useSupplierStore } from '@/stores/supplier-store';
import {
  Building2,
  Hotel,
  UtensilsCrossed,
  Car,
  Ticket,
  UserCheck,
  Package,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Users,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Supplier } from '@/stores/types';

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
  const { suppliers, addSupplier, searchSuppliers } = useSupplierStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    type: 'hotel' as Supplier['type'],
    contact: {
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      website: ''
    },
    status: 'active' as Supplier['status'],
    note: ''
  });

  const handleAddSupplier = useCallback(() => {
    if (!newSupplier.name.trim() || !newSupplier.contact.contactPerson.trim()) return;

    addSupplier(newSupplier);

    setNewSupplier({
      name: '',
      type: 'hotel',
      contact: {
        contactPerson: '',
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
    return suppliers.filter(supplier => {
      const matchesSearch = searchQuery === '' ||
        searchSuppliers(searchQuery).some(s => s.id === supplier.id);
      const matchesType = typeFilter === 'all' || supplier.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [suppliers, searchQuery, typeFilter, statusFilter, searchSuppliers]);

  // 統計資料 - 使用 useMemo 優化
  const statistics = useMemo(() => ({
    totalSuppliers: suppliers.length,
    activeSuppliers: suppliers.filter(s => s.status === 'active').length,
    totalPriceItems: suppliers.reduce((sum, s) => sum + s.priceList.length, 0),
    typeDistribution: suppliers.reduce((acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  }), [suppliers]);

  return (
    <>
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
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增供應商"
        actions={
          <div className="flex items-center gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="服務類別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部類別</SelectItem>
                {Object.entries(supplierTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="active">活躍</SelectItem>
                <SelectItem value="inactive">停用</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-morandi-secondary">
              {filteredSuppliers.length} 個供應商
            </div>
          </div>
        }
      />

      {/* 統計卡片 */}
      <div className="morandi-card p-6">
        <h3 className="text-lg font-semibold text-morandi-primary mb-4">供應商統計</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">總供應商數</p>
                <p className="text-2xl font-bold text-morandi-primary">{statistics.totalSuppliers}</p>
              </div>
              <Building2 size={24} className="text-morandi-gold" />
            </div>
          </div>

          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">活躍供應商</p>
                <p className="text-2xl font-bold text-morandi-green">{statistics.activeSuppliers}</p>
              </div>
              <Users size={24} className="text-morandi-green" />
            </div>
          </div>

          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">價格項目</p>
                <p className="text-2xl font-bold text-morandi-primary">{statistics.totalPriceItems}</p>
              </div>
              <DollarSign size={24} className="text-morandi-primary" />
            </div>
          </div>

          <div className="p-4 bg-morandi-container/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-morandi-secondary mb-1">服務類別</p>
                <p className="text-2xl font-bold text-morandi-gold">{Object.keys(statistics.typeDistribution).length}</p>
              </div>
              <Package size={24} className="text-morandi-gold" />
            </div>
          </div>
        </div>
      </div>

      {/* 供應商列表 */}
      <div className="morandi-card p-6">
        {/* 快速篩選標籤 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
            className="h-8"
          >
            全部
          </Button>
          {Object.entries(supplierTypeLabels).map(([value, label]) => {
            const Icon = supplierTypeIcons[value as keyof typeof supplierTypeIcons];
            const count = statistics.typeDistribution[value] || 0;
            return (
              <Button
                key={value}
                variant={typeFilter === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(value)}
                className="h-8"
              >
                <Icon size={14} className="mr-1" />
                {label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* 供應商列表 */}
      <div className="morandi-card p-6">
        <div className="space-y-4">
          {filteredSuppliers.map((supplier) => {
            const Icon = supplierTypeIcons[supplier.type];
            const typeColor = supplierTypeColors[supplier.type];
            const typeLabel = supplierTypeLabels[supplier.type];

            return (
              <div
                key={supplier.id}
                className="bg-morandi-container/10 border border-morandi-border rounded-lg p-6 hover:bg-morandi-container/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-lg flex items-center justify-center',
                      typeColor
                    )}>
                      <Icon size={24} className="text-white" />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-morandi-primary mb-1">
                        {supplier.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {typeLabel}
                        </Badge>
                        <Badge
                          variant={supplier.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {supplier.status === 'active' ? '活躍' : '停用'}
                        </Badge>
                      </div>
                      {supplier.note && (
                        <p className="text-sm text-morandi-secondary">{supplier.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      編輯
                    </Button>
                    <Button variant="outline" size="sm">
                      價格清單
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 聯絡資訊 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-morandi-primary">聯絡資訊</h4>
                    <div className="space-y-1 text-sm text-morandi-secondary">
                      <div className="flex items-center gap-2">
                        <UserCheck size={12} />
                        {supplier.contact.contactPerson}
                      </div>
                      {supplier.contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone size={12} />
                          {supplier.contact.phone}
                        </div>
                      )}
                      {supplier.contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={12} />
                          {supplier.contact.email}
                        </div>
                      )}
                      {supplier.contact.address && (
                        <div className="flex items-center gap-2">
                          <MapPin size={12} />
                          {supplier.contact.address}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 服務項目統計 */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-morandi-primary">服務項目</h4>
                    <div className="text-sm text-morandi-secondary">
                      <div>總項目: {supplier.priceList.length} 個</div>
                      {supplier.priceList.length > 0 && (
                        <div>
                          價格範圍: NT$ {Math.min(...supplier.priceList.map(p => p.unitPrice)).toLocaleString()} -
                          NT$ {Math.max(...supplier.priceList.map(p => p.unitPrice)).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 帳戶資訊 */}
                  {supplier.bankInfo && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-morandi-primary">帳戶資訊</h4>
                      <div className="space-y-1 text-sm text-morandi-secondary">
                        <div>{supplier.bankInfo.bankName}</div>
                        <div>帳號: {supplier.bankInfo.accountNumber}</div>
                        <div>戶名: {supplier.bankInfo.accountName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12 text-morandi-secondary">
              <Building2 size={48} className="mx-auto mb-4 opacity-50" />
              <p>找不到符合條件的供應商</p>
              {searchQuery && (
                <Button
                  variant="link"
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  清除搜尋條件
                </Button>
              )}
            </div>
          )}
        </div>
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
              <h3 className="text-sm font-medium text-morandi-primary">基本資訊</h3>

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
                    value={newSupplier.contact.contactPerson}
                    onChange={(e) => setNewSupplier(prev => ({
                      ...prev,
                      contact: { ...prev.contact, contactPerson: e.target.value }
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
    </>
  );
}