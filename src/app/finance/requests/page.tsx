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
import { useSupplierStore } from '@/stores/supplier-store';
import { PaymentRequest, PaymentRequestItem } from '@/stores/types';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusLabels = {
  pending: '請款中',
  confirmed: '已確認',
  completed: '已完成'
};

const statusColors = {
  pending: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  completed: 'bg-morandi-primary'
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
    paymentRequests,
    createPaymentRequest,
    addPaymentItem
  } = usePayments();

  const { tours, orders } = useTours();
  const { suppliers } = useSupplierStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [newRequest, setNewRequest] = useState({
    tourId: '',
    orderId: '',
    requestDate: '',
    note: '',
    isSpecialBilling: false, // 特殊出帳標記
    createdBy: '1' // 模擬當前用戶ID
  });

  // 搜尋相關狀態
  const [tourSearchValue, setTourSearchValue] = useState('');
  const [orderSearchValue, setOrderSearchValue] = useState('');
  const [showTourDropdown, setShowTourDropdown] = useState(false);
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);

  const [requestItems, setRequestItems] = useState<Array<{
    id: string;
    category: PaymentRequestItem['category'];
    supplierId: string;
    supplierName: string;
    description: string;
    unitPrice: number;
    quantity: number;
  }>>([]);

  const [newItem, setNewItem] = useState({
    category: '住宿' as PaymentRequestItem['category'],
    supplierId: '',
    description: '',
    unitPrice: 0,
    quantity: 1
  });

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'requestNumber',
      label: '請款單號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'tourName',
      label: '團號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'orderNumber',
      label: '訂單編號',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="text-sm text-morandi-primary">{value || '無'}</div>
      )
    },
    {
      key: 'requestDate',
      label: '請款日期',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value, row) => (
        <div className="text-sm">
          <div className={row.isSpecialBilling ? 'text-morandi-gold font-medium' : 'text-morandi-secondary'}>
            {value ? new Date(value).toLocaleDateString('zh-TW') : '未設定'}
          </div>
          {row.isSpecialBilling && (
            <div className="text-xs text-morandi-gold">⚠️ 特殊出帳</div>
          )}
        </div>
      )
    },
    {
      key: 'totalAmount',
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
        { value: 'confirmed', label: '已確認' },
        { value: 'completed', label: '已完成' }
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
        case 'requestNumber':
          aValue = a.requestNumber;
          bValue = b.requestNumber;
          break;
        case 'tourName':
          aValue = a.tourName;
          bValue = b.tourName;
          break;
        case 'orderNumber':
          aValue = a.orderNumber || '';
          bValue = b.orderNumber || '';
          break;
        case 'requestDate':
          aValue = new Date(a.requestDate || 0);
          bValue = new Date(b.requestDate || 0);
          break;
        case 'totalAmount':
          aValue = a.totalAmount;
          bValue = b.totalAmount;
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
        (!filters.requestNumber || request.requestNumber.toLowerCase().includes(filters.requestNumber.toLowerCase())) &&
        (!filters.tourName || request.tourName.toLowerCase().includes(filters.tourName.toLowerCase())) &&
        (!filters.orderNumber || (request.orderNumber || '').toLowerCase().includes(filters.orderNumber.toLowerCase())) &&
        (!filters.requestDate || (request.requestDate || '').includes(filters.requestDate)) &&
        (!filters.totalAmount || request.totalAmount.toString().includes(filters.totalAmount)) &&
        (!filters.status || request.status === filters.status)
      );
    });
  }, []);

  const { data: filteredAndSortedRequests, handleSort, handleFilter } = useEnhancedTable(
    paymentRequests,
    sortFunction,
    filterFunction
  );

  // 生成請款單號
  const generateRequestNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const count = paymentRequests.length + 1;
    return `REQ-${year}${count.toString().padStart(3, '0')}`;
  }, [paymentRequests.length]);

  // 添加項目到列表
  const addItemToList = useCallback(() => {
    if (!newItem.supplierId || !newItem.description) return;

    const selectedSupplier = suppliers.find(s => s.id === newItem.supplierId);
    if (!selectedSupplier) return;

    const itemId = Math.random().toString(36).substr(2, 9);
    setRequestItems(prev => [...prev, {
      id: itemId,
      ...newItem,
      supplierName: selectedSupplier.name,
    }]);

    setNewItem({
      category: '住宿',
      supplierId: '',
      description: '',
      unitPrice: 0,
      quantity: 1
    });
  }, [newItem, suppliers]);

  // 移除項目
  const removeItem = useCallback((itemId: string) => {
    setRequestItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // 計算總金額
  const totalAmount = useMemo(() =>
    requestItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
  , [requestItems]);

  // 生成接下來8週的週四日期
  const upcomingThursdays = useMemo(() => {
    const thursdays = [];
    const today = new Date();
    const currentDay = today.getDay();

    // 找到下一個週四
    let daysUntilThursday = (4 - currentDay + 7) % 7;
    if (daysUntilThursday === 0 && today.getHours() >= 12) { // 如果今天是週四且已過中午，則從下週四開始
      daysUntilThursday = 7;
    }

    for (let i = 0; i < 8; i++) {
      const thursdayDate = new Date(today);
      thursdayDate.setDate(today.getDate() + daysUntilThursday + (i * 7));

      thursdays.push({
        value: thursdayDate.toISOString().split('T')[0],
        label: `${thursdayDate.toLocaleDateString('zh-TW')} (${thursdayDate.toLocaleDateString('zh-TW', { weekday: 'short' })})`
      });
    }

    return thursdays;
  }, []);

  // 過濾旅遊團 - 可以搜尋團號、團名、出發日期
  const filteredTours = useMemo(() =>
    tours.filter(tour => {
      const searchTerm = tourSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const tourCode = tour.code?.toLowerCase() || '';
      const tourName = tour.name?.toLowerCase() || '';
      const departureDate = tour.departureDate || '';

      // 提取日期中的數字 (例如: 2024-08-20 -> "0820")
      const dateNumbers = departureDate.replace(/\D/g, '').slice(-4); // 取最後4位數字 (MMDD)

      return tourCode.includes(searchTerm) ||
             tourName.includes(searchTerm) ||
             dateNumbers.includes(searchTerm.replace(/\D/g, '')); // 移除搜尋詞中的非數字字符
    })
  , [tours, tourSearchValue]);

  // 過濾訂單 - 可以搜尋訂單號、聯絡人
  const filteredOrders = useMemo(() =>
    orders.filter(order => {
      if (!newRequest.tourId) return false; // 必須先選擇旅遊團
      if (order.tourId !== newRequest.tourId) return false; // 只顯示當前團的訂單

      const searchTerm = orderSearchValue.toLowerCase();
      if (!searchTerm) return true;

      const orderNumber = order.orderNumber?.toLowerCase() || '';
      const contactPerson = order.contactPerson?.toLowerCase() || '';

      return orderNumber.includes(searchTerm) || contactPerson.includes(searchTerm);
    })
  , [orders, newRequest.tourId, orderSearchValue]);


  const handleAddRequest = async () => {
    if (!newRequest.tourId || requestItems.length === 0) return;

    const selectedTour = tours.find(t => t.id === newRequest.tourId);
    const selectedOrder = orders.find(o => o.id === newRequest.orderId);

    if (!selectedTour) return;

    const requestNumber = generateRequestNumber();

    // 創建請款單
    const request = await createPaymentRequest({
      tourId: newRequest.tourId,
      code: selectedTour.code,
      tourName: selectedTour.name,
      orderId: newRequest.orderId || undefined,
      orderNumber: selectedOrder?.orderNumber,
      requestDate: newRequest.requestDate,
      status: 'pending', // 固定為草稿狀態
      note: newRequest.note,
      isSpecialBilling: newRequest.isSpecialBilling, // 特殊出帳標記
      createdBy: newRequest.createdBy
    });

    // 添加所有項目
    requestItems.forEach((item, index) => {
      addPaymentItem(request.id, {
        category: item.category,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        note: '', // 預設空白
        sortOrder: index + 1
      });
    });

    // 重置表單
    setNewRequest({
      tourId: '',
      orderId: '',
      requestDate: '',
      note: '',
      isSpecialBilling: false,
      createdBy: '1'
    });
    setRequestItems([]);
    setTourSearchValue('');
    setOrderSearchValue('');
    setIsAddDialogOpen(false);
  };


  const getStatusBadge = (status: PaymentRequest['status']) => {
    return {
      label: statusLabels[status],
      color: statusColors[status]
    };
  };


  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="請款管理"
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增請款單"
      />

      {/* 請款單列表 */}
      <div className="pb-6">
        <EnhancedTable
          columns={tableColumns}
          data={filteredAndSortedRequests}
          onSort={handleSort}
          onFilter={handleFilter}
          cellSelection={false}
        />

        {filteredAndSortedRequests.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>{paymentRequests.length === 0 ? '尚無請款單' : '無符合條件的請款單'}</p>
          </div>
        )}
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
                      onFocus={() => setShowTourDropdown(true)}
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
                                  tourId: tour.id,
                                  orderId: '' // 重置訂單選擇
                                }));
                                setTourSearchValue(`${tour.code} - ${tour.name}`);
                                setOrderSearchValue(''); // 重置訂單搜尋
                                setShowTourDropdown(false);
                              }}
                              className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium">{tour.code} - {tour.name}</div>
                              <div className="text-sm text-morandi-secondary">
                                出發: {new Date(tour.departureDate).toLocaleDateString()}
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
                      placeholder={newRequest.tourId ? "搜尋訂單號或聯絡人..." : "請先選擇旅遊團"}
                      value={orderSearchValue}
                      onChange={(e) => setOrderSearchValue(e.target.value)}
                      onFocus={() => newRequest.tourId && setShowOrderDropdown(true)}
                      onBlur={() => setTimeout(() => setShowOrderDropdown(false), 200)}
                      className="mt-1 bg-background"
                      disabled={!newRequest.tourId}
                    />
                    {showOrderDropdown && newRequest.tourId && (
                      <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                        {filteredOrders.length > 0 ? (
                          filteredOrders.map((order) => (
                            <div
                              key={order.id}
                              onClick={() => {
                                setNewRequest(prev => ({
                                  ...prev,
                                  orderId: order.id
                                }));
                                setOrderSearchValue(`${order.orderNumber} - ${order.contactPerson}`);
                                setShowOrderDropdown(false);
                              }}
                              className="p-3 hover:bg-morandi-container/20 cursor-pointer border-b border-border last:border-b-0"
                            >
                              <div className="font-medium">{order.orderNumber}</div>
                              <div className="text-sm text-morandi-secondary">
                                聯絡人: {order.contactPerson}
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

                  {/* 特殊出帳勾選框 */}
                  <div className="mt-2 mb-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isSpecialBilling"
                      checked={newRequest.isSpecialBilling}
                      onChange={(e) => {
                        setNewRequest(prev => ({
                          ...prev,
                          isSpecialBilling: e.target.checked,
                          requestDate: '' // 清空已選日期
                        }));
                      }}
                      className="rounded border-border"
                    />
                    <label htmlFor="isSpecialBilling" className="text-sm text-morandi-primary cursor-pointer">
                      特殊出帳 (可選擇任何日期)
                    </label>
                  </div>

                  {/* 日期選擇 */}
                  {newRequest.isSpecialBilling ? (
                    // 特殊出帳：可選任何日期
                    <div>
                      <Input
                        type="date"
                        value={newRequest.requestDate}
                        onChange={(e) => setNewRequest(prev => ({ ...prev, requestDate: e.target.value }))}
                        className="bg-morandi-gold/10 border-morandi-gold/50"
                      />
                      <p className="text-xs text-morandi-gold mt-1">⚠️ 特殊出帳：可選擇任何日期</p>
                    </div>
                  ) : (
                    // 一般出帳：只能選週四
                    <div>
                      <Select
                        value={newRequest.requestDate}
                        onValueChange={(value) => setNewRequest(prev => ({ ...prev, requestDate: value }))}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="選擇請款日期 (週四)" />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          {upcomingThursdays.map((thursday) => (
                            <SelectItem key={thursday.value} value={thursday.value}>
                              {thursday.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-morandi-secondary mt-1">💼 一般請款固定每週四</p>
                    </div>
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
                  disabled={!newItem.supplierId || !newItem.description}
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
                  <Select value={newItem.supplierId} onValueChange={(value) => setNewItem(prev => ({ ...prev, supplierId: value }))}>
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
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
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
                    NT$ {(newItem.unitPrice * newItem.quantity).toLocaleString()}
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
                          <div className="font-medium">NT$ {item.unitPrice.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">數量:</span>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="text-xs text-morandi-secondary">小計:</span>
                          <div className="font-semibold text-morandi-gold">NT$ {(item.unitPrice * item.quantity).toLocaleString()}</div>
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
                    <span className="text-xl font-bold text-morandi-gold">NT$ {totalAmount.toLocaleString()}</span>
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
                    tourId: '',
                    orderId: '',
                    requestDate: '',
                    note: '',
                    isSpecialBilling: false,
                    createdBy: '1'
                  });
                  setTourSearchValue('');
                  setOrderSearchValue('');
                }}
              >
                取消
              </Button>
              <Button
                onClick={handleAddRequest}
                disabled={!newRequest.tourId || requestItems.length === 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增請款單 (共 {requestItems.length} 項，NT$ {totalAmount.toLocaleString()})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}