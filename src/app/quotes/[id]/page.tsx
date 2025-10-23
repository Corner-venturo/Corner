'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useTourStore, useRegionStore } from '@/stores';
import { generateTourCode } from '@/lib/utils';
import { Combobox } from '@/components/ui/combobox';
import { getRegionOptions, type RegionName } from '@/data/region-options';
import { logger } from '@/lib/utils/logger';

interface CostItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  note?: string;
  // 住宿專用：天數和房型數據
  day?: number; // 第幾天
  room_type?: string; // 房型名稱（如：雙人房、三人房）
  // 交通和領隊導遊專用：團體分攤
  is_group_cost?: boolean; // 是否為團體費用
  // 多身份計價：機票專用
  pricing_type?: 'uniform' | 'by_identity'; // uniform: 統一價格, by_identity: 依身份計價
  adult_price?: number; // 成人價
  child_price?: number; // 小朋友價
  infant_price?: number; // 嬰兒價
}

// CostCategory 與 QuoteCategory 結構相同，CostItem 與 QuoteItem 也相同
interface CostCategory {
  id: string;
  name: string;
  items: CostItem[];
  total: number;
}

// Import QuoteItem from store types for type casting
import { QuoteItem } from '@/stores/types';

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
  const { quotes, updateQuote } = useQuotes();
  const { items: tours, create: addTour } = useTourStore();
  const regionStore = useRegionStore();
  const { items: regions } = regionStore;

  const quote_id = params.id as string;
  const quote = quotes.find(q => q.id === quote_id);

  // 檢查是否為特殊團報價單
  const relatedTour = quote?.tour_id ? tours.find(t => t.id === quote.tour_id) : null;
  const isSpecialTour = relatedTour?.status === 'special';
  const isReadOnly = isSpecialTour; // 特殊團報價單設為唯讀

  // 懶載入 regions（只在報價單頁面才載入）
  React.useEffect(() => {
    if (regions.length === 0) {
      regionStore.fetchAll();
    }
  }, [regions.length, regionStore]);

  // 從 regions 取得啟用的國家清單
  const activeCountries = React.useMemo(() => {
    return regions
      .filter(r => r.type === 'country' && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // 根據國家代碼取得城市清單
  const getCitiesByCountryCode = React.useCallback((countryCode: string) => {
    return regions
      .filter(r => r.type === 'city' && r.country_code === countryCode && r.status === 'active' && !r._deleted)
      .map(r => ({ code: r.code, name: r.name }));
  }, [regions]);

  // 從旅遊團的 location 反查國家和城市代碼
  const getCountryAndCityFromLocation = (location: string) => {
    for (const country of activeCountries) {
      const cities = getCitiesByCountryCode(country.code);
      const matchedCity = cities.find(city => city.name === location);
      if (matchedCity) {
        return { countryCode: country.code, cityCode: matchedCity.code };
      }
    }
    return { countryCode: '', cityCode: '' };
  };

  // 國家和城市選擇 state
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (relatedTour) {
      return getCountryAndCityFromLocation(relatedTour.location).countryCode;
    }
    return activeCountries[0]?.code || '';
  });

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    if (relatedTour) {
      return getCountryAndCityFromLocation(relatedTour.location).cityCode;
    }
    const defaultCities = selectedCountry ? getCitiesByCountryCode(selectedCountry) : [];
    return defaultCities[0]?.code || '';
  });

  const [availableCities, setAvailableCities] = useState(() => {
    return selectedCountry ? getCitiesByCountryCode(selectedCountry) : [];
  });

  const [categories, setCategories] = useState<CostCategory[]>(() => {
    const initialCategories = quote?.categories || costCategories;
    // 確保每個分類的總計都正確計算
    return initialCategories.map(cat => ({
      ...cat,
      total: cat.items.reduce((sum, item) => sum + (item.total || 0), 0)
    }));
  });
  const [accommodationDays, setAccommodationDays] = useState<number>(quote?.accommodation_days || 0);

  // 多身份人數統計
  const [participantCounts, setParticipantCounts] = useState<{
    adult: number;          // 成人（雙人房）
    child_with_bed: number; // 小朋友（佔床）
    child_no_bed: number;   // 不佔床
    single_room: number;    // 單人房
    infant: number;         // 嬰兒
  }>((quote as any)?.participant_counts || {
    adult: 1,
    child_with_bed: 0,
    child_no_bed: 0,
    single_room: 0,
    infant: 0
  });

  // 總人數（向下相容）
  const groupSize = participantCounts.adult + participantCounts.child_with_bed +
                    participantCounts.child_no_bed + participantCounts.single_room +
                    participantCounts.infant;

  // 導遊費用分攤人數（不含嬰兒）
  const groupSizeForGuide = participantCounts.adult + participantCounts.child_with_bed +
                            participantCounts.child_no_bed + participantCounts.single_room;

  const [quoteName, setQuoteName] = useState<string>(quote?.name || '');
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);
  const [versionName, setVersionName] = useState<string>('');

  // 多身份售價
  const [sellingPrices, setSellingPrices] = useState<{
    adult: number;
    child_with_bed: number;
    child_no_bed: number;
    single_room: number;
    infant: number;
  }>((quote as any)?.selling_prices || {
    adult: 0,
    child_with_bed: 0,
    child_no_bed: 0,
    single_room: 0,
    infant: 0
  });
  // 舊的 selectedRegion 保留用於 getRegionOptions
  const [selectedRegion, setSelectedRegion] = useState<RegionName>(
    relatedTour?.location as RegionName || '清邁'
  );

  // 如果找不到報價單，返回列表頁（只有在資料已載入時才判斷）
  useEffect(() => {
    // 只有當 quotes 陣列有資料（表示已載入）且找不到對應的 quote 時，才跳轉
    if (quotes.length > 0 && !quote) {
      router.push('/quotes');
    }
  }, [quote, quotes.length, router]);

  // 當國家改變時，更新城市清單
  useEffect(() => {
    if (selectedCountry && !relatedTour) {
      const cities = getCitiesByCountryCode(selectedCountry);
      setAvailableCities(cities);
      if (cities.length > 0) {
        setSelectedCity(cities[0].code);
      }
    }
  }, [selectedCountry, relatedTour]);

  // 當人數改變時，重新計算所有團體分攤項目
  useEffect(() => {
    setCategories(prevCategories => {
      return prevCategories.map(category => {
        if (category.id === 'group-transport' || category.id === 'transport' || category.id === 'guide') {
          const updatedItems = category.items.map(item => {
            const effectiveQuantity = (item.quantity && item.quantity !== 1) ? item.quantity : 1;
            let total = 0;

            if (category.id === 'group-transport') {
              // 團體分攤分類：自動執行團體分攤邏輯
              if (item.name === '領隊分攤') {
                // 領隊分攤：(單價 × 數量) ÷ 人數（不含嬰兒）
                const guideTotalCost = (item.unit_price || 0) * effectiveQuantity;
                total = groupSizeForGuide > 0 ? Math.ceil(guideTotalCost / groupSizeForGuide) : 0;
              } else if (groupSizeForGuide > 1) {
                // 其他團體分攤項目：執行一般團體分攤邏輯（不含嬰兒）
                const total_cost = effectiveQuantity * (item.unit_price || 0);
                total = Math.ceil(total_cost / groupSizeForGuide);
              } else {
                // 人數為1時，不分攤
                total = Math.ceil(effectiveQuantity * (item.unit_price || 0));
              }
            } else if ((category.id === 'transport' || category.id === 'guide') && item.is_group_cost && groupSize > 1) {
              // 交通和領隊導遊的團體分攤邏輯：小計 = (數量 × 單價) ÷ 團體人數
              const total_cost = effectiveQuantity * (item.unit_price || 0);
              total = Math.ceil(total_cost / groupSize);
            } else {
              // 維持原有的 total 值
              total = item.total || 0;
            }

            return { ...item, total };
          });

          const categoryTotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
          return { ...category, items: updatedItems, total: categoryTotal };
        }
        return category;
      });
    });
  }, [participantCounts, groupSize, groupSizeForGuide]); // 監聽人數變化

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

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
    if (category_id === 'accommodation') {
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
      if (cat.id === category_id) {
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
    const totalGuideCost = calculateGuideWithCategories(categories);

    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '領隊分攤',
      quantity: 1,
      unit_price: totalGuideCost,
      total: groupSizeForGuide > 0 ? Math.ceil(totalGuideCost / groupSizeForGuide) : 0,
      note: '自動計算：住宿第一房型 + 成人機票'
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === category_id) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  };

  // 新增成人機票
  const handleAddAdultTicket = (category_id: string) => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '成人機票',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      pricing_type: 'by_identity',
      adult_price: 0
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === category_id) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  };

  // 新增小孩機票
  const handleAddChildTicket = (category_id: string) => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '小孩機票',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      pricing_type: 'by_identity',
      child_price: 0
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === category_id) {
        return {
          ...cat,
          items: [...cat.items, newItem]
        };
      }
      return cat;
    }));
  };

  // 新增嬰兒機票
  const handleAddInfantTicket = (category_id: string) => {
    const newItem: CostItem = {
      id: Date.now().toString(),
      name: '嬰兒機票',
      quantity: 0,
      unit_price: 0,
      total: 0,
      note: '',
      pricing_type: 'by_identity',
      infant_price: 0
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id === category_id) {
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
        if (cat.id === category_id) {
          const updatedItems = cat.items.map(item => {
            if (item.id === itemId) {
              const updatedItem = { ...item, [field]: value };
              // 自動計算總價
              if (field === 'quantity' || field === 'unit_price' || field === 'is_group_cost' || field === 'adult_price' || field === 'child_price' || field === 'infant_price') {
                // 數量預設為 1，只有當用戶輸入時才使用輸入值
                const effectiveQuantity = updatedItem.quantity === 0 ? 1 : (updatedItem.quantity || 1);

                // 成人、小孩、嬰兒機票：顯示對應票價在小計欄位
                if (updatedItem.name === '成人機票') {
                  updatedItem.total = updatedItem.adult_price || 0;
                } else if (updatedItem.name === '小孩機票') {
                  updatedItem.total = updatedItem.child_price || 0;
                } else if (updatedItem.name === '嬰兒機票') {
                  updatedItem.total = updatedItem.infant_price || 0;
                }
                else if (category_id === 'accommodation') {
                  // 住宿特殊邏輯：小計 = 單價 ÷ 人數
                  updatedItem.total = effectiveQuantity > 0 ? Math.ceil((updatedItem.unit_price || 0) / effectiveQuantity) : 0;
                } else if ((category_id === 'transport' || category_id === 'guide') && updatedItem.is_group_cost && groupSize > 1) {
                  // 交通和領隊導遊的團體分攤邏輯：小計 = (數量 × 單價) ÷ 團體人數
                  const total_cost = effectiveQuantity * (updatedItem.unit_price || 0);
                  updatedItem.total = Math.ceil(total_cost / groupSize);
                } else if (category_id === 'group-transport') {
                  // 團體分攤分類：自動執行團體分攤邏輯
                  if (updatedItem.name === '領隊分攤') {
                    // 領隊分攤：(單價 × 數量) ÷ 人數（不含嬰兒）
                    const guideTotalCost = (updatedItem.unit_price || 0) * effectiveQuantity;
                    updatedItem.total = groupSizeForGuide > 0 ? Math.ceil(guideTotalCost / groupSizeForGuide) : 0;
                  } else if (groupSizeForGuide > 1) {
                    // 其他團體分攤項目：執行一般團體分攤邏輯（不含嬰兒）
                    const total_cost = effectiveQuantity * (updatedItem.unit_price || 0);
                    updatedItem.total = Math.ceil(total_cost / groupSizeForGuide);
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
      if (category_id === 'accommodation' || category_id === 'transport') {
        return updateGuideItems(newCategories);
      }

      return newCategories;
    });
  };

  // 更新所有領隊分攤項目
  const updateGuideItems = (categories: CostCategory[]) => {
    // 重新計算領隊費用
    const totalGuideCost = calculateGuideWithCategories(categories);

    return categories.map(cat => {
      if (cat.id === 'group-transport') {
        const updatedItems = cat.items.map(item => {
          if (item.name === '領隊分攤') {
            const effectiveQuantity = (item.quantity && item.quantity !== 1) ? item.quantity : 1;
            return {
              ...item,
              unit_price: totalGuideCost,
              total: groupSizeForGuide > 0 ? Math.ceil(totalGuideCost * effectiveQuantity / groupSizeForGuide) : 0
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

    // 2. 計算成人機票費用
    const transportCategory = categories.find(cat => cat.id === 'transport');
    let adultTicketCost = 0;

    if (transportCategory && transportCategory.items.length > 0) {
      const adultTicket = transportCategory.items.find(item => item.name === '成人機票');
      if (adultTicket) {
        adultTicketCost = adultTicket.adult_price || 0;
      }
    }

    // 3. 領隊總成本 = 住宿第一房型總和 + 成人機票費用（不除法）
    const totalGuideCost = dailyFirstRoomCost + adultTicketCost;

    return totalGuideCost;
  };


  const handleRemoveItem = useCallback((category_id: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === category_id) {
        const updatedItems = cat.items.filter(item => item.id !== itemId);

        // 如果是住宿類別，需要重新計算天數並重新編號
        if (category_id === 'accommodation' && updatedItems.length > 0) {
          // 取得所有唯一的天數
          const uniqueDays = Array.from(new Set(updatedItems.map(item => item.day).filter(d => d !== undefined)));
          uniqueDays.sort((a, b) => a! - b!);

          // 重新編號天數（從 1 開始）
          const reorderedItems = updatedItems.map(item => {
            const oldDay = item.day;
            const newDay = uniqueDays.findIndex(d => d === oldDay) + 1;
            return {
              ...item,
              day: newDay
            };
          });

          // 更新 accommodationDays 為實際天數
          const actualDays = Math.max(...reorderedItems.map(item => item.day || 0));
          setAccommodationDays(actualDays);

          return {
            ...cat,
            items: reorderedItems,
            total: reorderedItems.reduce((sum, item) => sum + item.total, 0)
          };
        }

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
      item_count: groupCostItems.length
    };
  }, [categories, groupSize]);

  // 計算領隊分攤金額
  const guideCostPerPerson = useMemo(() => {
    const totalGuideCost = calculateGuideWithCategories(categories);
    return groupSizeForGuide > 0 ? Math.ceil(totalGuideCost / groupSizeForGuide) : 0;
  }, [categories, groupSizeForGuide]);

  // 處理下拉選單項目選擇
  const handleOptionSelect = (category_id: string, itemId: string, option: any) => {
    // 更新項目名稱
    handleUpdateItem(category_id, itemId, 'name', option.name);

    // 根據選項類型設定價格和團體分攤狀態
    if (option.pricePerGroup && option.is_group_cost) {
      // 團體費用
      handleUpdateItem(category_id, itemId, 'unit_price', option.pricePerGroup);
      handleUpdateItem(category_id, itemId, 'is_group_cost', true);
    } else if (option.price_per_person) {
      // 個人費用
      handleUpdateItem(category_id, itemId, 'unit_price', option.price_per_person);
      handleUpdateItem(category_id, itemId, 'is_group_cost', false);
    } else if (option.adultPrice !== undefined) {
      // 活動門票 (使用成人價格)
      handleUpdateItem(category_id, itemId, 'unit_price', option.adultPrice);
      handleUpdateItem(category_id, itemId, 'is_group_cost', false);
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
      let total_cost = 0;
      let roomTypeName = '';
      let validDays = 0;

      days.forEach(day => {
        const dayItems = groupedByDay[day];
        if (dayItems[roomIndex]) {
          total_cost += dayItems[roomIndex].total;
          validDays++;
          if (!roomTypeName && dayItems[roomIndex].name) {
            roomTypeName = dayItems[roomIndex].name;
          }
        }
      });

      if (validDays > 0) {
        roomTypeSummaries.push({
          name: roomTypeName || `房型${roomIndex + 1}`,
          total_cost,
          averageCost: total_cost / validDays,
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

  // 計算各身份的總成本
  const identityCosts = useMemo(() => {
    const costs = {
      adult: 0,
      child_with_bed: 0,
      child_no_bed: 0,
      single_room: 0,
      infant: 0
    };

    updatedCategories.forEach(category => {
      category.items.forEach(item => {
        if (category.id === 'transport') {
          // 交通類別：依照項目名稱區分身份
          if (item.name === '成人機票') {
            // 成人機票：只加給成人和單人房
            costs.adult += (item.adult_price || 0);
            costs.single_room += (item.adult_price || 0);
          } else if (item.name === '小孩機票') {
            // 小孩機票：只加給小孩（佔床、不佔床）
            costs.child_with_bed += (item.child_price || 0);
            costs.child_no_bed += (item.child_price || 0);
          } else if (item.name === '嬰兒機票') {
            // 嬰兒機票：只加給嬰兒
            costs.infant += (item.infant_price || 0);
          } else {
            // 其他交通費用（遊覽車等統一價）：成人、小孩佔床、單人房
            const itemCost = item.unit_price || 0;
            costs.adult += itemCost;
            costs.child_with_bed += itemCost;
            costs.single_room += itemCost;
            // 不佔床和嬰兒不含一般交通
          }
        } else if (category.id === 'accommodation') {
          // 住宿：成人和小朋友佔床是÷2，單人房是全額
          const roomPrice = item.unit_price || 0;
          costs.adult += Math.ceil(roomPrice / 2);
          costs.child_with_bed += Math.ceil(roomPrice / 2);
          // 不佔床不含住宿
          costs.single_room += roomPrice; // 單人房全額
          // 嬰兒不含住宿
        } else if (category.id === 'meals' || category.id === 'activities' || category.id === 'others') {
          // 餐飲、活動、其他：成人、小朋友佔床、單人房有，不佔床和嬰兒沒有
          const itemCost = item.unit_price || 0;
          costs.adult += itemCost;
          costs.child_with_bed += itemCost;
          // 不佔床不含餐飲和活動
          costs.single_room += itemCost;
          // 嬰兒不含餐飲和活動
        } else if (category.id === 'group-transport' || category.id === 'guide') {
          // 團體分攤、領隊導遊：不含嬰兒的身份分攤
          const itemCost = item.total || 0;
          costs.adult += itemCost;
          costs.child_with_bed += itemCost;
          costs.child_no_bed += itemCost;
          costs.single_room += itemCost;
          // 嬰兒不分攤導遊費用
        }
      });
    });

    return costs;
  }, [updatedCategories]);

  // 計算總成本（每個身份成本 × 人數）
  const total_cost = useMemo(() =>
    identityCosts.adult * participantCounts.adult +
    identityCosts.child_with_bed * participantCounts.child_with_bed +
    identityCosts.child_no_bed * participantCounts.child_no_bed +
    identityCosts.single_room * participantCounts.single_room +
    identityCosts.infant * participantCounts.infant
  , [identityCosts, participantCounts]);

  // 計算各身份的利潤
  const identityProfits = useMemo(() => ({
    adult: sellingPrices.adult - identityCosts.adult,
    child_with_bed: sellingPrices.child_with_bed - identityCosts.child_with_bed,
    child_no_bed: sellingPrices.child_no_bed - identityCosts.child_no_bed,
    single_room: sellingPrices.single_room - identityCosts.single_room,
    infant: sellingPrices.infant - identityCosts.infant
  }), [sellingPrices, identityCosts]);

  // 保存版本
  const handleSaveVersion = useCallback((note?: string) => {
    if (!quote) return;

    try {
      // 創建新的版本記錄
      const currentVersion = quote.version || 1;
      const newVersionRecord = {
        id: Date.now().toString(),
        version: currentVersion,
        categories: updatedCategories,
        total_cost,
        group_size: groupSize,
        accommodation_days: accommodationDays,
        participant_counts: participantCounts,
        selling_prices: sellingPrices,
        note: note || versionName || `版本 ${currentVersion}`,
        created_at: new Date().toISOString()
      };

      // 取得現有的版本歷史
      const existingVersions = quote.versions || [];

      // 更新報價單：增加版本號，將當前狀態加入版本歷史
      updateQuote(quote.id, {
        categories: updatedCategories as any,
        total_cost,
        group_size: groupSize,
        name: quoteName,
        accommodation_days: accommodationDays,
        participant_counts: participantCounts,
        selling_prices: sellingPrices,
        version: currentVersion + 1, // 版本號 +1
        versions: [...existingVersions, newVersionRecord] as any // 加入新版本到歷史
      } as any);

      // 顯示成功提示
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      logger.error('保存版本失敗:', error);
    }
  }, [quote, updatedCategories, total_cost, groupSize, quoteName, accommodationDays, participantCounts, sellingPrices, versionName, updateQuote]);

  // 載入特定版本
  const handleLoadVersion = useCallback((versionData: any) => {
    setCategories(versionData.categories);
    setAccommodationDays(versionData.accommodation_days || 0);
    if (versionData.participant_counts) {
      setParticipantCounts(versionData.participant_counts);
    }
    if (versionData.selling_prices) {
      setSellingPrices(versionData.selling_prices);
    }
    // 版本切換不改變基本資訊（名稱、狀態等），只改變費用結構和人數
  }, []);

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
      status: 'approved',
      categories: updatedCategories as any, // CostCategory[] 與 QuoteCategory[] 結構相同
      total_cost,
      group_size: groupSize,
      name: quoteName,
      accommodation_days: accommodationDays,
      participant_counts: participantCounts,
      selling_prices: sellingPrices
    } as any);

    // 自動跳轉到旅遊團新增頁面，並帶上報價單ID
    router.push(`/tours?fromQuote=${quote.id}`);
  };

  // 開旅遊團
  const handleCreateTour = async () => {
    if (!quote) return;

    // 先保存目前的報價單狀態
    handleSaveVersion('轉為旅遊團前的版本');

    // 更新報價單狀態為最終版本
    updateQuote(quote.id, { status: 'approved' });

    // 創建旅遊團（使用報價單選擇的城市）
    const departure_date = new Date();
    departure_date.setDate(departure_date.getDate() + 30); // 預設30天後出發
    const return_date = new Date(departure_date);
    return_date.setDate(return_date.getDate() + 5); // 預設5天行程

    // 取得選擇的城市名稱
    const selectedCityObj = availableCities.find(c => c.code === selectedCity);
    const cityName = selectedCityObj?.name || selectedCity;

    // 從選擇的地區生成團號
    const tourCode = generateTourCode(selectedCity, departure_date, false);

    const newTour = await addTour({
      name: quoteName,
      location: cityName, // 使用城市名稱
      departure_date: departure_date.toISOString().split('T')[0],
      return_date: return_date.toISOString().split('T')[0],
      price: Math.round(total_cost / groupSize), // 每人單價
      status: '提案',
      code: tourCode,
      contract_status: '未簽署',
      total_revenue: 0,
      total_cost: total_cost,
      profit: 0,
    } as any);

    // 更新報價單的 tour_id
    if (newTour?.id) {
      await updateQuote(quote.id, { tour_id: newTour.id });
    }

    // 跳轉到旅遊團管理頁面，並高亮新建的團
    router.push(`/tours?highlight=${newTour?.id}`);
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

          {/* 顯示編號 */}
          <div className="text-sm font-mono text-morandi-secondary">
            {relatedTour ? (
              <span className="text-morandi-gold" title="旅遊團編號">
                {relatedTour.code || '-'}
              </span>
            ) : (
              <span>
                {(quote as any)?.code || '-'}
              </span>
            )}
          </div>

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
            {relatedTour ? (
              // 有關聯旅遊團：顯示旅遊團地區（唯讀）
              <input
                type="text"
                value={relatedTour.location}
                readOnly
                className="px-2 py-1 text-sm border border-border rounded bg-morandi-container/30 text-morandi-secondary cursor-not-allowed"
                title="從旅遊團自動帶入"
              />
            ) : (
              // 沒有關聯旅遊團：可選擇地區
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as RegionName)}
                disabled={isReadOnly}
                className={cn(
                  "px-2 py-1 text-sm border border-border rounded bg-background text-morandi-primary",
                  isReadOnly && "cursor-not-allowed opacity-60"
                )}
              >
                <option value="清邁">清邁</option>
                <option value="曼谷">曼谷</option>
                <option value="東京">東京</option>
              </select>
            )}
          </div>

          {/* 人數統計 - 5個身份 */}
          <div className="flex items-center space-x-2 whitespace-nowrap text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">成人:</span>
              <input
                type="number"
                value={participantCounts.adult}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, adult: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">小孩:</span>
              <input
                type="number"
                value={participantCounts.child_with_bed}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, child_with_bed: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">不佔床:</span>
              <input
                type="number"
                value={participantCounts.child_no_bed}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, child_no_bed: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">單人房:</span>
              <input
                type="number"
                value={participantCounts.single_room}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, single_room: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-morandi-secondary">嬰兒:</span>
              <input
                type="number"
                value={participantCounts.infant}
                onChange={(e) => setParticipantCounts(prev => ({ ...prev, infant: Number(e.target.value) || 0 }))}
                disabled={isReadOnly}
                className={cn("w-12 px-1 py-1 text-xs text-center border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center space-x-1 whitespace-nowrap">
            <span className="text-sm text-morandi-secondary">狀態:</span>
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded text-sm font-medium',
              quote && quote.status === 'proposed'
                ? 'bg-morandi-gold text-white'
                : 'bg-morandi-green text-white'
            )}>
              {quote?.status === 'proposed' ? '提案' : quote?.status === 'approved' ? '已核准' : quote?.status || '提案'}
            </span>
          </div>

          <Button
            onClick={() => setIsSaveDialogOpen(true)}
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
            <DropdownMenuTrigger
              disabled={isReadOnly}
              className={cn(
                "h-8 px-3 text-sm border-morandi-container text-morandi-secondary hover:bg-morandi-container",
                isReadOnly && "cursor-not-allowed opacity-60"
              )}
            >
              <History size={14} className="mr-1.5" />
              版本 {quote?.version || 1}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
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
                          <span className="font-medium">{version.note || `版本 ${version.version}`}</span>
                          <span className="text-xs text-morandi-secondary">
                            {formatDateTime(version.created_at)}
                          </span>
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

          {quote && quote.status === 'proposed' && (
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

          {quote && quote.status === 'approved' && (
            relatedTour ? (
              // 已有關聯旅遊團：前往該旅遊團
              <Button
                onClick={() => router.push(`/tours?highlight=${relatedTour.id}`)}
                className="h-8 px-3 text-sm bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plane size={14} className="mr-1.5" />
                前往旅遊團
              </Button>
            ) : (
              // 沒有關聯旅遊團：建立新旅遊團
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
            )
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
                    <th className="text-left py-3 px-4 text-sm font-medium text-morandi-secondary w-12 table-divider">分類</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-70 table-divider">項目</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-morandi-secondary w-8 table-divider">數量</th>
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
                            ) : category.id === 'transport' ? (
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddAdultTicket(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-gold hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  成人機票
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddChildTicket(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-secondary hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  小孩機票
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddInfantTicket(category.id)}
                                  disabled={isReadOnly}
                                  className={cn(
                                    "h-6 px-2 text-xs text-morandi-secondary hover:bg-morandi-gold/10",
                                    isReadOnly && "cursor-not-allowed opacity-60"
                                  )}
                                >
                                  <Plus size={12} className="mr-1" />
                                  嬰兒機票
                                </Button>
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
                                  其他
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
                                      {roomIndex === 0 ? `DAY${day}` : ''}
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
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItem(category.id, item.id, 'name', e.target.value)}
                                  className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white"
                                  placeholder="輸入項目名稱"
                                />
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
                                {item.name === '成人機票' ? (
                                  <input
                                    type="number"
                                    value={item.adult_price || ''}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'adult_price', Number(e.target.value) || 0)}
                                    className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="成人票價"
                                  />
                                ) : item.name === '小孩機票' ? (
                                  <input
                                    type="number"
                                    value={item.child_price || ''}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'child_price', Number(e.target.value) || 0)}
                                    className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="小孩票價"
                                  />
                                ) : item.name === '嬰兒機票' ? (
                                  <input
                                    type="number"
                                    value={item.infant_price || ''}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'infant_price', Number(e.target.value) || 0)}
                                    className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="嬰兒票價"
                                  />
                                ) : (
                                  <input
                                    type="number"
                                    value={item.unit_price || ''}
                                    onChange={(e) => handleUpdateItem(category.id, item.id, 'unit_price', Number(e.target.value) || 0)}
                                    className="w-full px-1 py-1 text-sm text-center bg-transparent border-0 focus:outline-none focus:bg-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                )}
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

                  {/* 總計行 - 顯示各身份成本 */}
                  <tr className="bg-morandi-gold/10 border-t-2 border-morandi-gold">
                    <td colSpan={2} className="py-3 px-4 font-bold text-morandi-primary">身份成本</td>
                    <td colSpan={5} className="py-3 px-4">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {participantCounts.adult > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-morandi-secondary">成人:</span>
                            <span className="font-bold text-morandi-primary">
                              NT$ {identityCosts.adult.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {participantCounts.child_with_bed > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-morandi-secondary">小孩:</span>
                            <span className="font-bold text-morandi-primary">
                              NT$ {identityCosts.child_with_bed.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {participantCounts.child_no_bed > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-morandi-secondary">不佔床:</span>
                            <span className="font-bold text-morandi-primary">
                              NT$ {identityCosts.child_no_bed.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {participantCounts.single_room > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-morandi-secondary">單人房:</span>
                            <span className="font-bold text-morandi-primary">
                              NT$ {identityCosts.single_room.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {participantCounts.infant > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-morandi-secondary">嬰兒:</span>
                            <span className="font-bold text-morandi-primary">
                              NT$ {identityCosts.infant.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
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

              <table className="w-full text-xs">
                <tbody>
                  {/* 成人 */}
                  {participantCounts.adult > 0 && (
                    <>
                      <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                        <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                          成人 ({participantCounts.adult}人)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">成本</td>
                        <td className="py-1 px-4 text-right text-morandi-primary">
                          {identityCosts.adult.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">售價</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="number"
                            value={sellingPrices.adult || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, adult: Number(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                        <td className={cn("py-1 px-4 text-right font-medium", identityProfits.adult >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                          {identityProfits.adult.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 小朋友（佔床） */}
                  {participantCounts.child_with_bed > 0 && (
                    <>
                      <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                        <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                          小朋友（佔床） ({participantCounts.child_with_bed}人)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">成本</td>
                        <td className="py-1 px-4 text-right text-morandi-primary">
                          {identityCosts.child_with_bed.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">售價</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="number"
                            value={sellingPrices.child_with_bed || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, child_with_bed: Number(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                        <td className={cn("py-1 px-4 text-right font-medium", identityProfits.child_with_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                          {identityProfits.child_with_bed.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 不佔床 */}
                  {participantCounts.child_no_bed > 0 && (
                    <>
                      <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                        <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                          不佔床 ({participantCounts.child_no_bed}人)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">成本</td>
                        <td className="py-1 px-4 text-right text-morandi-primary">
                          {identityCosts.child_no_bed.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">售價</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="number"
                            value={sellingPrices.child_no_bed || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, child_no_bed: Number(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                        <td className={cn("py-1 px-4 text-right font-medium", identityProfits.child_no_bed >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                          {identityProfits.child_no_bed.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 單人房 */}
                  {participantCounts.single_room > 0 && (
                    <>
                      <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                        <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                          單人房 ({participantCounts.single_room}人)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">成本</td>
                        <td className="py-1 px-4 text-right text-morandi-primary">
                          {identityCosts.single_room.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">售價</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="number"
                            value={sellingPrices.single_room || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, single_room: Number(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                        <td className={cn("py-1 px-4 text-right font-medium", identityProfits.single_room >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                          {identityProfits.single_room.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}

                  {/* 嬰兒 */}
                  {participantCounts.infant > 0 && (
                    <>
                      <tr className="border-b-2 border-morandi-gold bg-morandi-container/20">
                        <td colSpan={2} className="py-2 px-4 font-medium text-morandi-primary">
                          嬰兒 ({participantCounts.infant}人)
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">成本</td>
                        <td className="py-1 px-4 text-right text-morandi-primary">
                          {identityCosts.infant.toLocaleString()}
                        </td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-1 px-4 text-morandi-secondary">售價</td>
                        <td className="py-1 px-4 text-right">
                          <input
                            type="number"
                            value={sellingPrices.infant || ''}
                            onChange={(e) => setSellingPrices(prev => ({ ...prev, infant: Number(e.target.value) || 0 }))}
                            disabled={isReadOnly}
                            className={cn("w-full px-2 py-1 text-xs text-right border border-border rounded", isReadOnly && "cursor-not-allowed opacity-60")}
                          />
                        </td>
                      </tr>
                      <tr className="border-b border-border bg-morandi-container/10">
                        <td className="py-1 px-4 text-morandi-secondary">利潤</td>
                        <td className={cn("py-1 px-4 text-right font-medium", identityProfits.infant >= 0 ? "text-morandi-green" : "text-morandi-red")}>
                          {identityProfits.infant.toLocaleString()}
                        </td>
                      </tr>
                    </>
                  )}
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

      {/* 保存版本對話框 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>保存版本</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveVersion(versionName);
              setIsSaveDialogOpen(false);
              setVersionName('');
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-morandi-primary">版本名稱</label>
              <Input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="例如：初版、修正版、最終版等"
                className="mt-1"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSaveDialogOpen(false);
                  setVersionName('');
                }}
              >
                取消
              </Button>
              <Button
                type="submit"
                className="bg-morandi-green hover:bg-morandi-green-hover text-white"
              >
                保存 <span className="ml-1 text-xs opacity-70">(Enter)</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}