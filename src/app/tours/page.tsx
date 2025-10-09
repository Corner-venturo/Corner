'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SmartDateInput } from '@/components/ui/smart-date-input';
import { useTours } from '@/features/tours/hooks/useTours';
import { tourService } from '@/features/tours/services/tour.service';
import { PageRequest } from '@/core/types/common';
import { Calendar, FileText, MapPin, Calculator, BarChart3, ShoppingCart, Users, FileCheck, AlertCircle, Clipboard, Plus, Package, RefreshCw, FileX, Edit2, UserPlus, Search, Grid3x3, List, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table';
import { useTourStore } from '@/stores/tour-store';
import { useQuoteStore } from '@/stores/quote-store';
import { usePaymentStore } from '@/stores/payment-store';
import { Tour } from '@/stores/types';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useDialog } from '@/hooks/useDialog';
import { TourMembers } from '@/components/tours/tour-members';
import { TourOperations } from '@/components/tours/tour-operations';
import { TourAddOns } from '@/components/tours/tour-add-ons';
import { TourRefunds } from '@/components/tours/tour-refunds';
import { TourPayments } from '@/components/tours/tour-payments';
import { TourCosts } from '@/components/tours/tour-costs';
import { TourTaskAssignment } from '@/components/tours/tour-task-assignment';
import { TourCard } from '@/components/tours/tour-card';


// 使用與詳細模式相同的標籤定義
const tourTabs = [
  { id: 'overview', label: '總覽', icon: BarChart3 },
  { id: 'orders', label: '訂單管理', icon: ShoppingCart },
  { id: 'members', label: '團員名單', icon: Users },
  { id: 'operations', label: '團務', icon: Clipboard },
  { id: 'addons', label: '加購', icon: Package },
  { id: 'refunds', label: '退費', icon: RefreshCw },
  { id: 'payments', label: '收款紀錄', icon: Calculator },
  { id: 'costs', label: '成本支出', icon: AlertCircle },
  { id: 'documents', label: '文件確認', icon: FileCheck },
  { id: 'tasks', label: '指派任務', icon: UserPlus },
];

interface NewTourData {
  name: string;
  location: string;
  departureDate: string;
  returnDate: string;
  price: number;
  status: Tour['status'];
  isSpecial: boolean;
  maxParticipants: number;
  description?: string;
}

export default function ToursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelectedTour, orders, members, addOrder, deleteTour } = useTourStore();
  const { quotes } = useQuoteStore();
  const { dialog, openDialog, closeDialog } = useDialog();

  // 分頁和篩選狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [activeStatusTab, setActiveStatusTab] = useState('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tour: Tour | null }>({ isOpen: false, tour: null });
  const pageSize = 10;

  // 建立 PageRequest 參數
  const pageRequest: PageRequest = {
    page: currentPage,
    pageSize,
    search: '',
    sortBy,
    sortOrder,
  };

  // 使用新的 hook
  const { data: tours, totalCount, loading, error, actions } = useTours(pageRequest);

  // UI 狀態
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // 展開模式分頁觸發狀態 - 對應每個旅遊團的觸發狀態
  const [triggerAddOnAdd, setTriggerAddOnAdd] = useState<Record<string, boolean>>({});
  const [triggerRefundAdd, setTriggerRefundAdd] = useState<Record<string, boolean>>({});
  const [triggerPaymentAdd, setTriggerPaymentAdd] = useState<Record<string, boolean>>({});
  const [triggerCostAdd, setTriggerCostAdd] = useState<Record<string, boolean>>({});

  // 動態欄位狀態 - 記錄每個旅遊團啟用的額外欄位
  const [tourExtraFields, setTourExtraFields] = useState<Record<string, {
    addOns: boolean;
    refunds: boolean;
    customFields: Array<{ id: string; name: string; }>;
  }>>({});

  const [newTour, setNewTour] = useState<NewTourData>({
    name: '',
    location: 'Tokyo',
    departureDate: '',
    returnDate: '',
    price: 0,
    status: '提案',
    isSpecial: false,
    maxParticipants: 20,
    description: '',
  });

  // 新增訂單狀態
  const [newOrder, setNewOrder] = useState({
    contact_person: '',
    salesPerson: '',
    assistant: '',
    memberCount: 1,
    total_amount: 0,
  });

  // 根據狀態標籤和搜尋關鍵字篩選旅遊團
  const filteredTours = tours.filter(tour => {
    // 狀態篩選
    const statusMatch = activeStatusTab === 'all' || tour.status === activeStatusTab;

    // 搜尋篩選
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery ||
      tour.name.toLowerCase().includes(searchLower) ||
      tour.code.toLowerCase().includes(searchLower) ||
      tour.location.toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  // 處理從報價單跳轉來的情況
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote');
    const highlightId = searchParams.get('highlight');
    const departureDate = searchParams.get('departureDate');
    const shouldOpenDialog = searchParams.get('openDialog');

    if (fromQuoteId) {
      // 找到對應的報價單
      const sourceQuote = quotes.find(quote => quote.id === fromQuoteId);
      if (sourceQuote) {
        // 自動填入報價單的資料到新增旅遊團表單
        setNewTour(prev => ({
          ...prev,
          name: sourceQuote.name,
          price: Math.round(sourceQuote.total_cost / sourceQuote.group_size), // 計算單人價格
        }));

        // 自動開啟新增旅遊團對話框
        openDialog('create', null, fromQuoteId);
      }
    }

    // 處理從行事曆跳轉來的情況
    if (departureDate && shouldOpenDialog === 'true') {
      setNewTour(prev => ({
        ...prev,
        departureDate: departureDate
      }));
      openDialog('create');
    }

    // 處理從待辦事項跳轉來的情況
    if (highlightId) {
      // 自動展開指定的旅遊團並切換到任務分頁
      setExpandedRows([highlightId]);
      setActiveTabs(prev => ({
        ...prev,
        [highlightId]: 'tasks'
      }));
    }
  }, [searchParams, quotes, openDialog]);

  const resetForm = useCallback(() => {
    setNewTour({
      name: '',
      location: 'Tokyo',
      departureDate: '',
      returnDate: '',
      price: 0,
      status: '提案',
      isSpecial: false,
      maxParticipants: 20,
      description: '',
    });
    setNewOrder({
      contact_person: '',
      salesPerson: '',
      assistant: '',
      memberCount: 1,
      total_amount: 0,
    });
  }, []);

  const handleAddTour = useCallback(async () => {
    if (!newTour.name.trim() || !newTour.departure_date || !newTour.return_date) {
      return;
    }

    try {
      setSubmitting(true);

      const departureDate = new Date(newTour.departure_date);
      const code = await tourService.generateTourCode(newTour.location, departureDate, newTour.isSpecial);

      // 檢查是否從報價單創建
      const fromQuoteId = searchParams.get('fromQuote');

      const tourData = {
        ...newTour,
        code,
        contractStatus: '未簽署' as const,
        totalRevenue: 0,
        total_cost: 0,
        profit: 0,
        currentParticipants: 0,
        quote_id: fromQuoteId || undefined, // 如果從報價單創建，關聯報價單ID
      };

      const createdTour = await actions.create(tourData);

      // 如果有填寫聯絡人，同時新增訂單
      if (newOrder.contact_person.trim()) {
        const orderNumber = `${code}${String(Date.now()).slice(-3)}`; // 生成訂單編號
        const orderData = {
          orderNumber,
          tour_id: createdTour.id,
          code: code,
          tour_name: newTour.name,
          contact_person: newOrder.contact_person,
          salesPerson: newOrder.sales_person || '',
          assistant: newOrder.assistant || '',
          memberCount: newOrder.member_count,
          paymentStatus: '未收款' as const,
          total_amount: newOrder.total_amount || (newTour.price * newOrder.member_count),
          paidAmount: 0,
          remainingAmount: newOrder.total_amount || (newTour.price * newOrder.member_count),
        };

        addOrder(orderData);
      }

      // 如果是從報價單創建，更新報價單的 tourId
      if (fromQuoteId) {
        const { updateQuote } = useQuoteStore.getState();
        updateQuote(fromQuoteId, { tour_id: createdTour.id });

        // 清除 URL 參數
        router.replace('/tours');
      }

      resetForm();
      closeDialog();
    } catch (err) {
      // 錯誤已經在 hook 中處理了，這裡可以顯示 toast 或其他 UI 反饋
      console.error('Failed to create tour:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newTour, newOrder, actions, addOrder, resetForm, closeDialog, searchParams, router]);

  const toggleRowExpand = useCallback((tour_id: string) => {
    setExpandedRows(prev =>
      prev.includes(tourId)
        ? prev.filter(id => id !== tourId)
        : [...prev, tourId]
    );
    // 設定預設分頁為總覽
    if (!activeTabs[tourId]) {
      setActiveTabs(prev => ({ ...prev, [tourId]: 'overview' }));
    }
  }, [activeTabs]);

  const setActiveTab = useCallback((tour_id: string, tabId: string) => {
    setActiveTabs(prev => ({ ...prev, [tourId]: tabId }));
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const badges: Record<string, string> = {
      '提案': 'bg-[#E8EAF0]/60 text-[#6B7280] border border-[#D1D5DB]/30',
      '進行中': 'bg-[#D4E8DC]/60 text-[#6B8E7F] border border-[#B8D4C5]/30',
      '待結案': 'bg-[#F5E8D0]/60 text-[#9B7E4A] border border-[#E5D4B0]/30',
      '結案': 'bg-[#E5E5E5]/60 text-[#8A8A8A] border border-[#D0D0D0]/30',
      '特殊團': 'bg-[#F0D8D8]/60 text-[#A17676] border border-[#E0C8C8]/30'
    };
    return badges[status] || 'bg-[#E5E5E5]/60 text-[#8A8A8A] border border-[#D0D0D0]/30';
  }, []);

  // 定義 EnhancedTable 欄位
  const columns: TableColumn[] = [
    {
      key: 'code',
      label: '團號',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'name',
      label: '旅遊團名稱',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'departureDate',
      label: '出發日期',
      sortable: true,
      render: (value, tour) => <span className="text-sm text-morandi-primary">{new Date(tour.departure_date).toLocaleDateString()}</span>,
    },
    {
      key: 'returnDate',
      label: '回程日期',
      sortable: true,
      render: (value, tour) => <span className="text-sm text-morandi-primary">{tour.return_date ? new Date(tour.return_date).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'participants',
      label: '人數',
      render: (value, tour) => {
        const tourOrders = orders.filter(order => order.tour_id === tour.id);
        const actualMembers = members.filter(member =>
          tourOrders.some(order => order.id === member.order_id)
        ).length;
        return <span className="text-sm text-morandi-primary">{`${actualMembers}/${tour.max_participants}`}</span>;
      },
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, tour) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          getStatusBadge(tour.status)
        )}>
          {tour.status}
        </span>
      ),
    },
  ];

  const handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  }, []);

  const handlePaginationChange = useCallback((page: number, pageSize: number) => {
    setCurrentPage(page);
  }, []);

  const handleRowClick = useCallback((tour: Tour) => {
    setSelectedTour(tour);
    router.push(`/tours/${tour.id}`);
  }, [router]);

  const handleDeleteTour = useCallback(async () => {
    if (!deleteConfirm.tour) return;

    try {
      await deleteTour(deleteConfirm.tour.id);
      setDeleteConfirm({ isOpen: false, tour: null });
    } catch (err) {
      console.error('刪除旅遊團失敗:', err);
    }
  }, [deleteConfirm.tour, deleteTour]);

  const renderActions = (tour: Tour) => {
    // 檢查是否有該旅遊團的報價單
    const tourQuote = quotes.find(q => q.tour_id === tour.id);
    const hasQuote = !!tourQuote;

    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openDialog('edit', tour);
          }}
          className="h-8 w-8 p-0 text-morandi-gold hover:text-morandi-gold hover:bg-morandi-gold/10 transition-colors"
          title="編輯"
        >
          <Edit2 size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTour(tour);
            if (hasQuote) {
              // 有報價單：前往查看/編輯該報價單
              router.push(`/quotes/${tourQuote.id}`);
            } else {
              // 沒有報價單：前往新增報價單頁面，並帶上 tourId
              router.push(`/quotes/new?tourId=${tour.id}`);
            }
          }}
          className="h-8 w-8 p-0 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 transition-colors"
          title={hasQuote ? '查看報價單' : '新增報價單'}
        >
          <Calculator size={14} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm({ isOpen: true, tour });
          }}
          className="h-8 w-8 p-0 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </Button>
      </div>
    );
  };

  const renderExpanded = (tour: Tour) => (
    <div>
      {/* Tab 導航 - 統一設計：標籤靠左，按鈕靠右 */}
      <div className="flex border-b border-border justify-between items-center">
        {/* 左側：標籤列表 */}
        <div className="flex">
          {tourTabs.map((tab) => {
            const isActive = activeTabs[tour.id] === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tour.id, tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-morandi-primary bg-white border-b-2 border-morandi-gold'
                    : 'text-morandi-secondary hover:text-morandi-primary'
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 右側：分頁專屬按鈕 */}
        <div className="flex items-center gap-2 px-4">

          {activeTabs[tour.id] === 'overview' && (
            <button
              onClick={() => openDialog('edit', tour)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              編輯項目
            </button>
          )}
          {activeTabs[tour.id] === 'orders' && (
            <button
              onClick={() => {
                // 開啟新增訂單對話框的邏輯
                openDialog('new');
              }}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增訂單
            </button>
          )}
          {activeTabs[tour.id] === 'operations' && (
            <TourOperationsAddButton tour={tour} tourExtraFields={tourExtraFields} setTourExtraFields={setTourExtraFields} />
          )}
          {activeTabs[tour.id] === 'addons' && (
            <button
              onClick={() => setTriggerAddOnAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增加購
            </button>
          )}
          {activeTabs[tour.id] === 'refunds' && (
            <button
              onClick={() => setTriggerRefundAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增退費
            </button>
          )}
          {activeTabs[tour.id] === 'payments' && (
            <button
              onClick={() => setTriggerPaymentAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增收款
            </button>
          )}
          {activeTabs[tour.id] === 'costs' && (
            <button
              onClick={() => setTriggerCostAdd(prev => ({ ...prev, [tour.id]: true }))}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
            >
              <Plus size={14} className="mr-1" />
              新增支出
            </button>
          )}
        </div>
      </div>

      {/* Tab 內容 */}
      <div>
        {activeTabs[tour.id] === 'overview' && (
          <TourOverviewTab tour={tour} />
        )}
        {activeTabs[tour.id] === 'orders' && (
          <ExpandableOrderTable
            orders={orders.filter(order => order.tour_id === tour.id)}
            showTourInfo={false}
            tourDepartureDate={tour.departure_date}
          />
        )}
        {activeTabs[tour.id] === 'members' && (
          <TourMembers tour={tour} />
        )}
        {activeTabs[tour.id] === 'operations' && (
          <TourOperations tour={tour} extraFields={tourExtraFields[tour.id]} />
        )}
        {activeTabs[tour.id] === 'addons' && (
          <TourAddOns
            tour={tour}
            triggerAdd={triggerAddOnAdd[tour.id] || false}
            onTriggerAddComplete={() => setTriggerAddOnAdd(prev => ({ ...prev, [tour.id]: false }))}
          />
        )}
        {activeTabs[tour.id] === 'refunds' && (
          <TourRefunds
            tour={tour}
            triggerAdd={triggerRefundAdd[tour.id] || false}
            onTriggerAddComplete={() => setTriggerRefundAdd(prev => ({ ...prev, [tour.id]: false }))}
          />
        )}
        {activeTabs[tour.id] === 'payments' && (
          <TourPayments
            tour={tour}
            triggerAdd={triggerPaymentAdd[tour.id] || false}
            onTriggerAddComplete={() => setTriggerPaymentAdd(prev => ({ ...prev, [tour.id]: false }))}
          />
        )}
        {activeTabs[tour.id] === 'costs' && (
          <TourCosts
            tour={tour}
            triggerAdd={triggerCostAdd[tour.id] || false}
            onTriggerAddComplete={() => setTriggerCostAdd(prev => ({ ...prev, [tour.id]: false }))}
          />
        )}
        {activeTabs[tour.id] === 'documents' && (
          <div className="text-center py-8 text-morandi-secondary">
            <FileCheck size={48} className="mx-auto mb-4 opacity-50" />
            <p>文件確認功能開發中...</p>
          </div>
        )}
        {activeTabs[tour.id] === 'tasks' && (
          <TourTaskAssignment tour={tour} />
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-morandi-secondary">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="旅遊團管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '旅遊團管理', href: '/tours' }
        ]}
        onAdd={() => openDialog('create')}
        addLabel="新增旅遊團"
        tabs={[
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: '提案', label: '提案', icon: FileText },
          { value: '進行中', label: '進行中', icon: Calendar },
          { value: '待結案', label: '待結案', icon: AlertCircle },
          { value: '結案', label: '結案', icon: FileCheck },
        ]}
        activeTab={activeStatusTab}
        onTabChange={(tab) => {
          setActiveStatusTab(tab);
          setCurrentPage(1); // 切換標籤時重置頁碼
        }}
      />

      {/* 旅遊團列表 */}
      <div className="pb-6">
        <EnhancedTable
          columns={columns}
          data={filteredTours}
          loading={loading}
          error={error}
          onSort={handleSortChange}
          expandable={{
            expanded: expandedRows,
            onExpand: toggleRowExpand,
            renderExpanded,
          }}
          actions={renderActions}
          onRowClick={handleRowClick}
          bordered={true}
          emptyState={
            <div className="text-center py-8 text-morandi-secondary">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-morandi-primary mb-2">
                {activeStatusTab === 'all' ? '還沒有任何旅遊團' : `沒有「${activeStatusTab}」狀態的旅遊團`}
              </p>
              <p className="text-sm text-morandi-secondary mb-6">
                {activeStatusTab === 'all' ? '點擊右上角「新增旅遊團」開始建立' : '切換到其他標籤或新增旅遊團'}
              </p>
              <div className="text-sm text-morandi-secondary space-y-1">
                <p>• 旅遊團資訊將包含團號、名稱、目的地、出發日期、人數和狀態</p>
                <p>• 點擊可展開檢視總覽、訂單管理、團員名單、團務、加購、退費等詳細功能</p>
                <p>• 支援按狀態篩選（提案、進行中、待結案、結案）和搜尋功能</p>
              </div>
            </div>
          }
        />
      </div>

      {/* 新增/編輯旅遊團對話框 */}
      <Dialog open={dialog.isOpen} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-6xl w-[90vw] h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {dialog.mode === 'edit' ? '編輯旅遊團' : '新增旅遊團 & 訂單'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex h-full overflow-hidden">
            {/* 左半部 - 新增旅遊團 */}
            <div className="flex-1 pr-6 border-r border-border">
              <div className="h-full overflow-y-auto">
                <h3 className="text-lg font-medium text-morandi-primary mb-4">旅遊團資訊</h3>
                <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">旅遊團名稱</label>
              <Input
                value={newTour.name}
                onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">目的地</label>
              <select
                value={newTour.location}
                onChange={(e) => setNewTour(prev => ({ ...prev, location: e.target.value }))}
                className="mt-1 w-full p-2 border border-border rounded-md bg-background"
              >
                <option value="Tokyo">Tokyo 東京</option>
                <option value="Okinawa">Okinawa 沖繩</option>
                <option value="Osaka">Osaka 大阪</option>
                <option value="Kyoto">Kyoto 京都</option>
                <option value="Hokkaido">Hokkaido 北海道</option>
                <option value="Fukuoka">Fukuoka 福岡</option>
                <option value="Other">其他</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">出發日期</label>
                <SmartDateInput
                  value={newTour.departure_date}
                  onChange={(departureDate) => {
                    setNewTour(prev => {
                      // 如果回程日期早於新的出發日期，自動調整回程日期
                      const newReturnDate = prev.return_date && prev.return_date < departureDate
                        ? departureDate
                        : prev.return_date;

                      return {
                        ...prev,
                        departureDate,
                        returnDate: newReturnDate
                      };
                    });
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">返回日期</label>
                <SmartDateInput
                  value={newTour.return_date}
                  onChange={(returnDate) => {
                    setNewTour(prev => ({ ...prev, returnDate }));
                  }}
                  min={newTour.departure_date || new Date().toISOString().split('T')[0]}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">價格</label>
                <Input
                  type="number"
                  value={newTour.price}
                  onChange={(e) => setNewTour(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">最大人數</label>
                <Input
                  type="number"
                  value={newTour.max_participants}
                  onChange={(e) => setNewTour(prev => ({ ...prev, maxParticipants: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">描述</label>
              <Input
                value={newTour.description || ''}
                onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1"
              />
            </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isSpecial"
                      checked={newTour.isSpecial}
                      onChange={(e) => setNewTour(prev => ({ ...prev, isSpecial: e.target.checked }))}
                      className="rounded"
                    />
                    <label htmlFor="isSpecial" className="text-sm text-morandi-primary">特殊團</label>
                  </div>
                </div>
              </div>
            </div>

            {/* 右半部 - 新增訂單 */}
            <div className="flex-1 pl-6">
              <div className="h-full overflow-y-auto">
                <h3 className="text-lg font-medium text-morandi-primary mb-4">同時新增訂單（選填）</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
                    <Input
                      value={newOrder.contact_person}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, contact_person: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">業務人員</label>
                    <Input
                      value={newOrder.sales_person}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, salesPerson: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">助理</label>
                    <Input
                      value={newOrder.assistant}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, assistant: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">團員人數</label>
                    <Input
                      type="number"
                      value={newOrder.member_count}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, memberCount: Number(e.target.value) }))}
                      className="mt-1"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-morandi-primary">訂單金額</label>
                    <Input
                      type="number"
                      value={newOrder.total_amount}
                      onChange={(e) => setNewOrder(prev => ({ ...prev, total_amount: Number(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>

                  <div className="bg-morandi-container/20 p-3 rounded-lg">
                    <p className="text-xs text-morandi-secondary">
                      提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 底部按鈕 */}
          <div className="flex justify-end space-x-2 pt-6 border-t border-border mt-6">
            <Button
              variant="outline"
              onClick={() => closeDialog()}
              disabled={submitting}
            >
              取消
            </Button>
            <Button
              onClick={handleAddTour}
              disabled={submitting || !newTour.name.trim() || !newTour.departure_date || !newTour.return_date}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              {submitting ? '建立中...' : (newOrder.contact_person ? '新增旅遊團 & 訂單' : '新增旅遊團')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteConfirm.isOpen} onOpenChange={(open) => !open && setDeleteConfirm({ isOpen: false, tour: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-morandi-red">
              <AlertCircle size={20} />
              確認刪除旅遊團
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-morandi-primary">
              確定要刪除旅遊團 <span className="font-semibold">「{deleteConfirm.tour?.name}」</span> 嗎？
            </p>
            <div className="bg-morandi-red/5 border border-morandi-red/20 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-morandi-red">此操作會影響：</p>
              <ul className="text-sm text-morandi-secondary space-y-1 ml-4">
                <li>• 相關訂單和團員資料</li>
                <li>• 收付款記錄</li>
                <li>• 報價單</li>
              </ul>
              <p className="text-xs text-morandi-red font-medium mt-2">⚠️ 此操作無法復原！</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm({ isOpen: false, tour: null })}
            >
              取消
            </Button>
            <Button
              onClick={handleDeleteTour}
              className="bg-morandi-red hover:bg-morandi-red/90 text-white"
            >
              確認刪除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// 總覽分頁組件
function TourOverviewTab({ tour }: { tour: Tour }) {
  const { quotes } = useQuoteStore();
  const { orders, members } = useTourStore();

  // 找到該旅遊團的報價單（通常取最新的或最終版本）
  const tourQuote = quotes.find(quote => quote.tour_id === tour.id && quote.status === '最終版本') ||
                   quotes.find(quote => quote.tour_id === tour.id);

  // 計算該旅遊團的訂單資訊
  const tourOrders = orders.filter(order => order.tour_id === tour.id);
  const totalPaidAmount = tourOrders.reduce((sum, order) => sum + order.paid_amount, 0);

  // 財務計算
  const quotePrice = tourQuote?.total_cost || tour.price; // 報價單價格
  const expectedRevenue = quotePrice * tour.currentParticipants; // 應收帳款 = 報價單價格 × 團體人數
  const actualRevenue = totalPaidAmount; // 實收帳款
  const grossProfit = actualRevenue - tour.total_cost; // 毛利 = 實收 - 總成本
  const netProfit = grossProfit - (grossProfit * 0.05); // 淨利潤（假設5%稅費，可調整）

  // 準備預算vs實際支出的對比資料
  const { paymentRequests } = usePaymentStore();

  // 獲取該旅遊團的請款單
  const tourPaymentRequests = paymentRequests.filter(req => req.tour_id === tour.id);

  // 報價單中的類別預算
  const quoteBudget = tourQuote?.categories || [];

  // 計算各類別的實際支出 (從請款單統計)
  const actualExpenses = quoteBudget.map(category => {
    const categoryTotal = tourPaymentRequests.reduce((sum, request) => {
      const categoryItems = request.items?.filter(item => item.category === category.name) || [];
      return sum + categoryItems.reduce((itemSum, item) => itemSum + (item.unit_price * item.quantity), 0);
    }, 0);

    return {
      name: category.name,
      budgetPerPerson: category.total || 0, // 報價單中的單人預算
      budgetTotal: (category.total || 0) * tour.currentParticipants, // 預算總額 = 單人預算 × 人數
      actualTotal: categoryTotal, // 實際支出
      variance: categoryTotal - ((category.total || 0) * tour.currentParticipants) // 差額 (正數=超支，負數=節省)
    };
  });

  return (
    <div className="px-6 py-4 space-y-8">
      {/* 上半部：三欄式財務總覽 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本資訊 */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">基本資訊</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">團號:</span>
              <span className="text-morandi-primary font-medium">{tour.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">目的地:</span>
              <span className="text-morandi-primary">{tour.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">出發日期:</span>
              <span className="text-morandi-primary">{new Date(tour.departure_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">返回日期:</span>
              <span className="text-morandi-primary">{new Date(tour.return_date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">參與人數:</span>
              <span className="text-morandi-primary font-medium">{(() => {
                const tourOrders = orders.filter(order => order.tour_id === tour.id);
                const actualMembers = members.filter(member =>
                  tourOrders.some(order => order.id === member.order_id)
                ).length;
                return actualMembers;
              })()}/{tour.max_participants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">建立時間:</span>
              <span className="text-morandi-secondary text-sm">{new Date(tour.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* 報價與收入 */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">報價與收入</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">報價單價格:</span>
              <span className="text-morandi-primary font-medium">NT$ {quotePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">應收帳款:</span>
              <span className="text-morandi-blue font-medium">NT$ {expectedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">實收帳款:</span>
              <span className="text-morandi-green font-semibold">NT$ {actualRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-morandi-secondary">收款率:</span>
              <span className={cn(
                "font-medium",
                expectedRevenue > 0 ?
                  (actualRevenue / expectedRevenue >= 0.8 ? "text-morandi-green" : "text-morandi-gold") :
                  "text-morandi-secondary"
              )}>
                {expectedRevenue > 0 ? `${((actualRevenue / expectedRevenue) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">待收餘額:</span>
              <span className={cn(
                "font-medium",
                (expectedRevenue - actualRevenue) > 0 ? "text-morandi-red" : "text-morandi-green"
              )}>
                NT$ {(expectedRevenue - actualRevenue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* 成本與利潤 */}
        <div className="space-y-3">
          <div className="text-lg font-medium text-morandi-primary border-b border-border pb-2">成本與利潤</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-morandi-secondary">總成本:</span>
              <span className="text-morandi-red font-medium">NT$ {tour.total_cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="text-morandi-secondary">毛利潤:</span>
              <span className={cn(
                "font-semibold",
                grossProfit >= 0 ? "text-morandi-green" : "text-morandi-red"
              )}>
                NT$ {grossProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">淨利潤:</span>
              <span className={cn(
                "font-bold text-lg",
                netProfit >= 0 ? "text-morandi-green" : "text-morandi-red"
              )}>
                NT$ {netProfit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-morandi-secondary">利潤率:</span>
              <span className={cn(
                "font-medium",
                netProfit >= 0 ? "text-morandi-green" : "text-morandi-red"
              )}>
                {actualRevenue > 0 ? `${((netProfit / actualRevenue) * 100).toFixed(1)}%` : '0%'}
              </span>
            </div>
          </div>

          {/* 狀態指標 */}
          <div className="mt-4 p-3 rounded-lg border border-border bg-morandi-container/10">
            <div className="text-sm font-medium text-morandi-secondary mb-2">財務狀況</div>
            <div className="flex items-center space-x-2">
              {netProfit >= 0 ? (
                <div className="w-3 h-3 rounded-full bg-morandi-green"></div>
              ) : (
                <div className="w-3 h-3 rounded-full bg-morandi-red"></div>
              )}
              <span className={cn(
                "text-sm font-medium",
                netProfit >= 0 ? "text-morandi-green" : "text-morandi-red"
              )}>
                {netProfit >= 0 ? "盈利中" : "虧損中"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 下半部：預算vs實際支出明細表 */}
      <div className="border border-border rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-morandi-primary">預算 vs 實際支出明細</h3>
          <div className="text-sm text-morandi-secondary">
            基準：{tour.currentParticipants}人團體
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-morandi-container/20 border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-morandi-primary">類別</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-morandi-primary">單人預算</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-morandi-primary">預算總額</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-morandi-primary">實際支出</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-morandi-primary">差額</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-morandi-primary">差額率</th>
              </tr>
            </thead>
            <tbody>
              {actualExpenses.map((expense, index) => {
                const varianceRate = expense.budgetTotal > 0 ? (expense.variance / expense.budgetTotal * 100) : 0;
                return (
                  <tr key={expense.name} className={cn(
                    "border-b border-border hover:bg-morandi-container/10",
                    index === actualExpenses.length - 1 && "border-b-0"
                  )}>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-morandi-primary">{expense.name}</span>
                        {Math.abs(varianceRate) > 20 && (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            varianceRate > 20 ? "bg-morandi-red/10 text-morandi-red" : "bg-morandi-green/10 text-morandi-green"
                          )}>
                            {varianceRate > 20 ? "超支" : "節省"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-morandi-secondary">
                      NT$ {expense.budgetPerPerson.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-morandi-primary font-medium">
                      NT$ {expense.budgetTotal.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "font-medium",
                        expense.actualTotal > expense.budgetTotal ? "text-morandi-red" : "text-morandi-primary"
                      )}>
                        NT$ {expense.actualTotal.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "font-semibold",
                        expense.variance > 0 ? "text-morandi-red" :
                        expense.variance < 0 ? "text-morandi-green" : "text-morandi-secondary"
                      )}>
                        {expense.variance > 0 ? "+" : ""}NT$ {expense.variance.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "font-medium",
                        Math.abs(varianceRate) > 20 ? (varianceRate > 0 ? "text-morandi-red" : "text-morandi-green") : "text-morandi-secondary"
                      )}>
                        {varianceRate > 0 ? "+" : ""}{varianceRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* 總計行 */}
              <tr className="bg-morandi-container/10 font-semibold">
                <td className="py-4 px-4 text-morandi-primary">總計</td>
                <td className="py-4 px-4 text-right text-morandi-secondary">
                  NT$ {(actualExpenses.reduce((sum, exp) => sum + exp.budgetPerPerson, 0)).toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-morandi-primary">
                  NT$ {(actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0)).toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right text-morandi-primary">
                  NT$ {(actualExpenses.reduce((sum, exp) => sum + exp.actualTotal, 0)).toLocaleString()}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={cn(
                    "font-bold",
                    actualExpenses.reduce((sum, exp) => sum + exp.variance, 0) > 0 ? "text-morandi-red" : "text-morandi-green"
                  )}>
                    {actualExpenses.reduce((sum, exp) => sum + exp.variance, 0) > 0 ? "+" : ""}
                    NT$ {(actualExpenses.reduce((sum, exp) => sum + exp.variance, 0)).toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-morandi-primary font-bold">
                    {actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0) > 0 ?
                      `${((actualExpenses.reduce((sum, exp) => sum + exp.variance, 0) / actualExpenses.reduce((sum, exp) => sum + exp.budgetTotal, 0)) * 100).toFixed(1)}%` :
                      '0%'
                    }
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 說明 */}
        <div className="mt-4 p-3 bg-morandi-container/5 rounded-lg text-sm text-morandi-secondary">
          <div className="flex items-center space-x-4">
            <span>💡 <strong>說明：</strong></span>
            <span>綠色數字表示節省預算</span>
            <span>紅色數字表示超出預算</span>
            <span>差額率超過20%會特別標示</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 團務操作新增按鈕組件
function TourOperationsAddButton({ tour, tourExtraFields, setTourExtraFields }: {
  tour: Tour;
  tourExtraFields: Record<string, any>;
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}) {
  const { orders, members } = useTourStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 獲取屬於這個旅遊團的所有訂單
  const tourOrders = orders.filter(order => order.tour_id === tour.id);

  // 獲取團員數據
  const allTourMembers = members.filter(member =>
    tourOrders.some(order => order.id === member.order_id)
  );

  // 計算已分房人數
  const assignedMembers = allTourMembers.filter(member => member.assignedRoom).length;

  return (
    <>
      {/* 已分房統計 */}
      <span className="px-2 py-1 bg-morandi-green/20 text-morandi-green rounded text-xs">
        已分房: {assignedMembers}人
      </span>

      {/* 團務新增按鈕 */}
      <button
        onClick={() => setIsDialogOpen(true)}
        className="bg-morandi-gold hover:bg-morandi-gold-hover text-white px-3 py-1.5 rounded text-sm font-medium flex items-center transition-colors"
        title="新增項目"
      >
        <Plus size={14} className="mr-1" />
        新增欄位
      </button>

      {/* 選擇視窗 */}
      <TourOperationsAddDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        tour={tour}
        tourExtraFields={tourExtraFields}
        setTourExtraFields={setTourExtraFields}
      />
    </>
  );
}

// 團務操作新增對話框組件
function TourOperationsAddDialog({ isOpen, onClose, tour, tourExtraFields, setTourExtraFields }: {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  tourExtraFields: Record<string, any>;
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}) {
  const handleOptionSelect = useCallback((option: string) => {
    const tourId = tour.id;

    // 初始化該旅遊團的欄位狀態（如果還沒有）
    if (!tourExtraFields[tourId]) {
      setTourExtraFields(prev => ({
        ...prev,
        [tourId]: {
          addOns: false,
          refunds: false,
          customFields: []
        }
      }));
    }

    switch (option) {
      case 'addon':
        // 啟用加購項目欄位
        setTourExtraFields(prev => ({
          ...prev,
          [tourId]: {
            ...prev[tourId],
            addOns: true
          }
        }));
        break;

      case 'refund':
        // 啟用退費項目欄位
        setTourExtraFields(prev => ({
          ...prev,
          [tourId]: {
            ...prev[tourId],
            refunds: true
          }
        }));
        break;

      case 'blank':
        // 新增自定義空白欄位
        const fieldName = prompt('請輸入欄位名稱:');
        if (fieldName && fieldName.trim()) {
          const fieldId = Date.now().toString();
          setTourExtraFields(prev => ({
            ...prev,
            [tourId]: {
              ...prev[tourId],
              customFields: [
                ...(prev[tourId]?.customFields || []),
                { id: fieldId, name: fieldName.trim() }
              ]
            }
          }));
        }
        break;
    }

    onClose();
  }, [tour.id, tourExtraFields, setTourExtraFields, onClose]);

  const options = [
    {
      id: 'blank',
      label: '空白欄位',
      description: '新增自定義空白項目',
      icon: FileText,
      color: 'text-morandi-secondary',
      bgColor: 'hover:bg-morandi-container/30'
    },
    {
      id: 'addon',
      label: '加購項目',
      description: '新增額外購買項目',
      icon: Package,
      color: 'text-morandi-blue',
      bgColor: 'hover:bg-morandi-blue/10'
    },
    {
      id: 'refund',
      label: '退費項目',
      description: '新增退款相關項目',
      icon: RefreshCw,
      color: 'text-morandi-red',
      bgColor: 'hover:bg-morandi-red/10'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增項目</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-sm text-morandi-secondary mb-4">
            為旅遊團「{tour.name}」選擇要新增的項目類型：
          </div>

          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={cn(
                  'w-full flex items-center space-x-4 p-4 rounded-lg border border-border transition-colors text-left',
                  option.bgColor
                )}
              >
                <div className={cn('w-10 h-10 rounded-full bg-morandi-container/20 flex items-center justify-center', option.color)}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-morandi-primary">{option.label}</div>
                  <div className="text-sm text-morandi-secondary">{option.description}</div>
                </div>
                <div className="text-morandi-secondary">
                  <FileText size={16} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}