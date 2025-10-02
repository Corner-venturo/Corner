'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { cn } from '@/lib/utils';
import { regionOptionsMap, type RegionName } from '@/data/region-options';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';

interface RegionData {
  id: string;
  name: string;
  transportCount: number;
  activityCount: number;
  lastUpdated: string;
  isActive: boolean;
}

export default function RegionsPage() {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRegion, setEditingRegion] = useState<RegionData | null>(null);
  const [newRegion, setNewRegion] = useState({
    name: '',
    isActive: true
  });

  // 從資料庫選項生成地區列表
  const regions: RegionData[] = Object.entries(regionOptionsMap).map(([name, options]) => ({
    id: name,
    name: name,
    transportCount: options.transport.length,
    activityCount: options.activities.length,
    lastUpdated: '2024-01-15',
    isActive: true
  }));

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: '地區名稱',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center">
          <MapPin size={16} className="mr-2 text-morandi-gold" />
          <span className="font-medium text-morandi-primary">{value}</span>
        </div>
      )
    },
    {
      key: 'transportCount',
      label: '交通選項',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">{value} 項</span>
      )
    },
    {
      key: 'activityCount',
      label: '活動門票',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">{value} 項</span>
      )
    },
    {
      key: 'lastUpdated',
      label: '最後更新',
      sortable: true,
      filterable: true,
      filterType: 'date',
      render: (value) => (
        <span className="text-morandi-secondary">{value}</span>
      )
    },
    {
      key: 'isActive',
      label: '狀態',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: '啟用' },
        { value: 'false', label: '停用' }
      ],
      render: (value) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          value
            ? 'bg-morandi-green text-white'
            : 'bg-morandi-container text-morandi-secondary'
        )}>
          {value ? '啟用' : '停用'}
        </span>
      )
    },
    {
      key: 'actions',
      label: '操作',
      sortable: false,
      filterable: false,
      render: (_, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEditRegion(row)}
            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯地區"
          >
            <Edit size={14} className="text-morandi-gold" />
          </button>
          <button
            onClick={() => handleDeleteRegion(row.id)}
            className="p-1 hover:bg-morandi-red/10 rounded transition-colors"
            title="刪除地區"
          >
            <Trash2 size={14} className="text-morandi-red" />
          </button>
        </div>
      )
    }
  ], []);

  // 排序和篩選函數
  const sortFunction = (data: RegionData[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number | boolean = a[column as keyof RegionData];
      let bValue: string | number | boolean = b[column as keyof RegionData];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterFunction = (data: RegionData[], filters: Record<string, string>) => {
    return data.filter(region => {
      return (
        (!filters.name || region.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.transportCount || region.transportCount.toString().includes(filters.transportCount)) &&
        (!filters.activityCount || region.activityCount.toString().includes(filters.activityCount)) &&
        (!filters.lastUpdated || region.lastUpdated.includes(filters.lastUpdated)) &&
        (!filters.isActive || region.isActive.toString() === filters.isActive)
      );
    });
  };

  const { data: filteredAndSortedRegions, handleSort, handleFilter } = useEnhancedTable(
    regions.filter(r => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase())),
    sortFunction,
    filterFunction
  );

  const handleAddRegion = () => {
    if (!newRegion.name.trim()) return;

    // TODO: 新增地區到資料庫
    setNewRegion({ name: '', isActive: true });
    setIsAddDialogOpen(false);
  };

  const handleEditRegion = (region: RegionData) => {
    setEditingRegion(region);
    setNewRegion({
      name: region.name,
      isActive: region.isActive
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteRegion = (regionId: string) => {
    if (confirm('確定要刪除此地區嗎？這將同時刪除相關的交通和活動選項。')) {
      // TODO: 刪除地區從資料庫
    }
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    setEditingRegion(null);
    setNewRegion({ name: '', isActive: true });
  };

  return (
    <div className="space-y-6 ">
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
        searchPlaceholder="搜尋地區名稱..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增地區"
        actions={
          <div className="text-sm text-morandi-secondary">
            {filteredAndSortedRegions.length} 個地區
          </div>
        }
      />

      <ContentContainer>
        <EnhancedTable
          columns={tableColumns}
          data={filteredAndSortedRegions}
          onSort={handleSort}
          onFilter={handleFilter}
          cellSelection={false}
        />

        {filteredAndSortedRegions.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <MapPin size={48} className="mx-auto mb-4 opacity-50" />
            <p>{regions.length === 0 ? '尚未建立任何地區' : '無符合條件的地區'}</p>
          </div>
        )}
      </ContentContainer>

      {/* 新增/編輯地區對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRegion ? '編輯地區' : '新增地區'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">地區名稱</label>
              <Input
                value={newRegion.name}
                onChange={(e) => setNewRegion(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入地區名稱，例如：清邁、曼谷"
                className="mt-1"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={newRegion.isActive}
                onChange={(e) => setNewRegion(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm text-morandi-primary">
                啟用此地區
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button
                onClick={handleAddRegion}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {editingRegion ? '更新' : '新增'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}