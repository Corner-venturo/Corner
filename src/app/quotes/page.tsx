'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useTourStore, useRegionStoreNew } from '@/stores';
import { Calculator, FileText, Users, Trash2, Copy, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { QUOTE_STATUS_LABELS } from '@/constants/quote-status';

const _statusFilters = ['all', 'proposed', 'approved'];

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: tours } = useTourStore();
  const { quotes, addQuote, updateQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuotes();
  const { countries, cities, fetchAll: fetchRegions, getCitiesByCountry } = useRegionStoreNew();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState(''); // 城市搜尋關鍵字
  const processedTourIdRef = useRef<string | null>(null); // 追蹤已處理的 tourId
  const [newQuote, setNewQuote] = useState<{
    name: string;
    status: 'proposed' | 'approved';
    group_size: number | '';
    tour_id: string | null;
    is_pinned: boolean;
    code: string; // 🔥 自訂編號（用於置頂範本，直接使用 code 欄位）
    country_id: string | null; // 🌍 國家
    main_city_id: string | null; // 🏙️ 主要城市
    other_city_ids: string[]; // 🏙️ 其他城市（多選）
  }>({
    name: '',
    status: 'proposed',
    group_size: 1,
    tour_id: null,
    is_pinned: false,
    code: '',
    country_id: null,
    main_city_id: null,
    other_city_ids: [],
  });

  // 載入報價單資料 - 延遲載入優化
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuotes();
      fetchRegions(); // 載入國家和城市資料
    }, 100);
    return () => clearTimeout(timer);
  }, [loadQuotes, fetchRegions]); // 只在組件掛載時執行一次

  // 檢查 URL 參數，自動開啟新增對話框
  useEffect(() => {
    const tourId = searchParams.get('tour_id');
    // 只在有 tour_id 且對話框未開啟且尚未處理過時檢查
    if (tourId && !isAddDialogOpen && tours.length > 0 && processedTourIdRef.current !== tourId) {
      processedTourIdRef.current = tourId; // 標記為已處理

      // 檢查該團是否已有報價單
      const existingQuote = quotes.find(q => q.tour_id === tourId);
      if (!existingQuote) {
        // 沒有報價單，找到旅遊團資料並開啟對話框
        const tour = tours.find(t => t.id === tourId);
        if (tour) {
          setNewQuote({
            name: tour.name,
            status: 'proposed',
            group_size: tour.max_participants || 1,
            tour_id: tourId,
            is_pinned: false,
            code: '',
            country_id: tour.country_id || null,
            main_city_id: tour.main_city_id || null,
            other_city_ids: [],
          });
          setIsAddDialogOpen(true);
        }
      } else {
        // 已有報價單，直接跳轉到該報價單
        router.replace(`/quotes/${existingQuote.id}`);
      }
    }

    // 當 URL 沒有 tour_id 時，重置追蹤
    if (!tourId) {
      processedTourIdRef.current = null;
    }
  }, [searchParams, quotes, tours, router, isAddDialogOpen, setNewQuote]);

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'quote_number',
      label: '編號',
      sortable: true,
      render: (value, quote) => {
        // 🔥 編號顯示邏輯
        let displayCode = '-';
        let codeColor = 'text-morandi-secondary';

        if (quote.tour_id) {
          // 有關聯旅遊團
          const relatedTour = tours.find(t => t.id === quote.tour_id);
          if (relatedTour?.code) {
            // 如果已轉成團，顯示版本號
            if (quote.converted_to_tour) {
              // 計算版本號：同一旅遊團的報價單按建立時間排序
              const tourQuotes = quotes
                .filter(q => q.tour_id === quote.tour_id && q.converted_to_tour)
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              const version = tourQuotes.findIndex(q => q.id === quote.id) + 1;
              displayCode = `${relatedTour.code}-V${version}`;
            } else {
              displayCode = relatedTour.code;
            }
            codeColor = 'text-morandi-gold';
          }
        } else if (quote.is_pinned && quote.code) {
          // 置頂範本使用自訂編號
          displayCode = quote.code;
          codeColor = 'text-morandi-gold';
        } else {
          // 獨立報價單使用 Q 編號
          displayCode = quote.code || '-';
        }

        return (
          <div className="flex items-center gap-2">
            {quote.is_pinned && (
              <Pin size={14} className="text-morandi-gold" title="置頂範本" />
            )}
            <span className={cn("text-sm font-mono", codeColor)}>
              {displayCode}
            </span>
          </div>
        );
      },
    },
    {
      key: 'name',
      label: '團體名稱',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm font-medium text-morandi-primary">{quote.name}</span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, quote) => (
        <span className={cn(
          'text-sm font-medium',
          getStatusColor(quote.status)
        )}>
          {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] || quote.status}
        </span>
      ),
    },
    {
      key: 'group_size',
      label: '人數',
      sortable: true,
      render: (value, quote) => (
        <div className="flex items-center text-sm text-morandi-secondary">
          <Users size={14} className="mr-1" />
          {quote.group_size}人
        </div>
      ),
    },
    {
      key: 'total_cost',
      label: '總成本',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm text-morandi-secondary">
          NT$ {quote.total_cost.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立時間',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm text-morandi-secondary">
          {new Date(quote.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ], [tours]);

  const filteredQuotes = quotes
    .filter(quote => {
      const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

      // 搜尋 - 搜尋所有文字欄位
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        quote.name.toLowerCase().includes(searchLower) ||
        quote.quote_number?.toLowerCase().includes(searchLower) ||
        quote.status.toLowerCase().includes(searchLower);

      return matchesStatus && matchesSearch;
    })
    // 🔥 排序：置頂的報價單排在最前面
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // 同樣是置頂或都不是置頂，按建立時間排序
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleAddQuote = async () => {
    if (!newQuote.name.trim()) return;

    // 確保人數有效
    const groupSize = typeof newQuote.group_size === 'number' ? newQuote.group_size : 1;
    if (groupSize < 1) {
      alert('人數必須至少為 1');
      return;
    }

    const defaultCategories = [
      { id: 'transport', name: '交通', items: [], total: 0 },
      { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
      { id: 'accommodation', name: '住宿', items: [], total: 0 },
      { id: 'meals', name: '餐飲', items: [], total: 0 },
      { id: 'activities', name: '活動', items: [], total: 0 },
      { id: 'others', name: '其他', items: [], total: 0 },
      { id: 'guide', name: '領隊導遊', items: [], total: 0 }
    ];

    try {
      // 使用表單中的 tour_id（如果有選擇），否則從 URL 取得
      const selectedTourId = newQuote.tour_id || searchParams.get('tour_id');

      // 🔥 如果是置頂範本且有自訂編號，使用自訂編號；否則使用自動生成編號
      const quoteCode = (newQuote.is_pinned && newQuote.code.trim())
        ? newQuote.code.trim().toUpperCase()
        : undefined; // undefined 會讓 store 自動生成編號

      // 新增報價單並取得完整物件
      const newQuoteObj = await addQuote({
        ...newQuote,
        group_size: groupSize,
        ...(selectedTourId && { tour_id: selectedTourId }), // 如果有 tour_id，加入報價單資料
        ...(quoteCode && { code: quoteCode }), // 🔥 如果有自訂編號，使用自訂編號
        accommodation_days: 0,
        categories: defaultCategories,
        total_cost: 0,
        // 🔥 補充必填欄位的預設值
        customer_name: '待指定',
        destination: '待指定',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        days: 1,
        nights: 0,
        number_of_people: groupSize,
        total_amount: 0,
        is_pinned: newQuote.is_pinned || false,
      });


      // 重置表單並關閉對話框
      setNewQuote({
        name: '',
        status: 'proposed',
        group_size: 1,
        tour_id: null,
        is_pinned: false,
        code: '',
        country_id: null,
        main_city_id: null,
        other_city_ids: [],
      });
      setIsAddDialogOpen(false);

      // 直接跳轉到詳細頁面開始編輯
      if (newQuoteObj?.id) {
        // 使用 replace 避免返回時回到帶參數的列表頁
        router.replace(`/quotes/${newQuoteObj.id}`);
      } else {
        console.error('❌ 報價單 ID 不存在，無法跳轉');
      }
    } catch (error) {
      logger.error('新增報價單失敗:', error);
      alert('新增報價單失敗，請重試');
    }
  };

  const handleQuoteClick = (quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const handleDuplicateQuote = async (quote_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = await duplicateQuote(quote_id);
      if (duplicated && (duplicated as unknown).id) {
        // 跳轉到新報價單
        router.push(`/quotes/${(duplicated as unknown).id}`);
      } else {
        alert('複製報價單失敗，請重試');
      }
    } catch (error) {
      logger.error('❌ 複製報價單失敗:', error);
      alert('複製報價單失敗，請重試');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'proposed': 'text-morandi-gold',
      'approved': 'text-green-600'
    };
    return colors[status] || 'text-morandi-secondary';
  };

  // 根據選擇的國家，取得可選城市
  const availableCities = useMemo(() => {
    if (!newQuote.country_id) return [];
    return getCitiesByCountry(newQuote.country_id).filter(city => city.is_active);
  }, [newQuote.country_id, getCitiesByCountry]);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' }
        ]}
        tabs={[
          { value: 'all', label: '全部', icon: Calculator },
          { value: 'proposed', label: '提案', icon: FileText },
          { value: 'approved', label: '已核准', icon: FileText }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋報價單名稱..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增報價單"
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
        className="min-h-full"
        columns={tableColumns}
        data={filteredQuotes}
        searchableFields={['name']}
        searchTerm={searchTerm}
        onRowClick={(quote) => handleQuoteClick(quote)}
        bordered={true}
        actions={(quote) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                updateQuote(quote.id, { is_pinned: !quote.is_pinned });
              }}
              className={cn(
                quote.is_pinned
                  ? "text-morandi-gold hover:bg-morandi-gold/10"
                  : "text-morandi-secondary hover:bg-morandi-secondary/10"
              )}
              title={quote.is_pinned ? "取消置頂" : "設為置頂範本"}
            >
              <Pin size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                handleQuoteClick(quote);
              }}
              className="text-morandi-gold hover:bg-morandi-gold/10"
              title="編輯報價單"
            >
              <Calculator size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => handleDuplicateQuote(quote.id, e)}
              className="text-morandi-blue hover:bg-morandi-blue/10"
              title="複製報價單"
            >
              <Copy size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuote(quote.id);
              }}
              className="text-morandi-red hover:bg-morandi-red/10"
              title="刪除報價單"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />
      </div>

      {/* 新增報價單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          // 關閉對話框時重置表單並清理 URL
          setNewQuote({
            name: '',
            status: 'proposed',
            group_size: 1,
            tour_id: null,
            is_pinned: false,
            code: '',
            country_id: null,
            main_city_id: null,
            other_city_ids: [],
          });
          setCitySearchTerm('');
          // 清理 URL 參數
          if (searchParams.get('tour_id')) {
            router.replace('/quotes');
          }
        }
      }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => {
          // 防止點擊 Select 下拉選單時關閉 Dialog
          const target = e.target as HTMLElement;
          if (target.closest('[role="listbox"]') || target.closest('[data-radix-select-viewport]')) {
            e.preventDefault();
          }
        }}>
          <DialogHeader>
            <DialogTitle>新增報價單</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newQuote.name.trim()) {
                handleAddQuote();
              }
            }}
            className="space-y-4"
          >
            {/* 🔥 選擇是否關聯旅遊團 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary">關聯旅遊團（選填）</label>
              <Select
                value={newQuote.tour_id || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setNewQuote(prev => ({ ...prev, tour_id: null }));
                  } else {
                    const tour = tours.find(t => t.id === value);
                    setNewQuote(prev => ({
                      ...prev,
                      tour_id: value,
                      name: tour?.name || prev.name,
                      group_size: tour?.max_participants || prev.group_size,
                      country_id: tour?.country_id || prev.country_id,
                      main_city_id: tour?.main_city_id || prev.main_city_id,
                    }));
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="獨立報價單（無旅遊團）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">獨立報價單（無旅遊團）</SelectItem>
                  {tours.filter(t => !t._deleted).map(tour => (
                    <SelectItem key={tour.id} value={tour.id}>
                      {tour.code} - {tour.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-morandi-secondary mt-1">
                選擇旅遊團後，報價單編號將使用團號
              </p>
            </div>

            {/* 國家選擇 */}
            <div>
              <label className="text-sm font-medium text-morandi-primary">國家</label>
              <Select
                value={newQuote.country_id || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setNewQuote(prev => ({ ...prev, country_id: null, main_city_id: null, other_city_ids: [] }));
                  } else {
                    setNewQuote(prev => ({ ...prev, country_id: value, main_city_id: null, other_city_ids: [] }));
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="選擇國家" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">請選擇國家</SelectItem>
                  {countries.filter(c => c.is_active).map(country => (
                    <SelectItem key={country.id} value={country.id}>
                      {country.emoji} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 主要城市選擇 */}
            {newQuote.country_id && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">主要城市</label>
                <Select
                  value={newQuote.main_city_id || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setNewQuote(prev => ({ ...prev, main_city_id: null }));
                    } else {
                      setNewQuote(prev => ({ ...prev, main_city_id: value }));
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選擇主要城市" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">請選擇主要城市</SelectItem>
                    {availableCities.map(city => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-morandi-secondary mt-1">
                  主要城市用於團號生成
                </p>
              </div>
            )}

            {/* 其他城市選擇（多選） */}
            {newQuote.country_id && newQuote.main_city_id && availableCities.filter(city => city.id !== newQuote.main_city_id).length > 0 && (
              <div>
                <label className="text-sm font-medium text-morandi-primary">其他城市（選填）</label>
                <div className="mt-1 space-y-2">
                  {/* 搜尋框 */}
                  <Input
                    placeholder="輸入城市名稱搜尋（例如：清）..."
                    value={citySearchTerm}
                    onChange={(e) => setCitySearchTerm(e.target.value)}
                    className="text-sm"
                  />

                  {/* 已選擇的城市標籤 */}
                  {newQuote.other_city_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2 border border-border rounded-md bg-morandi-container/10">
                      {newQuote.other_city_ids.map(cityId => {
                        const city = availableCities.find(c => c.id === cityId);
                        if (!city) return null;
                        return (
                          <span
                            key={cityId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-morandi-gold/20 text-morandi-primary text-xs rounded"
                          >
                            {city.name}
                            <button
                              type="button"
                              onClick={() => {
                                setNewQuote(prev => ({
                                  ...prev,
                                  other_city_ids: prev.other_city_ids.filter(id => id !== cityId)
                                }));
                              }}
                              className="hover:text-morandi-red"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 可選擇的城市列表 */}
                  <div className="max-h-32 overflow-y-auto border border-border rounded-md">
                    {availableCities
                      .filter(city =>
                        city.id !== newQuote.main_city_id &&
                        !newQuote.other_city_ids.includes(city.id) &&
                        (citySearchTerm === '' || city.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
                      )
                      .map(city => (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            setNewQuote(prev => ({
                              ...prev,
                              other_city_ids: [...prev.other_city_ids, city.id]
                            }));
                            setCitySearchTerm(''); // 選擇後清空搜尋
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-morandi-container/20 transition-colors"
                        >
                          {city.name}
                        </button>
                      ))}
                    {availableCities
                      .filter(city =>
                        city.id !== newQuote.main_city_id &&
                        !newQuote.other_city_ids.includes(city.id) &&
                        (citySearchTerm === '' || city.name.toLowerCase().includes(citySearchTerm.toLowerCase()))
                      ).length === 0 && (
                      <div className="px-3 py-6 text-center text-sm text-morandi-secondary">
                        無符合的城市
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-morandi-secondary mt-1">
                  點擊城市加入，用於廠商篩選
                </p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-morandi-primary">團體名稱</label>
              <Input
                value={newQuote.name}
                onChange={(e) => setNewQuote(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入團體名稱"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">人數</label>
              <Input
                type="number"
                value={newQuote.group_size}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewQuote(prev => ({
                    ...prev,
                    group_size: value === '' ? '' : Number(value)
                  }));
                }}
                placeholder="1"
                className="mt-1"
                min="1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">狀態</label>
              <Select
                value={newQuote.status}
                onValueChange={(value) => setNewQuote(prev => ({ ...prev, status: value as 'proposed' | 'approved' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposed">提案</SelectItem>
                  <SelectItem value="approved">已核准</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 🔥 置頂選項（範本報價單） */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={newQuote.is_pinned}
                  onChange={(e) => setNewQuote(prev => ({ ...prev, is_pinned: e.target.checked }))}
                  className="h-4 w-4 rounded border-morandi-border text-morandi-gold focus:ring-morandi-gold"
                />
                <label htmlFor="is_pinned" className="text-sm text-morandi-primary cursor-pointer">
                  設為置頂範本（方便複製使用）
                </label>
              </div>

              {/* 🔥 置頂時顯示自訂編號輸入框 */}
              {newQuote.is_pinned && (
                <div>
                  <label className="text-sm font-medium text-morandi-primary">
                    商品編號（選填）
                  </label>
                  <Input
                    value={newQuote.code}
                    onChange={(e) => setNewQuote(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="例如：JP-BASIC, EU-LUXURY"
                    className="mt-1"
                  />
                  <p className="text-xs text-morandi-secondary mt-1">
                    不填寫則自動生成 Q 開頭的編號
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!newQuote.name.trim() || !newQuote.group_size || newQuote.group_size < 1}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}