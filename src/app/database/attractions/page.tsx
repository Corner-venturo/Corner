'use client';

import { useState, useEffect } from 'react';
import { MapPin, Trash2, Power, Edit2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { useRegionStoreNew } from '@/stores';

// ============================================
// 型別定義
// ============================================

interface Attraction {
  id: string;
  name: string;
  name_en?: string;
  description?: string;
  country_id: string;
  region_id?: string;
  city_id: string;
  category?: string;
  tags?: string[];
  duration_minutes?: number;
  opening_hours?: any;
  address?: string;
  phone?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  images?: string[];
  thumbnail?: string;
  is_active: boolean;
  display_order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// 主頁面組件
// ============================================

export default function AttractionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);

  const {
    countries,
    regions,
    cities,
    fetchAll,
    getRegionsByCountry,
    getCitiesByCountry,
    getCitiesByRegion,
  } = useRegionStoreNew();

  // 載入地區資料
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // 載入景點資料
  useEffect(() => {
    fetchAttractions();
  }, [selectedCountry, selectedRegion, selectedCity, selectedCategory]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('attractions')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (selectedCity) {
        query = query.eq('city_id', selectedCity);
      } else if (selectedRegion) {
        query = query.eq('region_id', selectedRegion);
      } else if (selectedCountry) {
        query = query.eq('country_id', selectedCountry);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttractions(data || []);
    } catch (error) {
      console.error('載入景點失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 刪除景點
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此景點？')) return;

    try {
      const { error } = await supabase
        .from('attractions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAttractions();
    } catch (error) {
      console.error('刪除失敗:', error);
      alert('刪除失敗');
    }
  };

  // 切換啟用狀態
  const toggleStatus = async (attraction: Attraction) => {
    try {
      const { error } = await supabase
        .from('attractions')
        .update({ is_active: !attraction.is_active })
        .eq('id', attraction.id);

      if (error) throw error;
      await fetchAttractions();
    } catch (error) {
      console.error('更新狀態失敗:', error);
    }
  };

  // 過濾資料
  const filteredAttractions = attractions.filter(attr =>
    !searchTerm ||
    attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    attr.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 取得當前篩選的地區資訊
  const availableRegions = selectedCountry ? getRegionsByCountry(selectedCountry) : [];
  const availableCities = selectedRegion
    ? getCitiesByRegion(selectedRegion)
    : selectedCountry
    ? getCitiesByCountry(selectedCountry)
    : [];

  const categories = ['all', '景點', '餐廳', '住宿', '購物', '交通'];

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="景點管理"
        icon={MapPin}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '景點管理', href: '/database/attractions' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋景點名稱..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="新增景點"
      />

      <div className="flex-1 overflow-auto">
        {/* 篩選區 */}
        <div className="mb-4 p-4 bg-card border border-border rounded-lg flex flex-wrap gap-3">
          {/* 國家選擇 */}
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setSelectedRegion('');
              setSelectedCity('');
            }}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            <option value="">所有國家</option>
            {countries.map(country => (
              <option key={country.id} value={country.id}>
                {country.emoji} {country.name}
              </option>
            ))}
          </select>

          {/* 地區選擇（如果有） */}
          {availableRegions.length > 0 && (
            <select
              value={selectedRegion}
              onChange={(e) => {
                setSelectedRegion(e.target.value);
                setSelectedCity('');
              }}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="">所有地區</option>
              {availableRegions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>
          )}

          {/* 城市選擇 */}
          {availableCities.length > 0 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-sm"
            >
              <option value="">所有城市</option>
              {availableCities.map(city => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          )}

          {/* 類別選擇 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? '所有類別' : cat}
              </option>
            ))}
          </select>

          {/* 清除篩選 */}
          {(selectedCountry || selectedRegion || selectedCity || selectedCategory !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCountry('');
                setSelectedRegion('');
                setSelectedCity('');
                setSelectedCategory('all');
              }}
            >
              清除篩選
            </Button>
          )}
        </div>

        {/* 表格 */}
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-full flex flex-col">
          {/* 表格標題行 */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
            <div className="flex items-center px-4 py-3">
              <div className="w-20 text-sm font-medium text-morandi-primary">圖片</div>
              <div className="w-56 text-sm font-medium text-morandi-primary">景點名稱</div>
              <div className="w-40 text-sm font-medium text-morandi-primary">地點</div>
              <div className="w-24 text-sm font-medium text-morandi-primary text-center">類別</div>
              <div className="flex-1 text-sm font-medium text-morandi-primary">標籤</div>
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
          {!loading && filteredAttractions.length === 0 && (
            <div className="text-center py-12 text-morandi-secondary">
              <MapPin size={48} className="mx-auto mb-4 opacity-50" />
              <p>無符合條件的景點</p>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plus size={16} className="mr-2" />
                新增第一個景點
              </Button>
            </div>
          )}

          {/* 景點列表 */}
          {!loading && filteredAttractions.length > 0 && (
            <div className="flex-1">
              {filteredAttractions.map((attraction) => {
                const country = countries.find(c => c.id === attraction.country_id);
                const city = cities.find(c => c.id === attraction.city_id);

                return (
                  <div
                    key={attraction.id}
                    className="border-b border-border last:border-b-0 hover:bg-morandi-container/20 transition-colors"
                  >
                    <div className="flex items-center px-4 py-3">
                      {/* 圖片縮圖 */}
                      <div className="w-20">
                        {attraction.images && attraction.images.length > 0 ? (
                          <img
                            src={attraction.images[0]}
                            alt={attraction.name}
                            className="w-16 h-12 object-cover rounded border border-border"
                          />
                        ) : (
                          <div className="w-16 h-12 bg-morandi-container/30 rounded border border-border flex items-center justify-center">
                            <MapPin size={16} className="text-morandi-muted opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* 景點名稱 */}
                      <div className="w-56">
                        <div className="font-medium text-morandi-primary">{attraction.name}</div>
                        {attraction.name_en && (
                          <div className="text-xs text-morandi-muted">{attraction.name_en}</div>
                        )}
                      </div>

                      {/* 地點 */}
                      <div className="w-40 text-sm text-morandi-secondary">
                        {country?.emoji} {city?.name || attraction.city_id}
                      </div>

                      {/* 類別 */}
                      <div className="w-24 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-morandi-blue/10 text-morandi-blue">
                          {attraction.category || '-'}
                        </span>
                      </div>

                      {/* 標籤 */}
                      <div className="flex-1 flex flex-wrap gap-1">
                        {attraction.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-morandi-container text-morandi-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                        {(attraction.tags?.length || 0) > 3 && (
                          <span className="text-xs text-morandi-muted">+{(attraction.tags?.length || 0) - 3}</span>
                        )}
                      </div>

                      {/* 狀態 */}
                      <div className="w-24 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          attraction.is_active
                            ? 'bg-morandi-green/80 text-white'
                            : 'bg-morandi-container text-morandi-secondary'
                        )}>
                          {attraction.is_active ? '啟用' : '停用'}
                        </span>
                      </div>

                      {/* 操作 */}
                      <div className="w-40 flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingAttraction(attraction);
                            setIsEditOpen(true);
                          }}
                          className="h-8 px-2 text-morandi-blue hover:bg-morandi-blue/10"
                          title="編輯"
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(attraction)}
                          className="h-8 px-2"
                          title={attraction.is_active ? '停用' : '啟用'}
                        >
                          <Power size={14} className={
                            attraction.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
                          } />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attraction.id)}
                          className="h-8 px-2 hover:text-morandi-red hover:bg-morandi-red/10"
                          title="刪除"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddAttractionDialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchAttractions}
        countries={countries}
        regions={regions}
        cities={cities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
      />

      <EditAttractionDialog
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingAttraction(null);
        }}
        onSuccess={fetchAttractions}
        attraction={editingAttraction}
        countries={countries}
        regions={regions}
        cities={cities}
        getRegionsByCountry={getRegionsByCountry}
        getCitiesByCountry={getCitiesByCountry}
        getCitiesByRegion={getCitiesByRegion}
      />
    </div>
  );
}

// ============================================
// 新增景點 Dialog
// ============================================

function AddAttractionDialog({ open, onClose, onSuccess, countries, regions, cities, getRegionsByCountry, getCitiesByCountry, getCitiesByRegion }: any) {
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    country_id: '',
    region_id: '',
    city_id: '',
    category: '景點',
    tags: '',
    duration_minutes: 60,
    address: '',
    phone: '',
    website: '',
    notes: '',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('attractions')
        .insert([{
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          region_id: formData.region_id || null,
        }]);

      if (error) throw error;

      onSuccess();
      onClose();
      setFormData({
        name: '',
        name_en: '',
        description: '',
        country_id: '',
        region_id: '',
        city_id: '',
        category: '景點',
        tags: '',
        duration_minutes: 60,
        address: '',
        phone: '',
        website: '',
        notes: '',
        is_active: true,
      });
    } catch (error) {
      console.error('新增失敗:', error);
      alert('新增失敗');
    }
  };

  const availableRegions = formData.country_id ? getRegionsByCountry(formData.country_id) : [];
  const availableCities = formData.region_id
    ? getCitiesByRegion(formData.region_id)
    : formData.country_id
    ? getCitiesByCountry(formData.country_id)
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增景點</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 中文名稱 */}
            <div>
              <label className="text-sm font-medium">中文名稱 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如: 太宰府天滿宮"
                required
              />
            </div>

            {/* 英文名稱 */}
            <div>
              <label className="text-sm font-medium">英文名稱</label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder="例如: Dazaifu Tenmangu"
              />
            </div>
          </div>

          {/* 描述 */}
          <div>
            <label className="text-sm font-medium">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="景點簡介..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]"
            />
          </div>

          {/* 地點選擇 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">國家 *</label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  country_id: e.target.value,
                  region_id: '',
                  city_id: ''
                }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                required
              >
                <option value="">請選擇</option>
                {countries.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            {availableRegions.length > 0 && (
              <div>
                <label className="text-sm font-medium">地區</label>
                <select
                  value={formData.region_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    region_id: e.target.value,
                    city_id: ''
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="">請選擇</option>
                  {availableRegions.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">城市 *</label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                required
              >
                <option value="">請選擇</option>
                {availableCities.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 類別與標籤 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">類別</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="景點">景點</option>
                <option value="餐廳">餐廳</option>
                <option value="住宿">住宿</option>
                <option value="購物">購物</option>
                <option value="交通">交通</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">標籤（逗號分隔）</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="例如: 文化,神社,歷史"
              />
            </div>
          </div>

          {/* 建議停留時間 */}
          <div>
            <label className="text-sm font-medium">建議停留時間（分鐘）</label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
              min={0}
            />
          </div>

          {/* 聯絡資訊 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">電話</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+81-92-123-4567"
              />
            </div>

            <div>
              <label className="text-sm font-medium">官網</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* 地址 */}
          <div>
            <label className="text-sm font-medium">地址</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="完整地址..."
            />
          </div>

          {/* 備註 */}
          <div>
            <label className="text-sm font-medium">內部備註</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="內部使用備註..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]"
            />
          </div>

          {/* 啟用狀態 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4"
            />
            <label className="text-sm">啟用此景點</label>
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

// ============================================
// 編輯景點 Dialog（與新增類似）
// ============================================

function EditAttractionDialog({ open, onClose, onSuccess, attraction, countries, regions, cities, getRegionsByCountry, getCitiesByCountry, getCitiesByRegion }: any) {
  const [formData, setFormData] = useState({
    name: '',
    name_en: '',
    description: '',
    country_id: '',
    region_id: '',
    city_id: '',
    category: '景點',
    tags: '',
    duration_minutes: 60,
    address: '',
    phone: '',
    website: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    if (attraction) {
      setFormData({
        name: attraction.name || '',
        name_en: attraction.name_en || '',
        description: attraction.description || '',
        country_id: attraction.country_id || '',
        region_id: attraction.region_id || '',
        city_id: attraction.city_id || '',
        category: attraction.category || '景點',
        tags: attraction.tags?.join(', ') || '',
        duration_minutes: attraction.duration_minutes || 60,
        address: attraction.address || '',
        phone: attraction.phone || '',
        website: attraction.website || '',
        notes: attraction.notes || '',
        is_active: attraction.is_active,
      });
    }
  }, [attraction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attraction) return;

    try {
      const { error } = await supabase
        .from('attractions')
        .update({
          ...formData,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
          region_id: formData.region_id || null,
        })
        .eq('id', attraction.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('更新失敗:', error);
      alert('更新失敗');
    }
  };

  const availableRegions = formData.country_id ? getRegionsByCountry(formData.country_id) : [];
  const availableCities = formData.region_id
    ? getCitiesByRegion(formData.region_id)
    : formData.country_id
    ? getCitiesByCountry(formData.country_id)
    : [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯景點</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 與新增表單相同內容 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">中文名稱 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">英文名稱</label>
              <Input
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">國家 *</label>
              <select
                value={formData.country_id}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  country_id: e.target.value,
                  region_id: '',
                  city_id: ''
                }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                required
              >
                <option value="">請選擇</option>
                {countries.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                ))}
              </select>
            </div>

            {availableRegions.length > 0 && (
              <div>
                <label className="text-sm font-medium">地區</label>
                <select
                  value={formData.region_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    region_id: e.target.value,
                    city_id: ''
                  }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                >
                  <option value="">請選擇</option>
                  {availableRegions.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">城市 *</label>
              <select
                value={formData.city_id}
                onChange={(e) => setFormData(prev => ({ ...prev, city_id: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                required
              >
                <option value="">請選擇</option>
                {availableCities.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">類別</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                <option value="景點">景點</option>
                <option value="餐廳">餐廳</option>
                <option value="住宿">住宿</option>
                <option value="購物">購物</option>
                <option value="交通">交通</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">標籤（逗號分隔）</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">建議停留時間（分鐘）</label>
            <Input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: Number(e.target.value) }))}
              min={0}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">電話</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">官網</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">地址</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-sm font-medium">內部備註</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm min-h-[60px]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4"
            />
            <label className="text-sm">啟用此景點</label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
              更新
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
