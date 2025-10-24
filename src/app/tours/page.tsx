'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SmartDateInput } from '@/components/ui/smart-date-input';
import { useTours } from '@/features/tours/hooks/useTours-advanced';
import { tourService } from '@/features/tours/services/tour.service';
import { PageRequest } from '@/core/types/common';
import { Calendar, FileText, MapPin, Calculator, BarChart3, ShoppingCart, Users, FileCheck, AlertCircle, Clipboard, Plus, Package, RefreshCw, FileX, Edit2, UserPlus, Search, Grid3x3, List, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { ExpandableOrderTable } from '@/components/orders/expandable-order-table';
import { AddOrderForm, type OrderFormData } from '@/components/orders/add-order-form';
import { useTourStore, useOrderStore, useMemberStore, useEmployeeStore, useRegionStore } from '@/stores';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { Combobox } from '@/components/ui/combobox';
// TODO: usePaymentStore deprecated - import { usePaymentStore } from '@/stores';
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
  countryCode: string;       // 國家代碼 (如: JPN, THI)
  cityCode: string;          // 城市代碼 (如: TYO, BKK)
  customCountry?: string;    // 自訂國家名稱
  customLocation?: string;   // 自訂城市名稱
  customCityCode?: string;   // 自訂城市代號
  departure_date: string;
  return_date: string;
  price: number;
  status: Tour['status'];
  isSpecial: boolean;
  max_participants: number;
  description?: string;
}

export default function ToursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tourStore = useTourStore();
  const orderStore = useOrderStore();
  const { items: orders } = orderStore;
  const addOrder = orderStore.create;
  const { items: members } = useMemberStore();
  const employeeStore = useEmployeeStore();
  const { items: employees } = employeeStore;
  const regionStore = useRegionStore();
  const { items: regions } = regionStore;
  const { quotes, updateQuote } = useQuotes();
  const { dialog, openDialog, closeDialog } = useDialog();

  // 懶載入：打開新增對話框時才載入地區和員工資料
  const handleOpenCreateDialog = useCallback(async (tour: any = null, fromQuoteId?: string) => {
    // 只在資料為空時才載入（避免重複）
    if (regions.length === 0) {
      await regionStore.fetchAll();
    }
    if (employees.length === 0) {
      await employeeStore.fetchAll();
    }
    openDialog('create', tour, fromQuoteId);
  }, [regions.length, employees.length, regionStore, employeeStore, openDialog]);

  // 選中的旅遊團
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);

  // 分頁和篩選狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
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
  const [formError, setFormError] = useState<string | null>(null);

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

  // 從 regions 取得國家列表
  const activeCountries = React.useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // 根據國家代碼取得城市列表
  const getCitiesByCountryCode = React.useCallback((countryCode: string) => {
    return regions
      .filter(r => r.type === 'city' && r.country_code === countryCode && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  const [newTour, setNewTour] = useState<NewTourData>({
    name: '',
    countryCode: '',
    cityCode: '',
    departure_date: '',
    return_date: '',
    price: 0,
    status: 'draft',
    isSpecial: false,
    max_participants: 20,
    description: '',
  });

  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // 初始化預設國家和城市
  React.useEffect(() => {
    if (activeCountries.length > 0 && !newTour.countryCode) {
      const defaultCountry = activeCountries[0];
      const defaultCities = getCitiesByCountryCode(defaultCountry.code);
      const defaultCity = defaultCities[0];

      setNewTour(prev => ({
        ...prev,
        countryCode: defaultCountry.code,
        cityCode: defaultCity?.code || '',
      }));
      setAvailableCities(defaultCities);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 新增訂單狀態（使用 OrderFormData 類型）
  const [newOrder, setNewOrder] = useState<Partial<OrderFormData>>({
    contact_person: '',
    sales_person: '',
    assistant: '',
    member_count: 1,
    total_amount: 0,
  });

  // 根據狀態標籤和搜尋關鍵字篩選旅遊團
  const filteredTours = (tours || []).filter(tour => {
    // 狀態篩選
    const statusMatch = activeStatusTab === 'all' || tour.status === activeStatusTab;

    // 搜尋篩選 - 搜尋所有文字欄位
    const searchLower = searchQuery.toLowerCase();
    const searchMatch = !searchQuery ||
      tour.name.toLowerCase().includes(searchLower) ||
      tour.code.toLowerCase().includes(searchLower) ||
      tour.location.toLowerCase().includes(searchLower) ||
      tour.status.toLowerCase().includes(searchLower) ||
      tour.description?.toLowerCase().includes(searchLower);

    return statusMatch && searchMatch;
  });

  // 處理編輯模式：當 dialog 開啟且為編輯模式時，載入旅遊團資料
  useEffect(() => {
    if (dialog.type === 'edit' && dialog.data) {
      const tour = dialog.data as Tour;
      console.log('🔧 編輯模式：載入旅遊團資料', {
        tourName: tour.name,
        location: tour.location
      });

      // 從 location 反查國家和城市代碼
      let countryCode = '';
      let cityCode = '';

      // 嘗試從 destinations 中找到匹配的城市
      for (const country of activeCountries) {
        const cities = getCitiesByCountryCode(country.code);
        const matchedCity = cities.find(city => city.name === tour.location);
        if (matchedCity) {
          countryCode = country.code;
          cityCode = matchedCity.code;
          setAvailableCities(cities);
          console.log('✅ 找到匹配的城市:', {
            country: country.name,
            city: matchedCity.name,
            countryCode,
            cityCode
          });
          break;
        }
      }

      // 如果找不到，設為自訂
      if (!countryCode) {
        countryCode = '__custom__';
        cityCode = '__custom__';
        console.log('⚠️ 找不到匹配的城市，設為自訂:', tour.location);
      }

      setNewTour({
        name: tour.name,
        countryCode,
        cityCode,
        customLocation: countryCode === '__custom__' ? tour.location : undefined,
        departure_date: tour.departure_date,
        return_date: tour.return_date,
        price: tour.price,
        status: tour.status,
        isSpecial: tour.status === 'special',
        max_participants: tour.max_participants || 20,
        description: tour.description || '',
      });

      console.log('📝 設定表單資料:', {
        countryCode,
        cityCode,
        customLocation: countryCode === '__custom__' ? tour.location : undefined
      });
    }
  }, [dialog.type, dialog.data, activeCountries, getCitiesByCountryCode]);

  // 處理從報價單跳轉來的情況
  useEffect(() => {
    const fromQuoteId = searchParams.get('fromQuote');
    const highlightId = searchParams.get('highlight');
    const departure_date = searchParams.get('departure_date');
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
        handleOpenCreateDialog(null, fromQuoteId);
      }
    }

    // 處理從行事曆跳轉來的情況
    if (departure_date && shouldOpenDialog === 'true') {
      setNewTour(prev => ({
        ...prev,
        departure_date: departure_date
      }));
      handleOpenCreateDialog();
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
  }, [searchParams, quotes, handleOpenCreateDialog]);

  const resetForm = useCallback(() => {
    const defaultCountry = activeCountries[0];
    const defaultCities = defaultCountry ? getCitiesByCountryCode(defaultCountry.code) : [];
    const defaultCity = defaultCities[0];

    setNewTour({
      name: '',
      countryCode: defaultCountry?.code || '',
      cityCode: defaultCity?.code || '',
      departure_date: '',
      return_date: '',
      price: 0,
      status: 'draft',
      isSpecial: false,
      max_participants: 20,
      description: '',
    });
    setAvailableCities(defaultCities);
    setNewOrder({
      contact_person: '',
      sales_person: '',
      assistant: '',
      member_count: 1,
      total_amount: 0,
    });
    setFormError(null); // 清除表單錯誤
  }, [activeCountries, getCitiesByCountryCode]);

  const handleAddTour = useCallback(async () => {
    if (!newTour.name.trim() || !newTour.departure_date || !newTour.return_date) {
      return;
    }

    // 檢查自訂目的地
    if (newTour.countryCode === '__custom__') {
      if (!newTour.customCountry?.trim()) {
        alert('請填寫國家名稱');
        return;
      }
      if (!newTour.customLocation?.trim()) {
        alert('請填寫城市名稱');
        return;
      }
      if (!newTour.customCityCode?.trim()) {
        alert('請填寫城市代號');
        return;
      }
      if (newTour.customCityCode.length !== 3) {
        alert('城市代號必須是 3 碼');
        return;
      }
    }

    try {
      setSubmitting(true);
      setFormError(null); // 清除之前的錯誤

      const departure_date = new Date(newTour.departure_date);

      // 決定要使用的城市代號和名稱
      const cityCode = newTour.countryCode === '__custom__'
        ? newTour.customCityCode!
        : newTour.cityCode;
      const cityName = newTour.countryCode === '__custom__'
        ? newTour.customLocation!
        : availableCities.find(c => c.code === newTour.cityCode)?.name || newTour.cityCode;

      // 編輯模式：更新現有旅遊團
      if (dialog.type === 'edit' && dialog.data) {
        const existingTour = dialog.data as Tour;

        const tourData = {
          name: newTour.name,
          location: cityName,
          departure_date: newTour.departure_date,
          return_date: newTour.return_date,
          status: newTour.status,
          price: newTour.price,
          max_participants: newTour.max_participants,
          description: newTour.description,
        };

        await actions.update(existingTour.id, tourData);
        resetForm();
        closeDialog();
        return;
      }

      // 新增模式：創建新旅遊團
      const code = await tourService.generateTourCode(cityCode, departure_date, newTour.isSpecial);

      // 檢查是否從報價單創建
      const fromQuoteId = searchParams.get('fromQuote');

      // 🔧 只取 Tour 介面需要的欄位，避免傳入 cityCode 等額外欄位
      const tourData = {
        name: newTour.name,
        location: cityName,  // 存城市名稱
        departure_date: newTour.departure_date,
        return_date: newTour.return_date,
        status: newTour.status,
        price: newTour.price,
        max_participants: newTour.max_participants,
        code,
        contract_status: 'pending' as const,
        total_revenue: 0,
        total_cost: 0,
        profit: 0,
        current_participants: 0,
        quote_id: fromQuoteId || undefined, // 如果從報價單創建，關聯報價單ID
      };

      const createdTour = await actions.create(tourData);

      // 如果有填寫聯絡人，同時新增訂單
      if (newOrder.contact_person?.trim()) {
        const order_number = `${code}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`; // 生成訂單編號（使用隨機數而非時間戳記）
        const memberCount = newOrder.member_count || 1;
        const totalAmount = newOrder.total_amount || (newTour.price * memberCount);
        const orderData = {
          order_number,
          tour_id: createdTour.id,
          code: code,
          tour_name: newTour.name,
          contact_person: newOrder.contact_person,
          sales_person: newOrder.sales_person || '',
          assistant: newOrder.assistant || '',
          member_count: memberCount,
          payment_status: 'unpaid' as const,
          total_amount: totalAmount,
          paid_amount: 0,
          remaining_amount: totalAmount,
        };

        addOrder(orderData);
      }

      // 如果是從報價單創建，更新報價單的 tourId
      if (fromQuoteId) {
        updateQuote(fromQuoteId, { tour_id: createdTour.id });

        // 清除 URL 參數
        router.replace('/tours');
      }

      resetForm();
      closeDialog();
    } catch (err) {
      // 顯示錯誤訊息在表單內
      const errorMessage = err instanceof Error ? err.message : dialog.type === 'edit' ? '更新旅遊團失敗' : '建立旅遊團失敗';
      setFormError(errorMessage);
      logger.error('Failed to create/update tour:', err);
    } finally {
      setSubmitting(false);
    }
  }, [newTour, newOrder, availableCities, actions, addOrder, resetForm, closeDialog, searchParams, router, updateQuote, dialog.type, dialog.data]);

  const toggleRowExpand = useCallback((tour_id: string) => {
    setExpandedRows(prev =>
      prev.includes(tour_id)
        ? prev.filter(id => id !== tour_id)
        : [...prev, tour_id]
    );
    // 設定預設分頁為總覽
    if (!activeTabs[tour_id]) {
      setActiveTabs(prev => ({ ...prev, [tour_id]: 'overview' }));
    }
  }, [activeTabs]);

  const setActiveTab = useCallback((tour_id: string, tabId: string) => {
    setActiveTabs(prev => ({ ...prev, [tour_id]: tabId }));
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors: Record<string, string> = {
      '提案': 'text-[#6B7280]',
      '進行中': 'text-[#6B8E7F]',
      '待結案': 'text-[#9B7E4A]',
      '結案': 'text-[#8A8A8A]',
      '特殊團': 'text-[#A17676]'
    };
    return colors[status] || 'text-morandi-secondary';
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
      key: 'departure_date',
      label: '出發日期',
      sortable: true,
      render: (value, tour) => {
        if (!tour.departure_date) return <span className="text-sm text-morandi-red">未設定</span>;
        const date = new Date(tour.departure_date);
        return <span className="text-sm text-morandi-primary">{isNaN(date.getTime()) ? '無效日期' : date.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'return_date',
      label: '回程日期',
      sortable: true,
      render: (value, tour) => {
        if (!tour.return_date) return <span className="text-sm text-morandi-secondary">-</span>;
        const date = new Date(tour.return_date);
        return <span className="text-sm text-morandi-primary">{isNaN(date.getTime()) ? '無效日期' : date.toLocaleDateString()}</span>;
      },
    },
    {
      key: 'participants',
      label: '人數',
      render: (value, tour) => {
        const tourOrders = orders.filter((order) => order.tour_id === tour.id);
        const actualMembers = members.filter((member) =>
          tourOrders.some((order) => order.id === member.order_id)
        ).length;
        return <span className="text-sm text-morandi-primary">{actualMembers}</span>;
      },
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, tour) => (
        <span className={cn(
          'text-sm font-medium',
          getStatusColor(tour.status)
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
      await actions.delete(deleteConfirm.tour.id);
      setDeleteConfirm({ isOpen: false, tour: null });
    } catch (err) {
      logger.error('刪除旅遊團失敗:', err);
    }
  }, [deleteConfirm.tour, actions]);

  const handleArchiveTour = useCallback(async (tour: Tour) => {
    try {
      await actions.update(tour.id, { archived: !tour.archived });
      logger.info(tour.archived ? '已解除封存旅遊團' : '已封存旅遊團');
    } catch (err) {
      logger.error('封存/解封旅遊團失敗:', err);
    }
  }, [actions]);

  const renderActions = (tour: Tour) => {
    // 檢查是否有該旅遊團的報價單
    const tourQuote = quotes.find(q => q.tour_id === tour.id);
    const hasQuote = !!tourQuote;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            openDialog('edit', tour);
          }}
          className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
          title="編輯"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTour(tour);
            if (hasQuote) {
              // 有報價單：前往查看/編輯該報價單
              router.push(`/quotes/${tourQuote.id}`);
            } else {
              // 沒有報價單：前往報價單列表頁，並帶上 tour_id 以開啟新增對話框
              router.push(`/quotes?tour_id=${tour.id}`);
            }
          }}
          className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
          title={hasQuote ? '查看報價單' : '新增報價單'}
        >
          <Calculator size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // 跳轉到行程表編輯頁面，帶入旅遊團 ID
            router.push(`/itinerary/${tour.id}`);
          }}
          className="p-1 text-morandi-primary hover:bg-morandi-primary/10 rounded transition-colors"
          title="編輯行程表"
        >
          <FileText size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleArchiveTour(tour);
          }}
          className={cn(
            "p-1 rounded transition-colors",
            tour.archived
              ? "text-morandi-gold/60 hover:text-morandi-gold hover:bg-morandi-gold/10"
              : "text-morandi-secondary/60 hover:text-morandi-secondary hover:bg-morandi-container"
          )}
          title={tour.archived ? "解除封存" : "封存"}
        >
          {tour.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirm({ isOpen: true, tour });
          }}
          className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </button>
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
            const is_active = activeTabs[tour.id] === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tour.id, tab.id)}
                className={cn(
                  'flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors',
                  is_active
                    ? 'text-morandi-primary bg-white border-b-2 border-morandi-gold/20'
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
              <Edit2 size={14} className="mr-1" />
              編輯
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
            orders={orders.filter((order) => order.tour_id === tour.id)}
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
            {...{
              tour,
              triggerAdd: triggerCostAdd[tour.id] || false,
              onTriggerAddComplete: () => setTriggerCostAdd(prev => ({ ...prev, [tour.id]: false }))
            } as unknown}
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
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        {...{
          title: "旅遊團管理",
          icon: MapPin,
          breadcrumb: [
            { label: '首頁', href: '/' },
            { label: '旅遊團管理', href: '/tours' }
          ],
          showSearch: true,
          searchTerm: searchQuery,
          onSearchChange: setSearchQuery,
          searchPlaceholder: "搜尋旅遊團...",
          onAdd: handleOpenCreateDialog,
          addLabel: "新增旅遊團",
          tabs: [
          { value: 'all', label: '全部', icon: BarChart3 },
          { value: '提案', label: '提案', icon: FileText },
          { value: '進行中', label: '進行中', icon: Calendar },
          { value: '待結案', label: '待結案', icon: AlertCircle },
          { value: '結案', label: '結案', icon: FileCheck },
        ],
          activeTab: activeStatusTab,
          onTabChange: (tab: string) => {
            setActiveStatusTab(tab);
            setCurrentPage(1); // 切換標籤時重置頁碼
          }
        } as unknown}
      />

      {/* 旅遊團列表 */}
      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          columns={columns}
          data={filteredTours}
          loading={loading}
          onSort={handleSortChange}
          expandable={{
            expanded: expandedRows,
            onExpand: toggleRowExpand,
            renderExpanded,
          }}
          actions={renderActions}
          onRowClick={handleRowClick}
          bordered={true}
        />
      </div>

      {/* 新增/編輯旅遊團對話框 */}
      <Dialog open={dialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          // 關閉對話框時重置表單
          resetForm();
          closeDialog();
        }
      }}>
        <DialogContent className="max-w-6xl w-[90vw] h-[80vh] overflow-hidden" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {dialog.type === 'edit' ? '編輯旅遊團' : '新增旅遊團 & 訂單'}
            </DialogTitle>
          </DialogHeader>

          {/* 錯誤訊息 */}
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="text-sm">{formError}</div>
              </div>
            </div>
          )}

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

                  {/* 目的地選擇 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">國家/地區</label>
                      <select
                        value={newTour.countryCode}
                        onChange={(e) => {
                          const countryCode = e.target.value;
                          const cities = countryCode === '__custom__' ? [] : getCitiesByCountryCode(countryCode);
                          setAvailableCities(cities);
                          setNewTour(prev => ({
                            ...prev,
                            countryCode,
                            cityCode: countryCode === '__custom__' ? '__custom__' : cities[0]?.code || '',
                          }));
                        }}
                        className="mt-1 w-full p-2 border border-border rounded-md bg-background"
                      >
                        {activeCountries.map((country) => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                        <option value="__custom__">+ 新增其他目的地</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-morandi-primary">城市</label>
                      {newTour.countryCode === '__custom__' ? (
                        <Input
                          value={newTour.customLocation || ''}
                          onChange={(e) => setNewTour(prev => ({ ...prev, customLocation: e.target.value }))}
                          placeholder="輸入城市名稱 (如：曼谷)"
                          className="mt-1"
                        />
                      ) : (
                        <select
                          value={newTour.cityCode}
                          onChange={(e) => setNewTour(prev => ({ ...prev, cityCode: e.target.value }))}
                          className="mt-1 w-full p-2 border border-border rounded-md bg-background"
                        >
                          {availableCities.map((city) => (
                            <option key={city.code} value={city.code}>
                              {city.name} ({city.code})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* 自訂目的地詳細資訊 */}
                  {newTour.countryCode === '__custom__' && (
                    <>
                      <div>
                        <label className="text-sm font-medium text-morandi-primary">國家名稱</label>
                        <Input
                          value={newTour.customCountry || ''}
                          onChange={(e) => setNewTour(prev => ({ ...prev, customCountry: e.target.value }))}
                          placeholder="輸入國家名稱 (如：泰國)"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-morandi-primary">3 碼城市代號</label>
                        <Input
                          value={newTour.customCityCode || ''}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().slice(0, 3);
                            setNewTour(prev => ({ ...prev, customCityCode: value }));
                          }}
                          placeholder="輸入 3 碼代號 (如：BKK)"
                          className="mt-1"
                          maxLength={3}
                        />
                        <p className="text-xs text-morandi-secondary mt-1">
                          💡 用於生成團號，建議使用國際機場代碼或城市縮寫
                        </p>
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-morandi-primary">出發日期</label>
                      <SmartDateInput
                        value={newTour.departure_date}
                        onChange={(departure_date) => {
                          setNewTour(prev => {
                            // 如果回程日期早於新的出發日期，自動調整回程日期
                            const newReturnDate = prev.return_date && prev.return_date < departure_date
                              ? departure_date
                              : prev.return_date;

                            return {
                              ...prev,
                              departure_date,
                              return_date: newReturnDate
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
                        onChange={(return_date) => {
                          setNewTour(prev => ({ ...prev, return_date }));
                        }}
                        min={newTour.departure_date || new Date().toISOString().split('T')[0]}
                        initialMonth={newTour.departure_date}
                        className="mt-1"
                        required
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

                <AddOrderForm
                  tourId="embedded"
                  value={newOrder}
                  onChange={setNewOrder}
                />

                <div className="bg-morandi-container/20 p-3 rounded-lg mt-4">
                  <p className="text-xs text-morandi-secondary">
                    提示：如果填寫了聯絡人，將會同時建立一筆訂單。如果留空，則只建立旅遊團。
                  </p>
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
        <DialogContent className="max-w-md" aria-describedby={undefined}>
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
  const { quotes } = useQuotes();
  const { items: orders } = useOrderStore();
  const { items: members } = useMemberStore();

  // 找到該旅遊團的報價單（通常取最新的或已核准版本）
  const tourQuote = quotes.find((quote) => quote.tour_id === tour.id && quote.status === 'approved') ||
                   quotes.find((quote) => quote.tour_id === tour.id);

  // 計算該旅遊團的訂單資訊
  const tourOrders = orders.filter((order) => order.tour_id === tour.id);
  const totalPaidAmount = tourOrders.reduce((sum: any, order: any) => sum + order.paid_amount, 0);

  // 計算當前參與人數（從團員統計）
  const tourMembers = members.filter((member) =>
    tourOrders.some((order) => order.id === member.order_id)
  );
  const currentParticipants = tourMembers.length;

  // 財務計算
  const quotePrice = tourQuote?.total_cost || tour.price; // 報價單價格
  const expectedRevenue = quotePrice * currentParticipants; // 應收帳款 = 報價單價格 × 團體人數
  const actualRevenue = totalPaidAmount; // 實收帳款
  const grossProfit = actualRevenue - tour.total_cost; // 毛利 = 實收 - 總成本
  const netProfit = grossProfit - (grossProfit * 0.05); // 淨利潤（假設5%稅費，可調整）

  // 準備預算vs實際支出的對比資料
// TODO: usePaymentStore deprecated -   const paymentStore = usePaymentStore();
  const paymentStore = { payment_requests: [] }; // TODO: usePaymentStore deprecated
  const paymentRequests = paymentStore.payment_requests; // TODO: 從 paymentStore 取得

  // 獲取該旅遊團的請款單
  const tourPaymentRequests = paymentRequests.filter((req) => req.tour_id === tour.id);

  // 報價單中的類別預算
  const quoteBudget = tourQuote?.categories || [];

  // 計算各類別的實際支出 (從請款單統計)
  const actualExpenses = quoteBudget.map((category) => {
    const categoryTotal = tourPaymentRequests.reduce((sum: any, request: any) => {
      const categoryItems = request.items?.filter((item) => item.category === category.name) || [];
      return sum + categoryItems.reduce((itemSum: any, item: any) => itemSum + (item.unit_price * item.quantity), 0);
    }, 0);

    return {
      name: category.name,
      budgetPerPerson: category.total || 0, // 報價單中的單人預算
      budgetTotal: (category.total || 0) * currentParticipants, // 預算總額 = 單人預算 × 人數
      actualTotal: categoryTotal, // 實際支出
      variance: categoryTotal - ((category.total || 0) * currentParticipants) // 差額 (正數=超支，負數=節省)
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
            基準：{currentParticipants}人團體
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-morandi-container/20 border-b border-border">
              <tr>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-morandi-primary">類別</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">單人預算</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">預算總額</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">實際支出</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">差額</th>
                <th className="text-right py-2.5 px-4 text-xs font-semibold text-morandi-primary">差額率</th>
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
  tourExtraFields: Record<string, unknown>;
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const tourStore = useTourStore();
  const orderStore = useOrderStore();
  const memberStore = useMemberStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 獲取屬於這個旅遊團的所有訂單
  const tourOrders = orderStore.items.filter((order) => order.tour_id === tour.id);

  // 獲取團員數據
  const allTourMembers = memberStore.items.filter((member) =>
    tourOrders.some((order) => order.id === member.order_id)
  );

  // 計算已分房人數
  const assignedMembers = allTourMembers.filter((member) => member.assignedRoom).length;

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
  tourExtraFields: Record<string, unknown>;
  setTourExtraFields: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const handleOptionSelect = useCallback((option: string) => {
    const tour_id = tour.id;

    // 初始化該旅遊團的欄位狀態（如果還沒有）
    if (!tourExtraFields[tour_id]) {
      setTourExtraFields(prev => ({
        ...prev,
        [tour_id]: {
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
          [tour_id]: {
            ...prev[tour_id],
            addOns: true
          }
        }));
        break;

      case 'refund':
        // 啟用退費項目欄位
        setTourExtraFields(prev => ({
          ...prev,
          [tour_id]: {
            ...prev[tour_id],
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
            [tour_id]: {
              ...prev[tour_id],
              customFields: [
                ...(prev[tour_id]?.customFields || []),
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
      <DialogContent className="max-w-md" aria-describedby={undefined}>
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