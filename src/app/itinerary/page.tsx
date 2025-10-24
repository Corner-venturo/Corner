'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
// import { Button } from '@/components/ui/button';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { MapPin, Eye, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useItineraryStore, type Itinerary } from '@/stores';

const statusFilters = ['全部', '草稿', '已發布'];

export default function ItineraryPage() {
  const router = useRouter();
  const { items: itineraries, delete: deleteItinerary } = useItineraryStore();
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [searchTerm, setSearchTerm] = useState('');

  // 複製行程
  const handleDuplicate = useCallback(async (id: string) => {
    // TODO: 實作複製邏輯
    console.log('複製行程:', id);
  }, []);

  // 刪除行程
  const handleDelete = useCallback(async (id: string) => {
    if (confirm('確定要刪除這個行程嗎？')) {
      try {
        await deleteItinerary(id);
        alert('✅ 刪除成功！');
        // Store 會自動更新，不需要重新載入
      } catch (error) {
        console.error('刪除失敗:', error);
        alert('❌ 刪除失敗，請稍後再試');
      }
    }
  }, [deleteItinerary]);

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'tourCode',
      label: '行程編號',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <span className="text-sm text-morandi-secondary font-mono">
          {itinerary.tourCode || '-'}
        </span>
      ),
    },
    {
      key: 'title',
      label: '行程名稱',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <span className="text-sm font-medium text-morandi-primary">{itinerary.title}</span>
      ),
    },
    {
      key: 'destination',
      label: '目的地',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <div className="flex items-center text-sm text-morandi-secondary">
          <MapPin size={14} className="mr-1" />
          {itinerary.country} · {itinerary.city}
        </div>
      ),
    },
    {
      key: 'days',
      label: '天數',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <span className="text-sm text-morandi-secondary">
          {itinerary.dailyItinerary?.length || 0} 天 {Math.max(0, (itinerary.dailyItinerary?.length || 0) - 1)} 夜
        </span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <span className={cn(
          'text-sm font-medium',
          itinerary.status === 'published'
            ? 'text-green-600'
            : 'text-gray-600'
        )}>
          {itinerary.status === 'published' ? '已發布' : '草稿'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立時間',
      sortable: true,
      render: (value, itinerary: Itinerary) => (
        <span className="text-sm text-morandi-muted">
          {new Date(itinerary.created_at).toLocaleDateString('zh-TW')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (value, itinerary: Itinerary) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              // 固定使用 ngrok 網址（給外部分享用）
              const baseUrl = 'https://frisky-masonic-mellissa.ngrok-free.dev';
              const shareUrl = `${baseUrl}/view/${itinerary.id}`;

              // 複製到剪貼簿
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert('✅ 分享連結已複製！\n\n' + shareUrl);
              }).catch(err => {
                console.error('複製失敗:', err);
                alert('❌ 複製失敗，請手動複製：\n' + shareUrl);
              });
            }}
            className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
            title="產生分享連結"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(itinerary.id);
            }}
            className="p-1 text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30 rounded transition-colors"
            title="複製行程"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(itinerary.id);
            }}
            className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
            title="刪除行程"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [handleDelete, handleDuplicate]);

  // 過濾資料
  const filteredItineraries = useMemo(() => {
    let filtered = itineraries;

    // 狀態篩選
    if (statusFilter !== '全部') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // 搜尋 - 搜尋所有文字欄位
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.country.toLowerCase().includes(searchLower) ||
        item.city.toLowerCase().includes(searchLower) ||
        item.tourCode.toLowerCase().includes(searchLower) ||
        item.status.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [itineraries, statusFilter, searchTerm]);

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="行程管理"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋行程..."
        onAdd={() => router.push('/itinerary/new')}
        addLabel="新增行程"
      >
        {/* 狀態篩選 */}
        <div className="flex gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                statusFilter === filter
                  ? 'bg-morandi-gold text-white'
                  : 'text-morandi-secondary hover:text-morandi-primary hover:bg-morandi-container/30'
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </ResponsiveHeader>

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          columns={tableColumns}
          data={filteredItineraries}
          onRowClick={(itinerary: Itinerary) => router.push(`/itinerary/${itinerary.id}`)}
        />
      </div>
    </div>
  );
}
