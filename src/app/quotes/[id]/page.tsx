'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Car,
  Home,
  UtensilsCrossed,
  MapPin,
  MoreHorizontal,
  Users,
  Trash2,
  Edit,
  ArrowLeft,
  Save,
  History,
  Plane,
  Copy,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuoteStore } from '@/stores/quote-store';
import { useTourStore } from '@/stores/tour-store';
import { generateTourCode } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { getRegionOptions, type RegionName } from '@/data/region-options';

interface CostItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  note?: string;
  // 住宿專用：天數和房型數據
  day?: number; // 第幾天
  roomType?: string; // 房型名稱（如：雙人房、三人房）
  // 交通和領隊導遊專用：團體分攤
  isGroupCost?: boolean; // 是否為團體費用
}

interface CostCategory {
  id: string;
  name: string;
  items: CostItem[];
  total: number;
}

const costCategories: CostCategory[] = [
  { id: 'transport', name: '交通', items: [], total: 0 },
  { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
  { id: 'accommodation', name: '住宿', items: [], total: 0 },
  { id: 'meals', name: '餐飲', items: [], total: 0 },
  { id: 'activities', name: '活動', items: [], total: 0 },
  { id: 'others', name: '其他', items: [], total: 0 },
  { id: 'guide', name: '領隊導遊', items: [], total: 0 }
];

// 圖標映射
const categoryIcons: Record<string, React.ElementType> = {
  transport: Car,
  'group-transport': Users,
  accommodation: Home,
  meals: UtensilsCrossed,
  activities: MapPin,
  others: MoreHorizontal,
  guide: Users
};

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { quotes, updateQuote, saveQuoteVersion } = useQuoteStore();
  const { tours, addTour } = useTourStore();

  const quoteId = params.id as string;
  const quote = quotes.find(q => q.id === quoteId);

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null;
  const isSpecialTour = relatedTour?.status === '特殊團';
  const isReadOnly = isSpecialTour; // 特殊團報價單設為唯讀

  const [categories, setCategories] = useState<CostCategory[]>(() => {
    const initialCategories = quote?.categories || costCategories;
    // 確保每個分類的總計都正確計算
    return initialCategories.map(cat => ({
      ...cat,
      total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0)
    }));
  });
  const [accommodationDays, setAccommodationDays] = useState<number>(quote?.accommodation_days || 0);
  const [groupSize, setGroupSize] = useState<number>(quote?.group_size || 1);
  const [quoteName, setQuoteName] = useState<string>(quote?.name || '');
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionName>('清邁');

  // 如果找不到報價單，返回列表頁
  useEffect(() => {
    if (!quote) {
      router.push('/quotes');
    }
  }, [quote, router]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        scrollRef.current.classList.add('scrolling');

        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.classList.remove('scrolling');
          }
        }, 1000);
      }
    };

    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleAddRow = useCallback((category_id: string) => {
    if (categoryId === 'accommodation') {
      // 住宿用專用函數
      handleAddAccommodationRoomType();
      return;
    }

    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: ''
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  }, []);

  // 新增導遊項目
  const handleAddGuideRow = (category_id: string) => {
    const calculatedGuideCost = calculateGuideCost();

    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '領隊分攤',
      quantity: 1,
      unit_price: calculatedGuideCost,
      total: Math.ceil(calculatedGuideCost),
      note: '自動計算：住宿第一房型 + 個人交通'
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  };

  // 住宿：新增天數
  const handleAddAccommodationDay = useCallback(() => {
    const newDayCount = accommodationDays + 1;
    setAccommodationDays(newDayCount);

    // 新增一天，預設加一個空房型
    const timestamp = Date.now();
    const newItem: CostItem = {
      id: `accommodation-day${newDayCount}-${timestamp}`,
      name: '',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      day: newDayCount,
      room_type: ''
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === 'accommodation') {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  }, [accommodationDays]);

  // 住宿：新增房型（在所有現有天數都新增同樣的房型）
  const handleAddAccommodationRoomType = useCallback(() => {
    if (accommodationDays === 0) return; // 必須先有天數

    const timestamp = Date.now();
    const newItems: CostItem[] = [];

    // 為每一天都新增同樣的房型
    for (let day = 1; day <= accommodationDays; day++) {
      newItems.push({
        id: `accommodation-day${day}-${timestamp}`,
        name: '',
        quantity: 0,
        unit_price: 0,
        total: 0,
        note: '',
        day: day,
        room_type: ''
      });
    }

    setCategories(prev => prev.map(cat => {
      if (cat.id === 'accommodation') {
        return {
          ...cat,
          items: [...cat.items, ...newItems]
        };
      }
      return cat;
    }));
  }, [accommodationDays]);


  const handleUpdateItem = (category_id: string, itemId: string, field: keyof CostItem, value: any) => {
    setCategories(prev => {
      const newCategories = prev.map(cat => {
        if (cat.id === categoryId) {
          const updatedItems = cat.items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, [field]: value };
              // 自動計算總價
              if (field === 'quantity' || field === 'unit_price' || field === 'is_group_cost') {
                // 數量預設為 1，只有當用戶輸入時才使用輸入值
                const effectiveQuantity = updatedItem.quantity === 0 ? 1 : (updatedItem.quantity || 1);

                if (categoryId === 'accommodation') {
                  // 住宿特殊邏輯：小計 = 單價 ÷ 人數
                  updatedItem.total = effectiveQuantity > 0 ? Math.ceil((updatedItem.unit_price || 0) / effectiveQuantity) : 0;
                } else if ((categoryId === 'transport' || categoryId === 'guide') && updatedItem.is_group_cost && groupSize > 1) {
                  // 交通和領隊導遊的團體分攤邏輯：小計 = (數量 × 單價) ÷ 團體人數
                  const totalCost = effectiveQuantity * (updatedItem.unit_price || 0);
                  updatedItem.total = Math.ceil(totalCost / groupSize);
                } else if (categoryId === 'group-transport') {
                  // 團體分攤分類：自動執行團體分攤邏輯
                  if (updatedItem.name === '領隊分攤') {
                    // 領隊分攤：直接使用單價作為每人費用，不再除以人數
                    updatedItem.total = Math.ceil(updatedItem.unit_price || 0);
                  } else if (groupSize > 1) {
                    // 其他團體分攤項目：執行一般團體分攤邏輯
                    const totalCost = effectiveQuantity * (updatedItem.unit_price || 0);
                    updatedItem.total = Math.ceil(totalCost / groupSize);
                  } else {
                    // 人數為1時，不分攤
                    updatedItem.total = Math.ceil(effectiveQuantity * (updatedItem.unit_price || 0));
                  }
                } else {
                  // 一般邏輯：小計 = 數量 × 單價
                  updatedItem.total = Math.ceil(effectiveQuantity * (updatedItem.unit_price || 0));
                }
              }
              return updatedItem;
            }
            return item;
          });

          return {
            ...cat,
            items: updatedItems,
            total: updatedItems.reduce((sum, item) => sum + item.total, 0)
          };
        }
        return cat;
      });

      // 如果有住宿或交通數據變更，需要更新所有領隊分攤項目
      if (categoryId === 'accommodation' || categoryId === 'transport') {
        return updateGuideItems(newCategories);
      }

      return newCategories;
    });
  };

  // 更新所有領隊分攤項目
  const updateGuideItems = (categories: CostCategory[]) => {
    // 重新計算領隊費用
    const newGuideCost = calculateGuideWithCategories(categories);

    return categories.map(cat => {
      if (cat.id === 'group-transport') {
        const updatedItems = cat.items.map(item => {
          if (item.name === '領隊分攤') {
            return {
              ...item,
              unit_price: newGuideCost,
              total: Math.ceil(newGuideCost)
            };
          }
          return item;
        });

        return {
          ...cat,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.total, 0)
        };
      }
      return cat;
    });
  };

  // 使用特定的 categories 來計算領隊費用
  const calculateGuideWithCategories = (categories: CostCategory[]) => {
    // 1. 計算住宿每日第一個房型的單價總和
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation');
    let dailyFirstRoomCost = 0;

    if (accommodationCategory && accommodationCategory.items.length > 0) {
      const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined);
      const groupedByDay: Record<number, CostItem[]> = {};

      // 按天分組
      accommodationItems.forEach(item => {
        const day = item.day!;
        if (!groupedByDay[day]) groupedByDay[day] = [];
        groupedByDay[day].push(item);
      });

      // 計算每天第一個房型的單價
      Object.keys(groupedByDay).forEach(dayStr => {
        const dayItems = groupedByDay[Number(dayStr)];
        if (dayItems.length > 0) {
          dailyFirstRoomCost += dayItems[0].unit_price || 0;
        }
      });
    }

    // 2. 計算個人交通費用（非團體分攤的交通費用）
    const transportCategory = categories.find(cat => cat.id === 'transport');
    let personalTransportCost = 0;

    if (transportCategory && transportCategory.items.length > 0) {
      personalTransportCost = transportCategory.items
        .filter(item => !item.is_group_cost)
        .reduce((sum, item) => sum + ((item.quantity || 1) * (item.unit_price || 0)), 0);
    }

    // 3. 計算領隊分攤 = (住宿第一房型總和 + 個人交通) ÷ 總人數
    const totalGuideCost = dailyFirstRoomCost + personalTransportCost;

    return groupSize > 0 ? Math.ceil(totalGuideCost / groupSize) : 0;
  };


  const handleRemoveItem = useCallback((category_id: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        const updatedItems = cat.items.filter(item => item.id !== itemId);
        return {
          ...cat,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.total, 0)
        };
      }
      return cat;
    }));
  }, []);

  // 計算交通團體分攤信息
  const transportGroupSummary = useMemo(() => {
    const transportCategory = categories.find(cat => cat.id === 'transport');
    if (!transportCategory || transportCategory.items.length === 0) return null;

    const groupCostItems = transportCategory.items.filter(item => item.is_group_cost);
    if (groupCostItems.length === 0) return null;

    const totalGroupCost = groupCostItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const perPersonCost = groupSize > 0 ? totalGroupCost / groupSize : 0;

    return {
      totalGroupCost,
      perPersonCost,
      itemCount: groupCostItems.length
    };
  }, [categories, groupSize]);

  // 計算領隊分攤金額
  const guideCostPerPerson = useMemo(() => {
    // 1. 計算住宿每日第一個房型的單價總和
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation');
    let dailyFirstRoomCost = 0;

    if (accommodationCategory && accommodationCategory.items.length > 0) {
      const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined);
      const groupedByDay: Record<number, CostItem[]> = {};

      // 按天分組
      accommodationItems.forEach(item => {
        const day = item.day!;
        if (!groupedByDay[day]) groupedByDay[day] = [];
        groupedByDay[day].push(item);
      });

      // 計算每天第一個房型的單價
      Object.keys(groupedByDay).forEach(dayStr => {
        const dayItems = groupedByDay[Number(dayStr)];
        if (dayItems.length > 0) {
          dailyFirstRoomCost += dayItems[0].unit_price || 0;
        }
      });
    }

    // 2. 計算個人交通費用（非團體分攤的交通費用）
    const transportCategory = categories.find(cat => cat.id === 'transport');
    let personalTransportCost = 0;

    if (transportCategory && transportCategory.items.length > 0) {
      personalTransportCost = transportCategory.items
        .filter(item => !item.is_group_cost)
        .reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
    }

    // 3. 計算領隊分攤 = (住宿第一房型總和 + 個人交通) ÷ 總人數
    const totalGuideCost = dailyFirstRoomCost + personalTransportCost;

    return groupSize > 0 ? Math.ceil(totalGuideCost / groupSize) : 0;
  }, [categories, groupSize]);

  // 處理下拉選單項目選擇
  const handleOptionSelect = (category_id: string, itemId: string, option: any) => {
    // 更新項目名稱
    handleUpdateItem(categoryId, itemId, 'name', option.name);

    // 根據選項類型設定價格和團體分攤狀態
    if (option.pricePerGroup && option.is_group_cost) {
      // 團體費用
      handleUpdateItem(categoryId, itemId, 'unit_price', option.pricePerGroup);
      handleUpdateItem(categoryId, itemId, 'is_group_cost', true);
    } else if (option.pricePerPerson) {
      // 個人費用
      handleUpdateItem(categoryId, itemId, 'unit_price', option.pricePerPerson);
      handleUpdateItem(categoryId, itemId, 'is_group_cost', false);
    } else if (option.adultPrice !== undefined) {
      // 活動門票 (使用成人價格)
      handleUpdateItem(categoryId, itemId, 'unit_price', option.adultPrice);
      handleUpdateItem(categoryId, itemId, 'is_group_cost', false);
    }
  };

  // 取得當前地區的選項
  const regionOptions = getRegionOptions(selectedRegion);

  // 計算住宿的房型位置平均費用
  const accommodationSummary = useMemo(() => {
    const accommodationCategory = categories.find(cat => cat.id === 'accommodation');
    if (!accommodationCategory || accommodationCategory.items.length === 0) return [];

    const accommodationItems = accommodationCategory.items.filter(item => item.day !== undefined);
    const groupedByDay: Record<number, CostItem[]> = {};

    // 按天分組
    accommodationItems.forEach(item => {
      const day = item.day!;
      if (!groupedByDay[day]) groupedByDay[day] = [];
      groupedByDay[day].push(item);
    });

    const days = Object.keys(groupedByDay).map(d => Number(d)).sort((a, b) => a - b);
    if (days.length === 0) return [];

    // 找出最大房型數量
    const maxRoomTypes = Math.max(...days.map(day => groupedByDay[day].length));
    const roomTypeSummaries = [];

    // 按房型位置計算
    for (let roomIndex = 0; roomIndex < maxRoomTypes; roomIndex++) {
      let totalCost = 0;
      let roomTypeName = '';
      let validDays = 0;

      days.forEach(day => {
        const dayItems = groupedByDay[day];
        if (dayItems[roomIndex]) {
          totalCost += dayItems[roomIndex].total;
          validDays++;
          if (!roomTypeName && dayItems[roomIndex].name) {
            roomTypeName = dayItems[roomIndex].name;
          }
        }
      });

      if (validDays > 0) {
        roomTypeSummaries.push({
          name: roomTypeName || `房型${roomIndex + 1}`,
          totalCost,
          averageCost: totalCost / validDays,
          days: validDays
        });
      }
    }

    return roomTypeSummaries;
  }, [categories]);
  // 住宿總成本 = 房型一總成本 + 房型二總成本 + ...
  const accommodationTotal = useMemo(() =>
    accommodationSummary.reduce((sum, room) => sum + room.total_cost, 0)
  , [accommodationSummary]);

  // 更新住宿分類的總計為房型加總
  const updatedCategories = useMemo(() =>
    categories.map(cat => {
      if (cat.id === 'accommodation') {
        return { ...cat, total: accommodationTotal };
      }
      return cat;
    })
  , [categories, accommodationTotal]);

  // 計算總成本
  const totalCost = useMemo(() =>
    updatedCategories.reduce((sum, cat) => sum + cat.total, 0)
  , [updatedCategories]);

  // 保存版本
  const handleSaveVersion = useCallback((note?: string) => {
    if (!quote) return;

    try {
      // 先更新目前的報價單
      updateQuote(quote.id, {
        categories: updatedCategories,
        totalCost,
        groupSize,
        name: quoteName,
        accommodationDays
      });

      // 然後保存版本
      saveQuoteVersion(quote.id, note || '手動保存版本');

      // 顯示成功提示
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('保存版本失敗:', error);
    }
  }, [quote, updatedCategories, totalCost, groupSize, quoteName, accommodationDays, updateQuote, saveQuoteVersion]);

  // 載入特定版本
  const handleLoadVersion = useCallback((versionData: any) => {
    setCategories(versionData.categories);
    setAccommodationDays(quote?.accommodation_days || 0);
    // 版本切換不改變基本資訊，只改變費用結構
  }, [quote]);

  // 格式化時間
  const formatDateTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // 轉為最終版本
  const handleFinalize = () => {
    if (!quote) return;

    // 先保存當前版本
    handleSaveVersion('轉為最終版本前的狀態');

    // 更新狀態為最終版本
    updateQuote(quote.id, {
      status: '最終版本',
      categories: updatedCategories,
      totalCost,
      groupSize,
      name: quoteName,
      accommodationDays
    });

    // 自動跳轉到旅遊團新增頁面，並帶上報價單ID
    router.push(`/tours?fromQuote=${quote.id}`);
  };

  // 開旅遊團
  const handleCreateTour = () => {
    if (!quote) return;

    // 先保存目前的報價單狀態
    handleSaveVersion('轉為旅遊團前的版本');

    // 更新報價單狀態為最終版本
    updateQuote(quote.id, { status: '最終版本' });

    // 創建旅遊團
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 30); // 預設30天後出發
    const returnDate = new Date(departureDate);
    returnDate.setDate(returnDate.getDate() + 5); // 預設5天行程

    const tourCode = generateTourCode('Tokyo', departureDate, false);

    addTour({
      name: quoteName,
      location: 'Tokyo', // 可以從報價單內容推斷
      departureDate: departureDate.toISOString().split('T')[0],
      returnDate: returnDate.toISOString().split('T')[0],
      price: Math.round(totalCost / groupSize), // 每人單價
      status: '提案',
      isSpecial: false,
      code: tourCode,
      contractStatus: '未簽署',
      totalRevenue: 0,
      total_cost: totalCost,
      profit: 0,
    });

    // 跳轉到旅遊團管理頁面
    router.push('/tours');
  };

  return (
    <div className="space-y-6">
      {/* 特殊團鎖定警告 */}
      {isSpecialTour && (
        <div className="fixed top-18 right-0 left-16 bg-orange-50 border-b border-orange-200 z-30 px-6 py-2">
          <div className="flex items-center space-x-2 text-orange-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">此為特殊團報價單，所有欄位已鎖定無法編輯</span>
          </div>
        </div>
      )}

      {/* 正確的兩區域標題設計 */}
      <div className={cn(
        "fixed top-0 right-0 left-16 h-18 bg-background border-b border-border z-40 flex items-center justify-between px-6",
        isSpecialTour && "border-b-0"
      )}>
        {/* 左區：內容標題區域 - 緊湊排列 */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => router.push('/quotes')}
            className="p-2 hover:bg-morandi-container rounded-lg transition-colors"
            title="返回報價單列表"
          >
            <ArrowLeft size={20} className="text-morandi-secondary" />
          </button>

          <input
            type="text"
            value={quoteName}
            onChange={(e) => setQuoteName(e.target.value)}
            disabled={isReadOnly}
            className={cn(
              "text-lg font-bold text-morandi-primary bg-transparent border-0 focus:outline-none focus:bg-white px-2 py-1 rounded w-[180px]",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
            placeholder="輸入團體名稱"
          />

        </div>

        {/* 右區：功能區域 (原中+右合併) */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">地區:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as RegionName)}
              disabled={isReadOnly}
              className={cn(
                "px-2 py-1 text-xs border border-border rounded bg-background text-morandi-primary",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <option value="清邁">清邁</option>
              <option value="曼谷">曼谷</option>
              <option value="東京">東京</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">人數:</span>
            <input
              type="number"
              value={groupSize}
              onChange={(e) => setGroupSize(Number(e.target.value) || 1)}
              disabled={isReadOnly}
              className={cn(
                "w-14 px-2 py-1 text-sm border border-border rounded bg-background",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
              min="1"
            />
          </div>

          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">狀態:</span>
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
              quote?.status === '提案'
                ? 'bg-morandi-gold text-white'
                : 'bg-morandi-green text-white'
            )}>
              {quote?.status || '提案'}
            </span>
          </div>

          <Button
            onClick={() => handleSaveVersion()}
            disabled={isReadOnly}
            className={cn(
              "h-8 px-3 text-sm transition-all duration-200",
              saveSuccess
                ? "bg-morandi-green hover:bg-morandi-green text-white"
                : "bg-morandi-green hover:bg-morandi-green-hover text-white",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
          >
            <Save size={14} className="mr-1.5" />
            {saveSuccess ? '已保存' : '保存版本'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={isReadOnly}
                className={cn(
                  "h-8 px-3 text-sm border-morandi-container text-morandi-secondary hover:bg-morandi-container",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <History size={14} className="mr-1.5" />
                版本 {quote?.version || 1}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-2 py-1 text-sm font-medium text-morandi-primary border-b border-border">
                版本歷史
              </div>

              {/* 當前版本 */}
              <DropdownMenuItem className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="font-medium">版本 {quote?.version || 1} (當前)</span>
                  <span className="text-xs text-morandi-secondary">
                    {quote?.updated_at ? formatDateTime(quote.updated_at) : ''}
                  </span>
                </div>
                <div className="text-xs bg-morandi-gold text-white px-2 py-1 rounded">
                  當前
                </div>
              </DropdownMenuItem>

              {/* 歷史版本 */}
              {quote?.versions && quote.versions.length > 0 && (
                <>
                  {quote.versions
                    .sort((a, b) => b.version - a.version)
                    .map((version) => (
                      <DropdownMenuItem
                        key={version.id}
                        className="flex items-center justify-between py-2 cursor-pointer hover:bg-morandi-container/30"
                        onClick={() => handleLoadVersion(version)}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">版本 {version.version}</span>
                          <span className="text-xs text-morandi-secondary">
                            {formatDateTime(version.created_at)}
                          </span>
                          {version.note && (
                            <span className="text-xs text-morandi-secondary italic">
                              {version.note}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-morandi-secondary">
                          NT$ {version.total_cost.toLocaleString()}
                        </div>
                      </DropdownMenuItem>
                    ))
                  }
                </>
              )}

              {(!quote?.versions || quote.versions.length === 0) && (
                <div className="px-2 py-3 text-sm text-morandi-secondary text-center">
                  尚無歷史版本
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {quote?.status === '提案' && (
            <Button
              onClick={handleFinalize}
              disabled={isReadOnly}
              className={cn(
                "h-8 px-3 text-sm bg-morandi-primary hover:bg-morandi-primary/90 text-white",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <CheckCircle size={14} className="mr-1.5" />
              轉為最終版本
            </Button>
          )}

          {quote?.status === '最終版本' && (
            <Button
              onClick={handleCreateTour}
              disabled={isReadOnly}
              className={cn(
                "h-8 px-3 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <Plane size={14} className="mr-1.5" />
              開旅遊團
            </Button>
          )}
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* 左側內容區 - 70% */}
          <div className={cn(
            "lg:col-span-7",
            isReadOnly && "opacity-70 pointer-events-none select-none"
          )}>
            <div className="border border-border bg-card rounded-lg overflow-hidden shadow-sm">
              <div ref={scrollRef} className="scrollable-content overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                <thead className="bg-morandi-container/50">
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary w-28 table-divider">分類</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-40 table-divider">項目</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-20 table-divider">數量</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-28 table-divider">單價</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-28 table-divider whitespace-nowrap">小計</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-32 table-divider">備註</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-24">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => {
                    const Icon = categoryIcons[category.id];

                    return (
                      <React.Fragment key={category.id}>
                        {/* 分類標題行 */}
                        <tr className="bg-morandi-container/20 border-b border-border">
                          <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                            <div className="flex items-center space-x-2">
                              <Icon size={16} className="text-morandi-gold" />
                              <span>{category.name}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4 font-medium text-morandi-primary text-center whitespace-nowrap">
                            NT$ {category.id === 'accommodation' ? accommodationTotal.toLocaleString() :
                                 category.items.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString()}
                          </td>
                          <td colSpan={2} className="py-2 px-4 text-right">
                            {category.id === 'accommodation' ? (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleAddAccommodationDay}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-gold hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  新增天數
                                </Button>
                                {accommodationDays > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddRow(category.id)}
                                    disabled={isReadOnly}
                                    className={cn(
                                      "h-6 px-2 text-xs text-morandi-secondary hover:bg-morandi-gold/10",
                                      isReadOnly && "cursor-not-allowed opacity-60"
                                    )}
                                  >
                                    <Plus size={12} className="mr-1" />
                                    新增
                                  </Button>
                                )}
                              </div>
                            ) : category.id === 'group-transport' ? (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddRow(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-gold hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  新增
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddGuideRow(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-secondary hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Users size={12} className="mr-1" />
                                  新增
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddRow(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-gold hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  新增
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>


                        {/* 項目明細行 */}
                        {category.id === 'accommodation' ? (
                          // 住宿特殊渲染：按天分組，每天內顯示各房型
                          (() => {
                            const accommodationItems = category.items.filter(item => item.day !== undefined);
                            const groupedByDay: Record<number, CostItem[]> = {};

                            // 按天分組
                            accommodationItems.forEach(item => {
                              const day = item.day!;
                              if (!groupedByDay[day]) groupedByDay[day] = [];
                              groupedByDay[day].push(item);
                            });

                            return Object.keys(groupedByDay)
                              .sort((a, b) => Number(a) - Number(b))
                              .map(dayStr => {
                                const day = Number(dayStr);
                                const dayItems = groupedByDay[day];

                                return dayItems.map((item, roomIndex) => (
                                  <tr
                                    key={item.id}
                                    className="border-b border-border hover:bg-morandi-container/10 transition-colors"
                                  >
                                    {/* 分類欄：第一個房型顯示天數 */}
                                    <td className="py-2 px-4 text-sm text-morandi-primary text-center table-divider">
                                      {roomIndex === 0 ? `第${day}天` : ''}
                                    </td>

                                    {/* 項目欄：房型名稱 */}
                                    <td className="py-2 px-4 text-sm text-morandi-primary text-center table-divider">
                                      <input
                                        type="text"
                                        value={item.name}
                                        onChange={(e) => handleUpdateItem(category.id, item.id, 'name', e.target.value)}
                                        className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                                        placeholder="房型名稱"
                                      />
                                    </td>

                                    {/* 人數欄 */}
                                    <td className="py-2 px-4 text-sm text-morandi-secondary text-center table-divider">
                                      <input
                                        type="number"
                                        value={item.quantity && item.quantity !== 1 ? item.quantity : ''}
                                        onChange={(e) => handleUpdateItem(category.id, item.id, 'quantity', Number(e.target.value) || 0)}
                                        className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="人數"
                                      />
                                    </td>

                                    {/* 單價欄 */}
                                    <td className="py-2 px-4 text-sm text-morandi-secondary text-center table-divider">
                                      <input
                                        type="number"
                                        value={item.unit_price || ''}
                                        onChange={(e) => handleUpdateItem(category.id, item.id, 'unit_price', Number(e.target.value) || 0)}
                                        className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        placeholder="單價"
                                      />
                                    </td>

                                    {/* 小計欄 */}
                                    <td className="py-2 px-4 text-sm text-morandi-primary text-center font-medium table-divider whitespace-nowrap">
                                      {item.total.toLocaleString()}
                                    </td>


                                    {/* 備註 / 操作合併欄 */}
                                    <td colSpan={2} className="py-2 px-4 text-sm text-morandi-secondary">
                                      <div className="flex items-center justify-between">
                                        <input
                                          type="text"
                                          value={item.note || ''}
                                          onChange={(e) => handleUpdateItem(category.id, item.id, 'note', e.target.value)}
                                          className="flex-1 px-1 py-1 text-sm bg-transparent border-0 focus:outline-none focus:bg-white"
                                          placeholder="備註"
                                        />
                                        <button
                                          onClick={() => handleRemoveItem(category.id, item.id)}
                                          className="ml-2 w-4 h-4 flex items-center justify-center text-xs text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-all flex-shrink-0"
                                          title="刪除"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ));
                              });
                          })()
                        ) : (
                          // 一般分類的渲染
                          category.items.map((item, index) => (
                            <tr
                              key={item.id}
                              className="border-b border-border hover:bg-morandi-container/10 transition-colors"
                            >
                              <td colSpan={2} className={`py-2 px-4 text-sm text-morandi-primary text-center ${(item.quantity && item.quantity !== 1) ? 'table-divider' : ''}`}>
                                {(category.id === 'transport' || category.id === 'activities') ? (
                                  <Combobox
                                    value={item.name}
                                    onChange={(value) => handleUpdateItem(category.id, item.id, 'name', value)}
                                    onSelect={(option) => handleOptionSelect(category.id, item.id, option)}
                                    options={category.id === 'transport' ? regionOptions.transport : regionOptions.activities}
                                    placeholder={category.id === 'transport' ? '選擇交通方式' : '選擇活動項目'}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'name', e.target.value)}
                                    className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-4 text-sm text-morandi-secondary text-center table-divider">
                                <input
                                  type="number"
                                  value={item.quantity && item.quantity !== 1 ? item.quantity : ''}
                                  onChange={(e) => handleUpdateItem(category.id, item.id, 'quantity', Number(e.target.value) || 0)}
                                  className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="py-2 px-4 text-sm text-morandi-secondary text-center table-divider">
                                <input
                                  type="number"
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleUpdateItem(category.id, item.id, 'unit_price', Number(e.target.value) || 0)}
                                  className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                              </td>
                              <td className="py-2 px-4 text-sm text-morandi-primary text-center font-medium table-divider whitespace-nowrap">
                                {item.total.toLocaleString()}
                              </td>


                              {/* 備註 / 操作合併欄 */}
                              <td colSpan={2} className="py-2 px-4 text-sm text-morandi-secondary">
                                <div className="flex items-center justify-between">
                                  <input
                                    type="text"
                                    value={item.note || ''}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'note', e.target.value)}
                                    className="flex-1 px-1 py-1 text-sm bg-transparent border-0 focus:outline-none focus:bg-white"
                                    placeholder="備註"
                                  />
                                  <button
                                    onClick={() => handleRemoveItem(category.id, item.id)}
                                    className="ml-2 w-4 h-4 flex items-center justify-center text-xs text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-all flex-shrink-0"
                                    title="刪除"
                                  >
                                    ×
                                  </button>
                                </div>
                              </td>
                          </tr>
                        )))}


                      </React.Fragment>
                    );
                  })}

                  {/* 總計行 */}
                  <tr className="bg-morandi-gold/10 border-t-2 border-morandi-gold">
                    <td className="py-3 px-4 font-bold text-morandi-primary">總計</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 font-bold text-morandi-primary text-center text-lg whitespace-nowrap">
                      NT$ {totalCost.toLocaleString()}
                    </td>
                    <td colSpan={2} className="py-3 px-4"></td>
                  </tr>
                </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 右側售價顯示區 - 30% */}
          <div className="lg:col-span-3">
            <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm sticky top-6">
              <div className="px-4 py-3 border-b border-border bg-morandi-container/50">
                <h3 className="font-medium text-morandi-primary">價格總覽</h3>
              </div>

              <table className="w-full text-sm">
                <tbody>
                  {/* 非住宿分類 */}
                  {updatedCategories.filter(cat => cat.id !== 'accommodation').map((category) => (
                    <tr key={category.id} className="border-b border-border">
                      <td className="py-2 px-4 text-morandi-secondary">{category.name}</td>
                      <td className="py-2 px-4 text-right text-morandi-primary">
                        {category.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* 住宿分類詳細 */}
                  {accommodationSummary.length > 0 && (
                    <>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-2 px-4 text-morandi-secondary font-medium">住宿</td>
                        <td className="py-2 px-4 text-right text-morandi-primary">
                          {accommodationTotal.toLocaleString()}
                        </td>
                      </tr>
                      {accommodationSummary.map((room, index) => (
                        <tr key={`room-${index}`} className="border-b border-border">
                          <td className="py-1 px-6 text-morandi-muted text-xs">
                            └ {room.name} ({room.days}天總計)
                          </td>
                          <td className="py-1 px-4 text-right text-morandi-secondary text-xs">
                            {room.total_cost.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                    <td className="py-3 px-4 font-medium text-morandi-primary">總成本</td>
                    <td className="py-3 px-4 text-right font-medium text-morandi-primary">
                      {totalCost.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="p-4">
                <Button className="w-full bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                  產生報價單
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}