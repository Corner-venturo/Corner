'use client';

import { useState, useEffect } from 'react';
import { MapPin, Trash2, Power, ChevronRight, ChevronDown, Plus, Edit2, Eye, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { cn } from '@/lib/utils';
import { useRegionStoreNew } from '@/stores';
import type { Country, City } from '@/stores';
import { EditCityImageDialog } from './EditCityImageDialog';

type SortField = 'name' | 'airport_code' | 'display_order';
type SortDirection = 'asc' | 'desc';

export default function RegionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('display_order');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Dialogs
  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
  const [isAddRegionOpen, setIsAddRegionOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [isEditImageOpen, setIsEditImageOpen] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const {
    countries,
    regions,
    cities,
    loading,
    fetchAll,
    createCountry,
    createRegion,
    createCity,
    updateCountry,
    updateRegion,
    updateCity,
    deleteCountry,
    deleteRegion,
    deleteCity,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionStoreNew();

  // 載入資料
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 切換展開/收起
  const toggleCountry = (countryId: string) => {
    setExpandedCountries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(countryId)) {
        newSet.delete(countryId);
      } else {
        newSet.add(countryId);
      }
      return newSet;
    });
  };

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionId)) {
        newSet.delete(regionId);
      } else {
        newSet.add(regionId);
      }
      return newSet;
    });
  };

  // 停用/啟用
  const toggleCountryStatus = async (country: Country) => {
    await updateCountry(country.id, {
      is_active: !country.is_active
    });
  };

  const toggleCityStatus = async (city: City) => {
    await updateCity(city.id, {
      is_active: !city.is_active
    });
  };

  // 刪除
  const handleDeleteCountry = async (id: string) => {
    if (confirm('確定要刪除此國家？這將同時刪除所有關聯的地區和城市。')) {
      await deleteCountry(id);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (confirm('確定要刪除此地區？這將同時刪除所有關聯的城市。')) {
      await deleteRegion(id);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm('確定要刪除此城市？')) {
      await deleteCity(id);
    }
  };

  // 排序切換函數
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果點擊同一欄位，切換方向
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果點擊不同欄位，設為升序
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序指示器組件
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-morandi-gold">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // 排序城市
  const sortCities = (cities: City[]) => {
    return [...cities].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-TW');
          break;
        case 'airport_code':
          const codeA = a.airport_code || '';
          const codeB = b.airport_code || '';
          comparison = codeA.localeCompare(codeB);
          break;
        case 'display_order':
          comparison = (a.display_order || 0) - (b.display_order || 0);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // 過濾資料
  const filteredCountries = countries.filter(country =>
    !searchTerm ||
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        searchPlaceholder="搜尋國家、地區或城市..."
        onAdd={() => setIsAddCountryOpen(true)}
        addLabel="新增國家"
      />

      <div className="flex-1 overflow-auto">
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-full flex flex-col">
          {/* 表格標題行 */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
            <div className="flex items-center px-4 py-3">
              {/* 展開按鈕佔位 */}
              <div className="w-6"></div>
              {/* 國家 */}
              <div className="w-48 text-sm font-medium text-morandi-primary ml-2">國家</div>
              {/* 地區 */}
              <div className="w-48 text-sm font-medium text-morandi-primary">地區</div>
              {/* 城市 */}
              <button
                onClick={() => handleSort('name')}
                className="w-48 text-sm font-medium text-morandi-primary text-left hover:text-morandi-gold transition-colors cursor-pointer"
              >
                城市 <SortIndicator field="name" />
              </button>
              {/* 機場代碼 */}
              <button
                onClick={() => handleSort('airport_code')}
                className="w-32 text-sm font-medium text-morandi-primary text-left hover:text-morandi-gold transition-colors cursor-pointer"
              >
                機場代碼 <SortIndicator field="airport_code" />
              </button>
              {/* 城市圖片 */}
              <div className="w-32 text-sm font-medium text-morandi-primary text-center">城市圖片</div>
              <div className="flex-1"></div>
              <div className="w-24 text-sm font-medium text-morandi-primary text-center">狀態</div>
              <div className="w-40 text-sm font-medium text-morandi-primary text-center">操作</div>
            </div>
          </div>

          {/* 載入中 */}
          {loading && (
            <div className="text-center py-12 text-morandi-secondary">
              <MapPin size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
              <p>載入中...</p>
            </div>
          )}

          {/* 無資料 */}
          {!loading && filteredCountries.length === 0 && (
            <div className="text-center py-12 text-morandi-secondary">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p>無符合條件的地區</p>
              <Button
                onClick={() => setIsAddCountryOpen(true)}
                className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plus size={16} className="mr-2" />
                新增第一個國家
              </Button>
            </div>
          )}

          {/* 國家列表 */}
          {!loading && filteredCountries.length > 0 && (
            <div className="flex-1">
              {filteredCountries.map((country) => {
                const isCountryExpanded = expandedCountries.has(country.id);
                const countryRegions = getRegionsByCountry(country.id);
                const countryCities = getCitiesByCountry(country.id);
                const totalCities = countryCities.length;

                return (
                  <div key={country.id} className="border-b border-border last:border-b-0">
                    {/* 國家行 */}
                    <div className="hover:bg-morandi-container/20 transition-colors">
                      <div className="flex items-center px-4 py-3">
                        {/* 展開按鈕 */}
                        <div className="w-6 flex items-center justify-center">
                          <button
                            onClick={() => toggleCountry(country.id)}
                            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                          >
                            {isCountryExpanded ? (
                              <ChevronDown size={16} className="text-morandi-gold" />
                            ) : (
                              <ChevronRight size={16} className="text-morandi-secondary" />
                            )}
                          </button>
                        </div>

                        {/* 國家欄位 */}
                        <div className="w-48 flex items-center ml-2">
                          <span className="text-2xl mr-2">{country.emoji || '🌍'}</span>
                          <span className="font-semibold text-morandi-primary">{country.name}</span>
                        </div>

                        {/* 地區欄位 */}
                        <div className="w-48 text-sm text-morandi-muted">
                          {country.has_regions && `${countryRegions.length} 個地區`}
                        </div>

                        {/* 城市欄位 */}
                        <div className="flex-1 text-sm text-morandi-muted">
                          {totalCities} 個城市
                        </div>

                        {/* 狀態 */}
                        <div className="w-24 flex items-center justify-center">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                            country.is_active
                              ? 'bg-morandi-green text-white'
                              : 'bg-morandi-container text-morandi-secondary'
                          )}>
                            {country.is_active ? '啟用' : '停用'}
                          </span>
                        </div>

                        {/* 操作 */}
                        <div className="w-40 flex items-center justify-end gap-1">
                          {country.has_regions ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCountryId(country.id);
                                setIsAddRegionOpen(true);
                              }}
                              className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
                              title="新增地區"
                            >
                              <Plus size={14} />
                            </Button>
                          ) : (
                            <div className="h-8 w-8"></div>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCountryId(country.id);
                              setSelectedRegionId('');
                              setIsAddCityOpen(true);
                            }}
                            className="h-8 px-2 text-morandi-green hover:bg-morandi-green/10"
                            title="新增城市"
                          >
                            <Plus size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCountryStatus(country)}
                            className="h-8 px-2"
                            title={country.is_active ? '停用' : '啟用'}
                          >
                            <Power size={14} className={
                              country.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
                            } />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCountry(country.id)}
                            className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                            title="刪除"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 展開內容：地區 or 城市 */}
                    {isCountryExpanded && (
                      <div className="bg-morandi-container/5">
                        {country.has_regions ? (
                          // 有地區分類
                          countryRegions.map((region) => {
                            const isRegionExpanded = expandedRegions.has(region.id);
                            const regionCities = getCitiesByRegion(region.id);

                            return (
                              <div key={region.id} className="border-t border-border/50">
                                {/* 地區行 */}
                                <div className="hover:bg-morandi-container/20 transition-colors">
                                  <div className="flex items-center px-4 py-2.5">
                                    {/* 展開按鈕（縮排） */}
                                    <div className="w-6"></div>
                                    <div className="w-6 flex items-center justify-center">
                                      <button
                                        onClick={() => toggleRegion(region.id)}
                                        className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
                                      >
                                        {isRegionExpanded ? (
                                          <ChevronDown size={14} className="text-morandi-gold" />
                                        ) : (
                                          <ChevronRight size={14} className="text-morandi-secondary" />
                                        )}
                                      </button>
                                    </div>

                                    {/* 國家欄位（空白） */}
                                    <div className="w-48 ml-2"></div>

                                    {/* 地區欄位 */}
                                    <div className="w-48 flex items-center">
                                      <div className="w-2 h-2 rounded-full bg-morandi-gold mr-3"></div>
                                      <span className="font-medium text-morandi-primary">{region.name}</span>
                                    </div>

                                    {/* 城市欄位 */}
                                    <div className="flex-1 text-sm text-morandi-muted">
                                      {regionCities.length} 個城市
                                    </div>

                                    {/* 狀態欄位（空白） */}
                                    <div className="w-24"></div>

                                    {/* 操作 */}
                                    <div className="w-40 flex items-center justify-end gap-1">
                                      <div className="h-8 w-8"></div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedCountryId(country.id);
                                          setSelectedRegionId(region.id);
                                          setIsAddCityOpen(true);
                                        }}
                                        className="h-8 px-2 text-morandi-green hover:bg-morandi-green/10"
                                        title="新增城市"
                                      >
                                        <Plus size={14} />
                                      </Button>
                                      <div className="h-8 w-8"></div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteRegion(region.id)}
                                        className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                                        title="刪除"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* 地區的城市列表（排序後） */}
                                {isRegionExpanded && regionCities.length > 0 && (
                                  <div className="bg-morandi-container/10">
                                    {sortCities(regionCities).map((city) => renderCityRow(city))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          // 無地區分類，直接顯示城市（排序後）
                          sortCities(countryCities).map((city) => renderCityRow(city, false))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddCountryDialog
        open={isAddCountryOpen}
        onClose={() => setIsAddCountryOpen(false)}
        onCreate={createCountry}
      />
      <AddRegionDialog
        open={isAddRegionOpen}
        onClose={() => setIsAddRegionOpen(false)}
        countryId={selectedCountryId}
        onCreate={createRegion}
      />
      <AddCityDialog
        open={isAddCityOpen}
        onClose={() => setIsAddCityOpen(false)}
        countryId={selectedCountryId}
        regionId={selectedRegionId}
        onCreate={createCity}
      />
      <EditCityDialog
        open={isEditCityOpen}
        onClose={() => {
          setIsEditCityOpen(false);
          setSelectedCity(null);
        }}
        city={selectedCity}
        onUpdate={updateCity}
      />
      <EditCityImageDialog
        open={isEditImageOpen}
        onClose={() => {
          setIsEditImageOpen(false);
          setSelectedCity(null);
        }}
        city={selectedCity}
        onUpdate={updateCity}
      />
    </div>
  );

  // 渲染城市行
  function renderCityRow(city: City, isUnderRegion = true) {
    return (
      <div
        key={city.id}
        className="border-t border-border/50 hover:bg-morandi-container/20 transition-colors"
      >
        <div className="flex items-center px-4 py-2.5">
          {/* 展開按鈕佔位（兩層縮排） */}
          <div className="w-6"></div>
          <div className="w-6"></div>
          <div className={cn(isUnderRegion ? "w-6" : "w-4")}></div>

          {/* 國家欄位（空白） */}
          <div className="w-48 ml-2"></div>

          {/* 地區欄位（空白） */}
          <div className="w-48"></div>

          {/* 城市欄位 */}
          <div className="w-48 flex items-center">
            <div className="w-1 h-1 rounded-full bg-morandi-secondary mr-3"></div>
            <span className="text-morandi-primary">{city.name}</span>
          </div>

          {/* 機場代碼 */}
          <div className="w-32 flex items-center">
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              city.airport_code
                ? 'bg-morandi-blue/10 text-morandi-blue'
                : 'bg-morandi-container text-morandi-muted'
            )}>
              {city.airport_code || '-'}
            </span>
          </div>

          {/* 城市圖片 */}
          <div className="w-32 flex items-center justify-center gap-1">
            {/* 第一張圖片 */}
            {city.background_image_url ? (
              <div className="relative group">
                <img
                  src={city.background_image_url}
                  alt={`${city.name} 1`}
                  className="w-12 h-8 object-cover rounded border border-border"
                />
                <button
                  onClick={() => {
                    setSelectedCity(city);
                    setIsEditImageOpen(true);
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
                >
                  <ImageIcon size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedCity(city);
                  setIsEditImageOpen(true);
                }}
                className="w-12 h-8 border-2 border-dashed border-morandi-secondary/30 rounded flex items-center justify-center hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                title="上傳圖片 1"
              >
                <Upload size={12} className="text-morandi-muted" />
              </button>
            )}

            {/* 第二張圖片 */}
            {city.background_image_url_2 ? (
              <div className="relative group">
                <img
                  src={city.background_image_url_2}
                  alt={`${city.name} 2`}
                  className="w-12 h-8 object-cover rounded border border-border"
                />
                <button
                  onClick={() => {
                    setSelectedCity(city);
                    setIsEditImageOpen(true);
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
                >
                  <ImageIcon size={12} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setSelectedCity(city);
                  setIsEditImageOpen(true);
                }}
                className="w-12 h-8 border-2 border-dashed border-morandi-secondary/30 rounded flex items-center justify-center hover:border-morandi-gold hover:bg-morandi-gold/5 transition-colors"
                title="上傳圖片 2"
              >
                <Upload size={12} className="text-morandi-muted" />
              </button>
            )}
          </div>

          {/* 空白填充 */}
          <div className="flex-1"></div>

          {/* 狀態 */}
          <div className="w-24 flex items-center justify-center">
            <span className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
              city.is_active
                ? 'bg-morandi-green/80 text-white'
                : 'bg-morandi-container text-morandi-secondary'
            )}>
              {city.is_active ? '啟用' : '停用'}
            </span>
          </div>

          {/* 操作 */}
          <div className="w-40 flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCity(city);
                setIsEditCityOpen(true);
              }}
              className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
              title="編輯"
            >
              <Edit2 size={12} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleCityStatus(city)}
              className="h-8 px-2"
              title={city.is_active ? '停用' : '啟用'}
            >
              <Power size={12} className={
                city.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
              } />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteCity(city.id)}
              className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
              title="刪除"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

// ============================================
// Dialogs
// ============================================

function AddCountryDialog({ open, onClose, onCreate }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    emoji: '',
    code: '',
    has_regions: false,
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onCreate(formData);
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        emoji: '',
        code: '',
        has_regions: false,
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增國家</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">ID（英文）*</label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="例如: japan"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">中文名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: 日本"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">英文名稱 *</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              placeholder="例如: Japan"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Emoji</label>
            <Input
              value={formData.emoji}
              onChange={(e) => setFormData(prev => ({ ...prev, emoji: e.target.value }))}
              placeholder="例如: 🇯🇵"
            />
          </div>
          <div>
            <label className="text-sm font-medium">國家代碼</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              placeholder="例如: JP"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.has_regions}
              onChange={(e) => setFormData(prev => ({ ...prev, has_regions: e.target.checked }))}
              className="w-4 h-4"
            />
            <label className="text-sm">此國家有地區分類（如日本的九州、關東）</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              新增
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddRegionDialog({ open, onClose, countryId, onCreate }: {
  open: boolean;
  onClose: () => void;
  countryId: string;
  onCreate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onCreate({
      ...formData,
      country_id: countryId,
    });
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增地區</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">ID（英文）*</label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="例如: kyushu"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">中文名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: 九州"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">英文名稱</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              placeholder="例如: Kyushu"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              新增
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCityDialog({ open, onClose, city, onUpdate }: {
  open: boolean;
  onClose: () => void;
  city: City | null;
  onUpdate: (id: string, data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    airport_code: '',
    timezone: '',
  });

  // 當 city 改變時更新表單
  useEffect(() => {
    if (city) {
      setFormData({
        name: city.name,
        name_en: city.name_en || '',
        airport_code: city.airport_code || '',
        timezone: city.timezone || '',
      });
    }
  }, [city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city) return;

    const result = await onUpdate(city.id, formData);
    if (result) {
      onClose();
    }
  };

  if (!city) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>編輯城市</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">中文名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: 福岡"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">英文名稱</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              placeholder="例如: Fukuoka"
            />
          </div>
          <div>
            <label className="text-sm font-medium">機場代碼（3 碼）</label>
            <Input
              value={formData.airport_code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 3);
                setFormData(prev => ({ ...prev, airport_code: value }));
              }}
              placeholder="例如: FUK"
              maxLength={3}
            />
            <p className="text-xs text-morandi-secondary mt-1">
              💡 用於生成團號，建議使用 IATA 機場代碼
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">時區（IANA 格式）</label>
            <Input
              value={formData.timezone}
              onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
              placeholder="例如: Asia/Tokyo"
            />
            <p className="text-xs text-morandi-secondary mt-1">
              🌍 IANA 時區標識符，會自動處理夏令時（例如歐美冬令時）
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              儲存
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddCityDialog({ open, onClose, countryId, regionId, onCreate }: {
  open: boolean;
  onClose: () => void;
  countryId: string;
  regionId?: string;
  onCreate: (data: any) => Promise<any>;
}) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    name_en: '',
    airport_code: '',
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onCreate({
      ...formData,
      country_id: countryId,
      region_id: regionId || null,
    });
    if (result) {
      onClose();
      setFormData({
        id: '',
        name: '',
        name_en: '',
        airport_code: '',
        display_order: 0,
        is_active: true,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新增城市</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">ID（英文）*</label>
            <Input
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="例如: fukuoka"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">中文名稱 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="例如: 福岡"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">英文名稱</label>
            <Input
              value={formData.name_en}
              onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              placeholder="例如: Fukuoka"
            />
          </div>
          <div>
            <label className="text-sm font-medium">機場代碼（3 碼）</label>
            <Input
              value={formData.airport_code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 3);
                setFormData(prev => ({ ...prev, airport_code: value }));
              }}
              placeholder="例如: FUK"
              maxLength={3}
            />
            <p className="text-xs text-morandi-secondary mt-1">
              💡 用於生成團號，建議使用 IATA 機場代碼
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              新增
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
