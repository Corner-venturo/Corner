'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapPin,  Trash2, Power, ChevronRight, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {} from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
import { ResponsiveHeader } from '@/components/layout/responsive-header';

import { cn } from '@/lib/utils';
import { DESTINATIONS } from '@/constants/destinations';
import { useRegionStore } from '@/stores';
import type { Region } from '@/types';

export default function RegionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const { items: regions, create, update, delete: deleteRegion } = useRegionStore();

  // 初始化：如果沒有資料，從 DESTINATIONS 匯入
  useEffect(() => {
    const initializeRegions = async () => {
      // 檢查是否已經初始化過（使用 localStorage 標記）
      const initialized = localStorage.getItem('regions_initialized');
      if (initialized === 'true') {
        console.log('📍 地區資料已初始化，跳過');
        return;
      }

      // 再次檢查 store 中是否已有資料（防止重複初始化）
      if (regions.length > 0) {
        console.log('📍 地區資料已存在，標記為已初始化');
        localStorage.setItem('regions_initialized', 'true');
        return;
      }

      console.log('📍 初始化地區資料...');

      try {
        for (const [countryCode, destination] of Object.entries(DESTINATIONS)) {
          // 添加國家
          await create({
            type: 'country',
            name: destination.name,
            code: countryCode,
            status: 'active'
          } as unknown);

          // 添加城市
          for (const city of destination.cities) {
            await create({
              type: 'city',
              name: city.name,
              code: city.code,
              status: 'active',
              country_code: countryCode
            } as unknown);
          }
        }

        // 標記為已初始化
        localStorage.setItem('regions_initialized', 'true');
        console.log('✅ 地區資料初始化完成');
      } catch (error) {
        console.error('❌ 地區資料初始化失敗:', error);
        // 不標記為已初始化，下次可以重試
      }
    };

    // 延遲執行，確保 store 已載入
    const timer = setTimeout(initializeRegions, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只執行一次 - 刻意忽略 create 和 regions.length，避免無限循環

  // 切換國家展開/收起
  const toggleCountry = (countryCode: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryCode)) {
        newSet.delete(countryCode);
      } else {
        newSet.add(countryCode);
      }
      return newSet;
    });
  };

  // 停用/啟用
  const toggleStatus = async (id: string) => {
    const region = regions.find(r => r.id === id);
    if (!region) return;

    await update(id, {
      status: region.status === 'active' ? 'inactive' : 'active'
    });
  };

  // 刪除
  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除嗎？')) {
      await deleteRegion(id);
    }
  };

  // 過濾和組織資料
  const { countries, cities } = useMemo(() => {
    const countryList = regions.filter(r => r.type === 'country');
    const cityList = regions.filter(r => r.type === 'city');

    return {
      countries: countryList.filter(country =>
        !searchTerm ||
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      cities: cityList
    };
  }, [regions, searchTerm]);

  // 獲取國家的城市列表
  const getCities = (countryCode: string) => {
    return cities.filter(city =>
      city.country_code === countryCode &&
      (!searchTerm ||
        city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="地區管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '地區管理', href: '/database/regions' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋國家或城市..."
      />

      <div className="flex-1 overflow-auto">
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {/* 表格標題 */}
          <div className="bg-morandi-container/30 border-b border-border">
            <div className="flex items-center px-4 py-3">
              <div className="flex-1 text-sm font-medium text-morandi-secondary">國家/城市</div>
              <div className="w-32 text-sm font-medium text-morandi-secondary">代碼</div>
              <div className="w-24 text-sm font-medium text-morandi-secondary">狀態</div>
              <div className="w-32 text-sm font-medium text-morandi-secondary text-right">操作</div>
            </div>
          </div>

          {/* 表格內容 */}
          <div>
            {countries.length === 0 ? (
              <div className="text-center py-12 text-morandi-secondary">
                <MapPin size={48} className="mx-auto mb-4 opacity-50" />
                <p>無符合條件的地區</p>
              </div>
            ) : (
              countries.map((country) => {
                const isExpanded = expandedCountries.has(country.code);
                const countryCities = getCities(country.code);

                return (
                  <div key={country.id}>
                    {/* 國家行 */}
                    <div className="border-b border-border hover:bg-morandi-container/20 transition-colors">
                      <div className="flex items-center px-4 py-3">
                        <div className="flex-1 flex items-center">
                          {/* 展開/收起按鈕 */}
                          <button
                            onClick={() => toggleCountry(country.code)}
                            className="mr-2 p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} className="text-morandi-gold" />
                            ) : (
                              <ChevronRight size={16} className="text-morandi-secondary" />
                            )}
                          </button>

                          <MapPin size={16} className="mr-2 text-morandi-gold" />
                          <span className="font-semibold text-morandi-primary">{country.name}</span>
                          <span className="ml-2 text-xs text-morandi-muted">
                            ({countryCities.length} 個城市)
                          </span>
                        </div>

                        <div className="w-32 text-morandi-secondary font-mono">{country.code}</div>

                        <div className="w-24">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            country.status === 'active'
                              ? 'bg-morandi-green text-white'
                              : 'bg-morandi-container text-morandi-secondary'
                          )}>
                            {country.status === 'active' ? '啟用' : '停用'}
                          </span>
                        </div>

                        <div className="w-32 flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleStatus(country.id)}
                            className="p-1 rounded transition-colors hover:bg-morandi-container/30"
                            title={country.status === 'active' ? '停用' : '啟用'}
                          >
                            <Power size={14} className={
                              country.status === 'active' ? 'text-morandi-green' : 'text-morandi-secondary'
                            } />
                          </button>
                          <button
                            onClick={() => handleDelete(country.id)}
                            className="p-1 text-morandi-secondary hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
                            title="刪除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 城市列表（展開時顯示） */}
                    {isExpanded && countryCities.length > 0 && (
                      <div className="bg-morandi-container/5">
                        {countryCities.map((city) => (
                          <div
                            key={city.id}
                            className="border-b border-border/50 hover:bg-morandi-container/20 transition-colors"
                          >
                            <div className="flex items-center px-4 py-2.5 pl-14">
                              <div className="flex-1 flex items-center">
                                <div className="w-1 h-1 rounded-full bg-morandi-gold mr-3"></div>
                                <span className="text-morandi-primary">{city.name}</span>
                              </div>

                              <div className="w-32 text-morandi-secondary font-mono text-sm">{city.code}</div>

                              <div className="w-24">
                                <span className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                  city.status === 'active'
                                    ? 'bg-morandi-green/80 text-white'
                                    : 'bg-morandi-container text-morandi-secondary'
                                )}>
                                  {city.status === 'active' ? '啟用' : '停用'}
                                </span>
                              </div>

                              <div className="w-32 flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleStatus(city.id)}
                                  className="h-10 w-10 p-0"
                                  title={city.status === 'active' ? '停用' : '啟用'}
                                >
                                  <Power size={12} className={
                                    city.status === 'active' ? 'text-morandi-green' : 'text-morandi-secondary'
                                  } />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(city.id)}
                                  className="h-10 w-10 p-0 hover:text-morandi-red"
                                  title="刪除"
                                >
                                  <Trash2 size={12} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
