'use client';

import { useState, useMemo, useCallback } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { usePayments } from '@/features/payments/hooks/usePayments';
import { useTours } from '@/features/tours/hooks/useTours';
import { useOrders } from '@/features/orders/hooks/useOrders';
import { useSupplierStore } from '@/stores';
import { PaymentRequest, PaymentRequestItem } from '@/stores/types';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusLabels: Record<PaymentRequest['status'], string> = {
  pending: '請款中',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款'
};

const statusColors: Record<PaymentRequest['status'], string> = {
  pending: 'bg-morandi-gold',
  processing: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary'
};

const categoryOptions = [
  { value: '住宿', label: '🏨 住宿' },
  { value: '交通', label: '🚌 交通' },
  { value: '餐食', label: '🍽️ 餐食' },
  { value: '門票', label: '🎫 門票' },
  { value: '導遊', label: '👥 導遊' },
  { value: '其他', label: '📦 其他' }
];

export default function RequestsPage() {
  const {
    payment_requests,
    createPaymentRequest,
    addPaymentItem
  } = usePayments();

  const { tours } = useTours();
  const { orders } = useOrders();
  const { items: suppliers } = useSupplierStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);

  const [newRequest, setNewRequest] = useState({
    tour_id: '',
    order_id: '',
    request_date: '',
    note: '',
    is_special_billing: false, // 特殊出帳標記
    created_by: '1' // 模擬當前用戶ID
  });

  // 批次請款狀態
  const [selectedTourIds, setSelectedTourIds] = useState<string[]>([]);
  const [batchRequest, setBatchRequest] = useState({
    request_date: '',
    note: '',
    is_special_billing: false,
    created_by: '1'
  });
  const [batchTourSearch, setBatchTourSearch] = useState('');
  const [showBatchTourDropdown, setShowBatchTourDropdown] = useState(false);

  // 搜尋相關狀態
  const [tourSearchValue, setTourSearchValue] = useState('');
  const [orderSearchValue, setOrderSearchValue] = useState('');
  const [showTourDropdown, setShowTourDropdown] = useState(false);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

  const [requestItems, setRequestItems] = useState<Array<{
    id: string;
    category: PaymentRequestItem['category'];
    supplier_id: string;
    supplierName: string;
    description: string;
    unit_price: number;
    quantity: number;
  }>>([]);

  const [newItem, setNewItem] = useState({
    category: '住宿' as PaymentRequestItem['category'],
    supplier_id: '',
    description: '',
    unit_price: 0,
    quantity: 1
  });

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'request_number',
      label: '請款單號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'tour_name',
      label: '團號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'order_number',
      label: '訂單編號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="text-sm text-morandi-primary">{value || '無'}</div>
      )
    },
    {
      key: 'request_date',
      label: '請款日期',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value, row) => (
        <div className="text-sm">
          <div className={row.is_special_billing ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'}>
            {value ? new Date(value).toLocaleDateString('zh-TW') : '未設定'}
          </div>
          {row.is_special_billing && (
            <div className="text-xs text-morandi-gold">⚠️ 特殊出帳</div>
          )}
        </div>
      )
    },
    {
      key: 'total_amount',
      label: '金額',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <div className="font-semibold text-morandi-gold">
          NT$ {value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'pending', label: '請款中' },
        { value: 'processing', label: '處理中' },
        { value: 'confirmed', label: '已確認' },
        { value: 'paid', label: '已付款' }
      ],
      render: (value) => {
        const statusBadge = getStatusBadge(value);
        return (
          <Badge className={cn('text-xs text-white', statusBadge.color)}>
            {statusBadge.label}
          </Badge>
        );
      }
    }
  ], []);

  // 排序和篩選函數
  const sortFunction = useCallback((data: PaymentRequest[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number | Date, bValue: string | number | Date;

      switch (column) {
        case 'request_number':
          aValue = a.request_number;
          bValue = b.request_number;
          break;
        case 'tour_name':
          aValue = a.tour_name || '';
          bValue = b.tour_name || '';
          break;
        case 'order_number':
          aValue = a.order_number || '';
          bValue = b.order_number || '';
          break;
        case 'request_date':
          aValue = new Date(a.request_date || 0);
          bValue = new Date(b.request_date || 0);
          break;
        case 'total_amount':
          aValue = a.total_amount;
          bValue = b.total_amount;
          break;
        case 'status':
          aValue = statusLabels[a.status];
          bValue = statusLabels[b.status];
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const filterFunction = useCallback((data: PaymentRequest[], filters: Record<string, string>) => {
    return data.filter(request => {
      return (
        (!filters.request_number || request.request_number.toLowerCase().includes(filters.request_number.toLowerCase())) &&
        (!filters.tour_name || (request.tour_name || '').toLowerCase().includes(filters.tour_name.toLowerCase())) &&
        (!filters.order_number || (request.order_number || '').toLowerCase().includes(filters.order_number.toLowerCase())) &&
        (!filters.request_date || (request.request_date || '').includes(filters.request_date)) &&
        (!filters.total_amount || request.total_amount.toString().includes(filters.total_amount)) &&
        (!filters.status || request.status === filters.status)
      );
    });
  }, []);

  const { data: filteredAndSortedRequests, handleSort, handleFilter } = useEnhancedTable(
    payment_requests as unknown, // 使用新的 Store 型別
    sortFunction,
    filterFunction
  );

  // 生成請款單號預覽（實際編號由 Store 自動生成）
  const generateRequestNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = payment_requests.length + 1;
    return `PR${year}${count.toString().padStart(4, '0')}`;
  }, [payment_requests.length]);

  // 添加項目到列表
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

  // 移除項目
  const removeItem = useCallback((itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // 計算總金額
  const total_amount = useMemo(() =>
    requestItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0)
  , [requestItems]);

  // 過濾旅遊團 - 可以搜尋團號、團名、出發日期
  const filteredTours = useMemo(() =>
    tours.filter(tour => {
      const searchTerm = tourSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const tourCode = tour.code?.toLowerCase() || '';
      const tour_name = tour.name?.toLowerCase() || '';
      const departure_date = tour.departure_date || '';

      // 提取日期中的數字 (例如: 2024-08-20 -> "0820")
      const dateNumbers = departure_date.replace(/\D/g, '').slice(-4); // 取最後4位數字 (MMDD)

      return tourCode.includes(searchTerm) ||
             tour_name.includes(searchTerm) ||
             dateNumbers.includes(searchTerm.replace(/\D/g, '')); // 移除搜尋詞中的非數字字符
    })
  , [tours, tourSearchValue]);

  // 過濾訂單 - 可以搜尋訂單號、聯絡人
  const filteredOrders = useMemo(() =>
    orders.filter(order => {
      if (!newRequest.tour_id) return false; // 必須先選擇旅遊團
      if (order.tour_id !== newRequest.tour_id) return false; // 只顯示當前團的訂單

      const searchTerm = orderSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const order_number = order.order_number?.toLowerCase() || '';
      const contact_person = order.contact_person?.toLowerCase() || '';

      return order_number.includes(searchTerm) || contact_person.includes(searchTerm);
    })
  , [orders, newRequest.tour_id, orderSearchValue]);


  const handleAddRequest = async () => {
    if (!newRequest.tour_id || requestItems.length === 0) return;

    const selectedTour = tours.find(t => t.id === newRequest.tour_id);
    const selectedOrder = orders.find(o => o.id === newRequest.order_id);

    if (!selectedTour) return;

    // 創建請款單（不包含 items，因為會透過 service 添加）
    const request = await createPaymentRequest({
      tour_id: newRequest.tour_id,
      code: selectedTour.code,
      tour_name: selectedTour.name,
      order_id: newRequest.order_id || undefined,
      order_number: selectedOrder?.order_number,
      request_date: newRequest.request_date,
      items: [], // 初始為空陣列
      total_amount: 0, // 初始為 0，會在添加項目時自動計算
      status: 'pending',
      note: newRequest.note,
      budget_warning: false
      // created_by 會在 service 層自動填入
    } as unknown);

    // 依序添加所有項目（使用 for...of 確保順序執行）
    for (let i = 0; i < requestItems.length; i++) {
      const item = requestItems[i];
      await addPaymentItem(request.id, {
        category: item.category,
        supplier_id: item.supplier_id,
        supplier_name: item.supplierName,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        note: '',
        sort_order: i + 1
      });
    }

    // 重置表單
    setNewRequest({
      tour_id: '',
      order_id: '',
      request_date: '',
      note: '',
      is_special_billing: false,
      created_by: '1'
    });
    setRequestItems([]);
    setTourSearchValue('');
    setOrderSearchValue('');
    setShowTourDropdown(false);
    setShowOrderDropdown(false);
    setIsAddDialogOpen(false);
  };


  const getStatusBadge = (status: PaymentRequest['status']) => {
    return {
      label: statusLabels[status],
      color: statusColors[status]
    };
  };

  // 批次請款處理
  const handleBatchRequest = async () => {
    if (selectedTourIds.length === 0 || requestItems.length === 0) return;

    // 為每個選中的旅遊團建立請款單
    for (const tourId of selectedTourIds) {
      const selectedTour = tours.find(t => t.id === tourId);
      if (!selectedTour) continue;

      // 創建請款單
      const request = await createPaymentRequest({
        tour_id: tourId,
        code: selectedTour.code,
        tour_name: selectedTour.name,
        request_date: batchRequest.request_date,
        items: [],
        total_amount: 0,
        status: 'pending',
        note: batchRequest.note,
        budget_warning: false
      } as unknown);

      // 添加所有項目
      for (let i = 0; i < requestItems.length; i++) {
        const item = requestItems[i];
        await addPaymentItem(request.id, {
          category: item.category,
          supplier_id: item.supplier_id,
          supplier_name: item.supplierName,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          note: '',
          sort_order: i + 1
        });
      }
    }

    // 重置表單
    setSelectedTourIds([]);
    setBatchRequest({
      request_date: '',
      note: '',
      is_special_billing: false,
      created_by: '1'
    });
    setRequestItems([]);
    setBatchTourSearch('');
    setShowBatchTourDropdown(false);
    setIsBatchDialogOpen(false);
  };


  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="請款管理"
        actions={
          <>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={16} className="mr-2" />
              新增請款
            </button>
            <button
              onClick={() => setIsBatchDialogOpen(true)}
              className="bg-morandi-primary hover:bg-morandi-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
            >
              <FileText size={16} className="mr-2" />
              批次請款
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={tableColumns}
          data={filteredAndSortedRequests}
          onSort={handleSort}
          onFilter={handleFilter}
          selection={undefined}
        />
      </div>

      {/* 新增請款單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增請款單</DialogTitle>
            <p className="text-sm text-morandi-secondary">
              請款單號: {generateRequestNumber()} (自動生成)
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* 基本資訊區塊 */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">選擇旅遊團 *</label>
                  <div className="relative">
                    <Input
                      placeholder="搜尋團號、團名或日期 (如: 0820)..."
                      value={tourSearchValue}
                      onChange={(e) => setTourSearchValue(e.target.value)}
                      onClick={() => setShowTourDropdown(true)}
                      onBlur={() => setTimeout(() => setShowTourDropdown(false), 200)}
                      className="mt-1 bg-background"
                    />
                    {showTourDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {filteredTours.length > 0 ? (
                          filteredTours.map((tour) => (
                            <div
                              key={tour.id}
                              onClick={() => {
                                setNewRequest(prev => ({
                                  ...prev,
                                  tour_id: tour.id,
                                  order_id: '' // 重置訂單選擇
                                }));
                                setTourSearchValue(`${tour.code} - ${tour.name}`);
                                setOrderSearchValue(''); // 重置訂單搜尋
                                setShowTourDropdown(false);
                              }}
                              className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium">{tour.code} - {tour.name}</div>
                              <div className="text-sm text-morandi-secondary">
                                出發: {new Date(tour.departure_date).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-morandi-secondary">找不到相符的旅遊團</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">選擇訂單（可選）</label>
                  <div className="relative">
                    <Input
                      placeholder={newRequest.tour_id ? "搜尋訂單號或聯絡人..." : "請先選擇旅遊團"}
                      value={orderSearchValue}
                      onChange={(e) => setOrderSearchValue(e.target.value)}
                      onClick={() => newRequest.tour_id && setShowOrderDropdown(true)}
                      onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                      className="mt-1 bg-background"
                      disabled={!newRequest.tour_id}
                    />
                    {showOrderDropdown && newRequest.tour_id && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <div
                              key={order.id}
                              onClick={() => {
                                setNewRequest(prev => ({
                                  ...prev,
                                  order_id: order.id
                                }));
                                setOrderSearchValue(`${order.order_number} - ${order.contact_person}`);
                                setShowOrderDropdown(false);
                              }}
                              className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium">{order.order_number}</div>
                              <div className="text-sm text-morandi-secondary">
                                聯絡人: {order.contact_person}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-morandi-secondary">找不到相符的訂單</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">請款日期</label>
                  <Input
                    type="date"
                    value={newRequest.request_date}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const isThursday = selectedDate ? new Date(selectedDate + 'T00:00:00').getDay() === 4 : false;

                      setNewRequest(prev => ({
                        ...prev,
                        request_date: selectedDate,
                        is_special_billing: !isThursday // 非週四自動標記為特殊出帳
                      }));
                    }}
                    className={cn(
                      "mt-1",
                      newRequest.request_date && new Date(newRequest.request_date + 'T00:00:00').getDay() !== 4
                        ? "bg-morandi-gold/10 border-morandi-gold/20"
                        : "bg-background"
                    )}
                  />
                  {newRequest.request_date && (
                    <p className={cn(
                      "text-xs mt-1",
                      new Date(newRequest.request_date + 'T00:00:00').getDay() === 4
                        ? "text-morandi-secondary"
                        : "text-morandi-gold"
                    )}>
                      {new Date(newRequest.request_date + 'T00:00:00').getDay() === 4
                        ? "💼 一般請款：週四出帳"
                        : "⚠️ 特殊出帳：非週四請款"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">備註</label>
                  <Input
                    value={newRequest.note}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="輸入備註（可選）"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 項目新增區塊 */}
            <div className="border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-morandi-primary">新增請款項目</h3>
                <Button
                  type="button"
                  onClick={addItemToList}
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
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as PaymentRequestItem['category'] }))}>
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
                  <Select value={newItem.supplier_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, supplier_id: value }))}>
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

              {/* 小計顯示 */}
              <div className="mt-4 flex justify-end">
                <div className="bg-morandi-container/20 rounded px-4 py-2">
                  <span className="text-sm font-medium text-morandi-secondary mr-2">小計:</span>
                  <span className="text-lg font-semibold text-morandi-gold">
                    NT$ {(newItem.unit_price * newItem.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 項目列表 */}
            {requestItems.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目列表</h3>
                <div className="space-y-2">
                  {requestItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-morandi-container/10 rounded">
                      <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-morandi-secondary">類別:</span>
                          <div className="font-medium">{categoryOptions.find(c => c.value === item.category)?.label}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">供應商:</span>
                          <div className="font-medium">{item.supplierName}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">項目:</span>
                          <div className="font-medium">{item.description}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">單價:</span>
                          <div className="font-medium">NT$ {item.unit_price.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">數量:</span>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">小計:</span>
                          <div className="font-semibold text-morandi-gold">NT$ {(item.unit_price * item.quantity).toLocaleString()}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="ml-4 text-morandi-red hover:bg-morandi-red/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* 總計 */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-morandi-primary">總金額:</span>
                    <span className="text-xl font-bold text-morandi-gold">NT$ {total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 底部操作按鈕 */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setRequestItems([]);
                  setNewRequest({
                    tour_id: '',
                    order_id: '',
                    request_date: '',
                    note: '',
                    is_special_billing: false,
                    created_by: '1'
                  });
                  setTourSearchValue('');
                  setOrderSearchValue('');
                  setShowTourDropdown(false);
                  setShowOrderDropdown(false);
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleAddRequest}
                disabled={!newRequest.tour_id || requestItems.length === 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增請款單 (共 {requestItems.length} 項，NT$ {total_amount.toLocaleString()})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 批次請款對話框 */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>批次請款</DialogTitle>
            <p className="text-sm text-morandi-secondary">
              為多個旅遊團建立相同內容的請款單
            </p>
          </DialogHeader>

          <div className="space-y-6">
            {/* 選擇旅遊團區塊 */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-morandi-primary mb-4">選擇旅遊團</h3>
              <div className="relative">
                <Input
                  placeholder="搜尋團號、團名或日期 (如: 0820)..."
                  value={batchTourSearch}
                  onChange={(e) => setBatchTourSearch(e.target.value)}
                  onClick={() => setShowBatchTourDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBatchTourDropdown(false), 200)}
                  className="bg-background"
                />
                {showBatchTourDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
                    {filteredTours.length > 0 ? (
                      filteredTours.map((tour) => {
                        const isSelected = selectedTourIds.includes(tour.id);
                        return (
                          <div
                            key={tour.id}
                            onClick={() => {
                              setSelectedTourIds(prev =>
                                isSelected
                                  ? prev.filter(id => id !== tour.id)
                                  : [...prev, tour.id]
                              );
                            }}
                            className={cn(
                              "p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0 flex items-center",
                              isSelected && "bg-morandi-gold/10"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{tour.code} - {tour.name}</div>
                              <div className="text-sm text-morandi-secondary">
                                出發: {new Date(tour.departure_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-sm text-morandi-secondary">找不到相符的旅遊團</div>
                    )}
                  </div>
                )}
              </div>

              {/* 已選擇的旅遊團 */}
              {selectedTourIds.length > 0 && (
                <div className="mt-4 p-3 bg-morandi-container/10 rounded">
                  <div className="text-sm font-medium text-morandi-primary mb-2">
                    已選擇 {selectedTourIds.length} 個旅遊團：
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTourIds.map(tourId => {
                      const tour = tours.find(t => t.id === tourId);
                      if (!tour) return null;
                      return (
                        <Badge
                          key={tourId}
                          className="bg-morandi-gold text-white flex items-center gap-2"
                        >
                          {tour.code}
                          <button
                            onClick={() => setSelectedTourIds(prev => prev.filter(id => id !== tourId))}
                            className="hover:bg-morandi-gold-hover rounded-full"
                          >
                            ✕
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 基本資訊區塊 */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-morandi-primary mb-4">基本資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">請款日期</label>
                  <Input
                    type="date"
                    value={batchRequest.request_date}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const isThursday = selectedDate ? new Date(selectedDate + 'T00:00:00').getDay() === 4 : false;

                      setBatchRequest(prev => ({
                        ...prev,
                        request_date: selectedDate,
                        is_special_billing: !isThursday
                      }));
                    }}
                    className={cn(
                      "mt-1",
                      batchRequest.request_date && new Date(batchRequest.request_date + 'T00:00:00').getDay() !== 4
                        ? "bg-morandi-gold/10 border-morandi-gold/20"
                        : "bg-background"
                    )}
                  />
                  {batchRequest.request_date && (
                    <p className={cn(
                      "text-xs mt-1",
                      new Date(batchRequest.request_date + 'T00:00:00').getDay() === 4
                        ? "text-morandi-secondary"
                        : "text-morandi-gold"
                    )}>
                      {new Date(batchRequest.request_date + 'T00:00:00').getDay() === 4
                        ? "💼 一般請款：週四出帳"
                        : "⚠️ 特殊出帳：非週四請款"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary">備註</label>
                  <Input
                    value={batchRequest.note}
                    onChange={(e) => setBatchRequest(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="輸入備註（可選）"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* 項目新增區塊 - 與單一請款共用 */}
            <div className="border border-border rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-morandi-primary">新增請款項目</h3>
                <Button
                  type="button"
                  onClick={addItemToList}
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
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as PaymentRequestItem['category'] }))}>
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
                  <Select value={newItem.supplier_id} onValueChange={(value) => setNewItem(prev => ({ ...prev, supplier_id: value }))}>
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

              {/* 小計顯示 */}
              <div className="mt-4 flex justify-end">
                <div className="bg-morandi-container/20 rounded px-4 py-2">
                  <span className="text-sm font-medium text-morandi-secondary mr-2">小計:</span>
                  <span className="text-lg font-semibold text-morandi-gold">
                    NT$ {(newItem.unit_price * newItem.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 項目列表 */}
            {requestItems.length > 0 && (
              <div className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-medium text-morandi-primary mb-4">請款項目列表</h3>
                <div className="space-y-2">
                  {requestItems.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-morandi-container/10 rounded">
                      <div className="flex-1 grid grid-cols-6 gap-4 text-sm">
                        <div>
                          <span className="text-xs text-morandi-secondary">類別:</span>
                          <div className="font-medium">{categoryOptions.find(c => c.value === item.category)?.label}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">供應商:</span>
                          <div className="font-medium">{item.supplierName}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">項目:</span>
                          <div className="font-medium">{item.description}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">單價:</span>
                          <div className="font-medium">NT$ {item.unit_price.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">數量:</span>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">小計:</span>
                          <div className="font-semibold text-morandi-gold">NT$ {(item.unit_price * item.quantity).toLocaleString()}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="ml-4 text-morandi-red hover:bg-morandi-red/10"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* 總計 */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-morandi-primary">
                      單個團總金額:
                    </span>
                    <span className="text-xl font-bold text-morandi-gold">NT$ {total_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm text-morandi-secondary">
                    <span>批次總金額 ({selectedTourIds.length} 個團):</span>
                    <span className="font-semibold text-morandi-primary">
                      NT$ {(total_amount * selectedTourIds.length).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 底部操作按鈕 */}
            <div className="flex justify-end space-x-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsBatchDialogOpen(false);
                  setSelectedTourIds([]);
                  setBatchRequest({
                    request_date: '',
                    note: '',
                    is_special_billing: false,
                    created_by: '1'
                  });
                  setRequestItems([]);
                  setBatchTourSearch('');
                  setShowBatchTourDropdown(false);
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleBatchRequest}
                disabled={selectedTourIds.length === 0 || requestItems.length === 0}
                className="bg-morandi-primary hover:bg-morandi-primary/90 text-white"
              >
                建立批次請款 ({selectedTourIds.length} 個團，共 {requestItems.length} 項，總計 NT$ {(total_amount * selectedTourIds.length).toLocaleString()})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}