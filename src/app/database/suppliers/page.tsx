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
  Package,
  Plane
} from 'lucide-react';
// import { cn } from '@/lib/utils';
import { Supplier, SupplierPaymentAccount } from '@/types/supplier.types';
import { EnhancedTable, type TableColumn } from '@/components/ui/enhanced-table';
import { supplierService } from '@/features/suppliers/services/supplier.service';
import { useRegionStoreNew } from '@/stores';
import { PaymentAccountsManager } from '@/components/suppliers/PaymentAccountsManager';

const _supplierTypeIcons = {
  hotel: Hotel,
  restaurant: UtensilsCrossed,
  transport: Car,
  ticket: Ticket,
  guide: UserCheck,
  travel_agency: Plane,
  other: Package
};

const supplierTypeLabels = {
  hotel: '飯店住宿',
  restaurant: '餐廳',
  transport: '交通',
  ticket: '門票',
  guide: '導遊',
  travel_agency: '旅行社',
  other: '其他'
};

const _supplierTypeColors = {
  hotel: 'bg-blue-500',
  restaurant: 'bg-green-500',
  transport: 'bg-orange-500',
  ticket: 'bg-purple-500',
  guide: 'bg-pink-500',
  travel_agency: 'bg-cyan-500',
  other: 'bg-gray-500'
};

export default function SuppliersPage() {
  const { items: suppliers, create: addSupplier } = useSupplierStore();
  const { countries, regions, cities, fetchAll: fetchRegions, getRegionsByCountry, getCitiesByCountry, getCitiesByRegion } = useRegionStoreNew();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 懶載入：打開新增對話框時才載入地區資料
  const handleOpenAddDialog = useCallback(() => {
    if (countries.length === 0) {
      fetchRegions();
    }
    setIsAddDialogOpen(true);
  }, [countries.length, fetchRegions]);

  // 取得啟用的國家列表
  const activeCountries = useMemo(() => {
    return countries
      .filter(c => c.is_active)
      .map(c => ({ code: c.id, name: c.name, emoji: c.emoji }));
  }, [countries]);

  const [newSupplier, setNewSupplier] = useState({
    supplier_code: '',
    name: '',
    country: '',
    region: '',
    cities: [] as string[],
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

  // 付款帳戶列表
  const [paymentAccounts, setPaymentAccounts] = useState<Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>[]>([]);
  const [currentAccount, setCurrentAccount] = useState<Omit<SupplierPaymentAccount, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>>({
    account_name: '',
    account_holder: '',
    bank_name: '',
    bank_code: '',
    bank_branch: '',
    account_number: '',
    swift_code: '',
    currency: 'TWD',
    account_type: 'checking',
    is_default: false,
    is_active: true,
    note: ''
  });

  // 級聯選單：根據選擇的國家取得地區
  const availableRegions = useMemo(() => {
    if (!newSupplier.country) return [];
    return getRegionsByCountry(newSupplier.country);
  }, [newSupplier.country, getRegionsByCountry]);

  // 級聯選單：根據選擇的地區或國家取得城市
  const availableCities = useMemo(() => {
    if (newSupplier.region) {
      return getCitiesByRegion(newSupplier.region);
    } else if (newSupplier.country) {
      return getCitiesByCountry(newSupplier.country);
    }
    return [];
  }, [newSupplier.country, newSupplier.region, getCitiesByCountry, getCitiesByRegion]);

  // 當國家改變時，清空地區和城市
  const handleCountryChange = useCallback((countryId: string) => {
    setNewSupplier(prev => ({
      ...prev,
      country: countryId,
      region: '',
      cities: []
    }));
  }, []);

  // 當地區改變時，清空城市
  const handleRegionChange = useCallback((regionId: string) => {
    setNewSupplier(prev => ({
      ...prev,
      region: regionId,
      cities: []
    }));
  }, []);

  // 切換城市選擇（多選）
  const toggleCitySelection = useCallback((cityId: string) => {
    setNewSupplier(prev => ({
      ...prev,
      cities: prev.cities.includes(cityId)
        ? prev.cities.filter(id => id !== cityId) // 取消選擇
        : [...prev.cities, cityId] // 新增選擇
    }));
  }, []);

  const handleAddSupplier = useCallback(async () => {
    if (!newSupplier.name.trim() || !newSupplier.contact.contact_person.trim()) return;
    if (!newSupplier.country) {
      alert('請選擇國家');
      return;
    }
    if (newSupplier.cities.length === 0) {
      alert('請至少選擇一個服務城市');
      return;
    }

    try {
      // 自動生成供應商編號：S + 國家代碼 + 流水號
      // 例如：STHA001（泰國第1個）、SJPN001（日本第1個）
      const country = countries.find(c => c.id === newSupplier.country);
      const countryCode = country?.code || 'OTH';

      // 計算該國家已有的供應商數量
      const suppliersArray = suppliers ? Object.values(suppliers) : [];
      const sameCountryCount = suppliersArray.filter(
        (s: Supplier) => s.country === newSupplier.country
      ).length;

      const sequence = (sameCountryCount + 1).toString().padStart(3, '0');
      const supplierCode = `S${countryCode}${sequence}`;

      // 使用 service 建立供應商（包含城市關聯和付款帳戶）
      await supplierService.createSupplierWithCities(
        {
          supplier_code: supplierCode,
          name: newSupplier.name,
          country: newSupplier.country,
          region: newSupplier.region,
          type: newSupplier.type,
          contact: newSupplier.contact,
          status: newSupplier.status,
          note: newSupplier.note
        },
        newSupplier.cities,
        paymentAccounts
      );

      // 重置表單
      setNewSupplier({
        supplier_code: '',
        name: '',
        country: '',
        region: '',
        cities: [],
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
      setPaymentAccounts([]); // 重置付款帳戶
      setIsAddDialogOpen(false);

      // 重新載入供應商列表
      const store = useSupplierStore.getState();
      await store.fetchAll();
    } catch (error) {
            alert('新增供應商失敗，請稍後再試');
    }
  }, [newSupplier]);

  // 過濾供應商 - 使用 useMemo 優化
  const filteredSuppliers = useMemo(() => {
    // 將 suppliers 物件轉為陣列
    const suppliersArray = suppliers ? Object.values(suppliers) : [];

    return suppliersArray.filter(supplier => {
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
                    onValueChange={handleCountryChange}
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
                      value={newSupplier.region}
                      onValueChange={handleRegionChange}
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
                      服務城市 * ({newSupplier.cities.length} 個已選)
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
                              checked={newSupplier.cities.includes(city.id)}
                              onChange={() => toggleCitySelection(city.id)}
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

            {/* 付款帳戶 */}
            <div className="space-y-4">
              <PaymentAccountsManager
                accounts={paymentAccounts}
                onChange={setPaymentAccounts}
              />
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