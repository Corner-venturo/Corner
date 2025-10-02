'use client';

import { useState, useMemo } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useTourStore } from '@/stores/tour-store';
import { Users, User, Mail, Phone, MapPin, Calendar, DollarSign, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { customers, orders, tours, addCustomer } = useTourStore();
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

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) return;

    addCustomer({
      ...newCustomer,
      orders: [],
      tours: [],
      totalSpent: 0
    });

    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: ''
    });
    setIsAddDialogOpen(false);
  };

  const getCustomerOrders = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return orders.filter(order => customer.orders.includes(order.id));
  };

  const getCustomerTours = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return [];
    return tours.filter(tour => customer.tours.includes(tour.id));
  };

  // 模擬更豐富的顧客資料
  const enrichedCustomers = filteredCustomers.map(customer => {
    const customerOrders = getCustomerOrders(customer.id);
    const customerTours = getCustomerTours(customer.id);
    const lastOrderDate = customerOrders.length > 0
      ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
      : null;

    return {
      ...customer,
      orderCount: customerOrders.length,
      tourCount: customerTours.length,
      lastOrderDate: lastOrderDate?.toLocaleDateString(),
      avgOrderValue: customerOrders.length > 0
        ? customerOrders.reduce((sum, o) => sum + o.totalAmount, 0) / customerOrders.length
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
          <div className="font-medium text-morandi-primary">{customer.name}</div>
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
            總計: NT$ {customer.totalSpent.toLocaleString()}
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
  const activeCustomers = customers.filter(c => c.orders.length > 0).length;
  const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgSpentPerCustomer = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="顧客管理"
        icon={Users}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '顧客管理', href: '/customers' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋顧客姓名、電話、Email..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增顧客"
        actions={
          <div className="text-sm text-morandi-secondary">
            {filteredCustomers.length} 位顧客
          </div>
        }
      />

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-morandi-secondary mb-1">總顧客數</p>
              <p className="text-2xl font-bold text-morandi-primary">{totalCustomers}</p>
            </div>
            <Users size={24} className="text-morandi-gold" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-morandi-secondary mb-1">活躍顧客</p>
              <p className="text-2xl font-bold text-morandi-green">{activeCustomers}</p>
            </div>
            <User size={24} className="text-morandi-green" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-morandi-secondary mb-1">總消費額</p>
              <p className="text-2xl font-bold text-morandi-primary">
                NT$ {totalSpent.toLocaleString()}
              </p>
            </div>
            <DollarSign size={24} className="text-morandi-primary" />
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-morandi-secondary mb-1">平均消費</p>
              <p className="text-2xl font-bold text-morandi-gold">
                NT$ {avgSpentPerCustomer.toLocaleString()}
              </p>
            </div>
            <DollarSign size={24} className="text-morandi-gold" />
          </div>
        </div>
      </div>

      {/* 顧客列表 */}
      <EnhancedTable
        columns={tableColumns}
        data={enrichedCustomers}
        actions={(customer) => (
          <Button
            variant="outline"
            size="sm"
            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯顧客"
          >
            <Edit size={14} className="text-morandi-gold" />
          </Button>
        )}
        emptyState={
          <div className="text-center py-8 text-morandi-secondary">
            <Users size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-morandi-primary mb-2">還沒有任何顾客</p>
            <p className="text-sm text-morandi-secondary mb-6">點擊右上角「新增顧客」開始建立</p>
            <div className="text-sm text-morandi-secondary space-y-1">
              <p>• 顧客管理將包含姓名、聯絡方式、地址等基本資訊</p>
              <p>• 自動統計訂單數量、旅遊團參與數、總消費額和平均消費</p>
              <p>• 顯示最後消費時間和活躍度，方便進行客戶關係管理</p>
            </div>
          </div>
        }
      />

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