'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapIcon, Edit, Trash2, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { cn } from '@/lib/utils';
import { getRegionOptions, regionOptionsMap, type RegionName, type ActivityOption } from '@/data/region-options';

export default function ActivitiesPage() {
  const router = useRouter();
  const [selectedRegion, setSelectedRegion] = useState<RegionName>('清邁');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newActivity, setNewActivity] = useState({
    name: '',
    category: '',
    adultPrice: 0,
    childPrice: 0,
    groupDiscount: 0
  });

  const currentOptions = getRegionOptions(selectedRegion);
  const activityOptions = currentOptions.activities;

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: '活動名稱',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center">
          <MapIcon size={16} className="mr-2 text-morandi-gold" />
          <span className="font-medium text-morandi-primary">{value}</span>
        </div>
      )
    },
    {
      key: 'category',
      label: '類別',
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className="text-morandi-secondary">{value || '-'}</span>
      )
    },
    {
      key: 'adultPrice',
      label: '成人價格',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">
          {value ? `NT$ ${value}` : '-'}
        </span>
      )
    },
    {
      key: 'childPrice',
      label: '兒童價格',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">
          {value ? `NT$ ${value}` : '-'}
        </span>
      )
    },
    {
      key: 'groupDiscount',
      label: '團體折扣',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">
          {value ? `${value}%` : '無'}
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
            onClick={() => handleEditActivity(row)}
            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯活動"
          >
            <Edit size={14} className="text-morandi-gold" />
          </button>
          <button
            onClick={() => handleDeleteActivity(row.id)}
            className="p-1 hover:bg-morandi-red/10 rounded transition-colors"
            title="刪除活動"
          >
            <Trash2 size={14} className="text-morandi-red" />
          </button>
        </div>
      )
    }
  ], []);

  // 排序和篩選函數
  const sortFunction = (data: ActivityOption[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let aValue: string | number = a[column as keyof ActivityOption];
      let bValue: string | number = b[column as keyof ActivityOption];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const filterFunction = (data: ActivityOption[], filters: Record<string, string>) => {
    return data.filter(activity => {
      // 搜尋功能：檢查名稱或類別是否包含搜尋詞
      const matchesSearch = !searchTerm ||
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.category || '').toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesSearch &&
        (!filters.name || activity.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.category || (activity.category || '').toLowerCase().includes(filters.category.toLowerCase())) &&
        (!filters.adultPrice || (activity.adultPrice || 0).toString().includes(filters.adultPrice)) &&
        (!filters.childPrice || (activity.childPrice || 0).toString().includes(filters.childPrice)) &&
        (!filters.groupDiscount || (activity.groupDiscount || 0).toString().includes(filters.groupDiscount))
      );
    });
  };

  const { data: filteredAndSortedActivities, handleSort, handleFilter } = useEnhancedTable(
    activityOptions,
    sortFunction,
    filterFunction
  );

  // 重新計算過濾結果（當搜尋詞改變時）
  const finalFilteredActivities = useMemo(() => {
    return filterFunction(filteredAndSortedActivities, {});
  }, [filteredAndSortedActivities, searchTerm]);

  const handleAddActivity = () => {
    if (!newActivity.name.trim()) return;
    // TODO: 新增活動選項到資料庫
    resetForm();
  };

  const handleEditActivity = (activity: ActivityOption) => {
    setEditingActivity(activity);
    setNewActivity({
      name: activity.name,
      category: activity.category || '',
      adultPrice: activity.adultPrice || 0,
      childPrice: activity.childPrice || 0,
      groupDiscount: activity.groupDiscount || 0
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    if (confirm('確定要刪除此活動選項嗎？')) {
      // TODO: 刪除活動選項從資料庫
    }
  };

  const resetForm = () => {
    setNewActivity({
      name: '',
      category: '',
      adultPrice: 0,
      childPrice: 0,
      groupDiscount: 0
    });
    setIsAddDialogOpen(false);
    setEditingActivity(null);
  };

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="活動門票管理"
        icon={Ticket}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '活動門票', href: '/database/activities' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋活動或類別..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增活動"
        actions={
          <span className="text-sm text-morandi-secondary">
            共 {finalFilteredActivities.length} 筆活動門票
          </span>
        }
      />

      <ContentContainer>
        <EnhancedTable
          columns={tableColumns}
          data={finalFilteredActivities}
          onSort={handleSort}
          onFilter={handleFilter}
          cellSelection={false}
        />

        {finalFilteredActivities.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <MapIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p>{activityOptions.length === 0 ? '此地區尚未建立活動選項' : '無符合條件的活動選項'}</p>
          </div>
        )}
      </ContentContainer>

      {/* 新增活動對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增活動門票</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">活動名稱</label>
                <Input
                  value={newActivity.name}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="例如：大象保護區"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">分類</label>
                <Input
                  value={newActivity.category}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="例如：生態體驗"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">成人票價</label>
                <Input
                  type="number"
                  value={newActivity.adultPrice || ''}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, adultPrice: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">兒童票價</label>
                <Input
                  type="number"
                  value={newActivity.childPrice || ''}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, childPrice: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>取消</Button>
              <Button onClick={handleAddActivity} className="bg-morandi-gold hover:bg-morandi-gold-hover text-white">
                新增
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}