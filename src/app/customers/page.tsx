'use client';

import { useState, useMemo } from 'react';
import { Mail, Phone, MapPin, Calendar, Edit } from 'lucide-react';

import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { Input } from '@/components/ui/input';
import { useTourStore, useOrderStore, useCustomerStore } from '@/stores';

export default function CustomersPage() {
  const { items: customers, create: addCustomer } = useCustomerStore();
  const { items: orders } = useOrderStore();
  const { items: tours } = useTourStore();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) return;

    await addCustomer({
      ...newCustomer,
      code: '', // 由 Store 自動生成
      is_vip: false,
      is_active: true,
      total_spent: 0
    });

    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsAddDialogOpen(false);
  };

  const getCustomerOrders = (_customer_id: string) => {
    // ✅ 透過 Order.customer_id 反查（目前 Order 類型還沒有 customer_id，暫時返回空陣列）
    // TODO: 等 Order 類型加入 customer_id 後，改為: orders.filter(order => order.customer_id === _customer_id)
    return [];
  };

  const getCustomerTours = (_customer_id: string) => {
    // ✅ 透過反查訂單的 tour_id
    const customerOrders = getCustomerOrders(_customer_id);
    const tourIds = new Set(customerOrders.map((o) => o.tour_id));
    return tours.filter(tour => tourIds.has(tour.id));
  };

  // 模擬更豐富的顧客資料
  const enrichedCustomers = filteredCustomers.map(customer => {
    const customerOrders = getCustomerOrders(customer.id);
    const customerTours = getCustomerTours(customer.id);
    const lastOrderDate = customerOrders.length > 0
      ? new Date(Math.max(...customerOrders.map((o) => new Date(o.created_at).getTime())))
      : null;

    return {
      ...customer,
      orderCount: customerOrders.length,
      tourCount: customerTours.length,
      lastOrderDate: lastOrderDate?.toLocaleDateString(),
      avgOrderValue: customerOrders.length > 0
        ? customerOrders.reduce((sum: number, o: any) => sum + o.total_amount, 0) / customerOrders.length
        : 0
    };
  });

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: '姓名',
      sortable: true,
      render: (value, customer) => (
        <div>
          <div className="text-sm font-medium text-morandi-primary">{customer.name}</div>
          <div className="text-xs text-morandi-secondary">ID: {customer.id}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      label: '聯絡方式',
      sortable: false,
      render: (value, customer) => (
        <div>
          {customer.email && (
            <div className="flex items-center text-sm text-morandi-primary mb-1">
              <Mail size={12} className="mr-1" />
              {customer.email}
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center text-sm text-morandi-secondary">
              <Phone size={12} className="mr-1" />
              {customer.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'address',
      label: '地址',
      sortable: true,
      render: (value, customer) => (
        <div>
          {customer.address && (
            <div className="flex items-center text-sm text-morandi-primary">
              <MapPin size={12} className="mr-1" />
              {customer.address}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'orders',
      label: '訂單/旅遊團',
      sortable: true,
      render: (value, customer) => (
        <div className="text-sm">
          <div className="text-morandi-primary">訂單: {customer.orderCount} 筆</div>
          <div className="text-morandi-secondary">旅遊團: {customer.tourCount} 個</div>
        </div>
      ),
    },
    {
      key: 'totalSpent',
      label: '消費紀錄',
      sortable: true,
      render: (value, customer) => (
        <div className="text-sm">
          <div className="font-medium text-morandi-primary">
            總計: NT$ {customer.total_spent.toLocaleString()}
          </div>
          {customer.avgOrderValue > 0 && (
            <div className="text-morandi-secondary">
              平均: NT$ {customer.avgOrderValue.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'lastOrderDate',
      label: '最後消費',
      sortable: true,
      render: (value, customer) => (
        <div>
          {customer.lastOrderDate && (
            <div className="flex items-center text-xs text-morandi-secondary">
              <Calendar size={12} className="mr-1" />
              {customer.lastOrderDate}
            </div>
          )}
        </div>
      ),
    },
  ], []);

  const totalCustomers = customers.length;
  const _activeCustomers = customers.filter(c => (c.total_orders ?? 0) > 0).length;
  const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent ?? 0), 0);
  const _avgSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="顧客管理"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋顧客姓名、電話、Email..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增顧客"
      >
        <div className="text-sm text-morandi-secondary">
          {filteredCustomers.length} 位顧客
        </div>
      </ResponsiveHeader>

      <div className="flex-1 overflow-auto">
        <EnhancedTable
        className="min-h-full"
        columns={tableColumns}
        data={enrichedCustomers}
        actions={() => (
          <Button
            variant="outline"
            size="sm"
            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯顧客"
          >
            <Edit size={14} className="text-morandi-gold" />
          </Button>
        )}
      />
      </div>

      {/* 新增顧客對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增顧客</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">姓名</label>
              <Input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入顧客姓名"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">Email</label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="輸入 Email 地址"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">電話</label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="輸入聯絡電話"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">地址</label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                placeholder="輸入地址"
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
                onClick={handleAddCustomer}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}