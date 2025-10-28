'use client';

import { useState, useEffect } from 'react';
import { Car, Edit2, Trash2, Users, User, Power, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { cn } from '@/lib/utils';
import { useRegionStoreNew } from '@/stores';

// ============================================
// 型別定義
// ============================================

interface TransportOption {
  id: string;
  name: string;
  name_en?: string;
  price_per_person: number | null;
  price_per_group: number | null;
  capacity: number | null;
  is_group_cost: boolean;
  country_id: string;
  region_id?: string;
  city_id: string;
  is_active: boolean;
  display_order: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// 主頁面組件
// ============================================

export default function TransportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [transportOptions, setTransportOptions] = useState<TransportOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<TransportOption | null>(null);

  const {
    countries,
    cities,
    fetchAll,
  } = useRegionStoreNew();

  // 載入地區資料
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // TODO: 載入交通選項資料
  // useEffect(() => {
  //   fetchTransportOptions();
  // }, []);

  // 篩選交通選項
  const filteredTransportOptions = transportOptions.filter(transport =>
    !searchTerm ||
    transport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transport.name_en?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此交通選項嗎？')) return;
    // TODO: 實作刪除功能
  };

  const toggleStatus = async (transport: TransportOption) => {
    // TODO: 實作切換狀態功能
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="交通選項管理"
        icon={Car}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '交通選項', href: '/database/transport' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋交通方式..."
        onAdd={() => setIsAddOpen(true)}
        addLabel="新增交通選項"
      />

      <div className="flex-1 overflow-auto">
        {/* 表格 */}
        <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm min-h-full flex flex-col">
          {/* 表格標題行 */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-morandi-container/40 via-morandi-gold/10 to-morandi-container/40 border-b-2 border-morandi-gold/20 backdrop-blur-sm">
            <div className="flex items-center px-4 py-3">
              <div className="w-48 text-sm font-medium text-morandi-primary">交通方式</div>
              <div className="w-40 text-sm font-medium text-morandi-primary">地點</div>
              <div className="w-32 text-sm font-medium text-morandi-primary text-center">類型</div>
              <div className="w-32 text-sm font-medium text-morandi-primary text-right">個人價格</div>
              <div className="w-32 text-sm font-medium text-morandi-primary text-right">團體價格</div>
              <div className="w-24 text-sm font-medium text-morandi-primary text-center">載客量</div>
              <div className="w-24 text-sm font-medium text-morandi-primary text-center">狀態</div>
              <div className="w-32 text-sm font-medium text-morandi-primary text-center">操作</div>
            </div>
          </div>

          {/* 載入中 */}
          {loading && (
            <div className="text-center py-12 text-morandi-secondary">
              <Car size={48} className="mx-auto mb-4 opacity-50 animate-pulse" />
              <p>載入中...</p>
            </div>
          )}

          {/* 無資料 */}
          {!loading && filteredTransportOptions.length === 0 && (
            <div className="text-center py-12 text-morandi-secondary">
              <Car size={48} className="mx-auto mb-4 opacity-50" />
              <p>無符合條件的交通選項</p>
              <Button
                onClick={() => setIsAddOpen(true)}
                className="mt-4 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                <Plus size={16} className="mr-2" />
                新增第一個交通選項
              </Button>
            </div>
          )}

          {/* 交通選項列表 */}
          {!loading && filteredTransportOptions.length > 0 && (
            <div className="flex-1">
              {filteredTransportOptions.map((transport) => {
                const country = countries.find(c => c.id === transport.country_id);
                const city = cities.find(c => c.id === transport.city_id);

                return (
                  <div
                    key={transport.id}
                    className="border-b border-border last:border-b-0 hover:bg-morandi-container/20 transition-colors"
                  >
                    <div className="flex items-center px-4 py-3">
                      {/* 交通方式 */}
                      <div className="w-48">
                        <div className="font-medium text-morandi-primary">{transport.name}</div>
                        {transport.name_en && (
                          <div className="text-xs text-morandi-muted">{transport.name_en}</div>
                        )}
                      </div>

                      {/* 地點 */}
                      <div className="w-40 text-sm text-morandi-secondary">
                        {country?.emoji} {city?.name || transport.city_id}
                      </div>

                      {/* 類型 */}
                      <div className="w-32 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          transport.is_group_cost
                            ? 'bg-morandi-gold/20 text-morandi-gold'
                            : 'bg-morandi-blue/10 text-morandi-blue'
                        )}>
                          {transport.is_group_cost ? (
                            <>
                              <Users size={12} className="mr-1" />
                              團體分攤
                            </>
                          ) : (
                            <>
                              <User size={12} className="mr-1" />
                              個人費用
                            </>
                          )}
                        </span>
                      </div>

                      {/* 個人價格 */}
                      <div className="w-32 text-right text-sm text-morandi-secondary">
                        {transport.price_per_person ? `NT$ ${transport.price_per_person.toLocaleString()}` : '-'}
                      </div>

                      {/* 團體價格 */}
                      <div className="w-32 text-right text-sm text-morandi-secondary">
                        {transport.price_per_group ? `NT$ ${transport.price_per_group.toLocaleString()}` : '-'}
                      </div>

                      {/* 載客量 */}
                      <div className="w-24 text-center text-sm text-morandi-secondary">
                        {transport.capacity ? `${transport.capacity} 人` : '-'}
                      </div>

                      {/* 狀態 */}
                      <div className="w-24 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          transport.is_active
                            ? 'bg-morandi-green/80 text-white'
                            : 'bg-morandi-container text-morandi-secondary'
                        )}>
                          {transport.is_active ? '啟用' : '停用'}
                        </span>
                      </div>

                      {/* 操作 */}
                      <div className="w-32 flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTransport(transport);
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
                          onClick={() => toggleStatus(transport)}
                          className="h-8 px-2"
                          title={transport.is_active ? '停用' : '啟用'}
                        >
                          <Power size={14} className={
                            transport.is_active ? 'text-morandi-green' : 'text-morandi-secondary'
                          } />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transport.id)}
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
    </div>
  );
}