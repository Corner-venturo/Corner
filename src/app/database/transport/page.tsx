'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Edit, Trash2, Users, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn, useEnhancedTable } from '@/components/ui/enhanced-table';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { ContentContainer } from '@/components/layout/content-container';
import { cn } from '@/lib/utils';
import { getRegionOptions, _regionOptionsMap, type RegionName, type TransportOption } from '@/data/region-options';

export default function TransportPage() {
  const _router = useRouter();
  const [selectedRegion, _setSelectedRegion] = useState<RegionName>('清邁');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<TransportOption | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newTransport, setNewTransport] = useState({
    name: '',
    price_per_person: 0,
    pricePerGroup: 0,
    capacity: 0,
    is_group_cost: false
  });

  const currentOptions = getRegionOptions(selectedRegion);
  const transportOptions = currentOptions.transport;

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'name',
      label: '交通方式',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center">
          <Car size={16} className="mr-2 text-morandi-gold" />
          <span className="font-medium text-morandi-primary">{value}</span>
        </div>
      )
    },
    {
      key: 'is_group_cost',
      label: '類型',
      sortable: true,
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: '團體分攤' },
        { value: 'false', label: '個人費用' }
      ],
      render: (value) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          value
            ? 'bg-morandi-gold text-white'
            : 'bg-morandi-container text-morandi-secondary'
        )}>
          {value ? (
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
      )
    },
    {
      key: 'price_per_person',
      label: '個人價格',
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
      key: 'pricePerGroup',
      label: '團體價格',
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
      key: 'capacity',
      label: '載客量',
      sortable: true,
      filterable: true,
      filterType: 'number',
      render: (value) => (
        <span className="text-morandi-secondary">
          {value ? `${value} 人` : '-'}
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
            onClick={() => handleEditTransport(row)}
            className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
            title="編輯交通選項"
          >
            <Edit size={14} className="text-morandi-gold" />
          </button>
          <button
            onClick={() => handleDeleteTransport(row.id)}
            className="p-1 hover:bg-morandi-red/10 rounded transition-colors"
            title="刪除交通選項"
          >
            <Trash2 size={14} className="text-morandi-red" />
          </button>
        </div>
      )
    }
  ], []);

  // 排序和篩選函數
  const sortFunction = useCallback((data: TransportOption[], column: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      const aValue: string | number | boolean = a[column as keyof TransportOption] ?? '';
      const bValue: string | number | boolean = b[column as keyof TransportOption] ?? '';

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const filterFunction = useCallback((data: TransportOption[], filters: Record<string, string>) => {
    return data.filter(transport => {
      // 搜尋功能：檢查名稱是否包含搜尋詞
      const matchesSearch = !searchTerm || transport.name.toLowerCase().includes(searchTerm.toLowerCase());

      return (
        matchesSearch &&
        (!filters.name || transport.name.toLowerCase().includes(filters.name.toLowerCase())) &&
        (!filters.is_group_cost || (transport.is_group_cost ?? false).toString() === filters.is_group_cost) &&
        (!filters.price_per_person || (transport.price_per_person || 0).toString().includes(filters.price_per_person)) &&
        (!filters.pricePerGroup || (transport.pricePerGroup || 0).toString().includes(filters.pricePerGroup)) &&
        (!filters.capacity || (transport.capacity || 0).toString().includes(filters.capacity))
      );
    });
  }, [searchTerm]);

  const { data: filteredAndSortedTransport, handleSort, handleFilter } = useEnhancedTable(
    transportOptions,
    sortFunction,
    filterFunction
  );

  // 重新計算過濾結果（當搜尋詞改變時）
  const finalFilteredTransport = useMemo(() => {
    return filterFunction(filteredAndSortedTransport, {});
  }, [filteredAndSortedTransport, filterFunction]);

  const handleAddTransport = () => {
    if (!newTransport.name.trim()) return;

    // 功能: 新增交通選項到資料庫
    resetForm();
  };

  const handleEditTransport = (transport: TransportOption) => {
    setEditingTransport(transport);
    setNewTransport({
      name: transport.name,
      price_per_person: transport.price_per_person || 0,
      pricePerGroup: transport.pricePerGroup || 0,
      capacity: transport.capacity || 0,
      is_group_cost: transport.is_group_cost || false
    });
    setIsAddDialogOpen(true);
  };

  const handleDeleteTransport = (_transportId: string) => {
    if (confirm('確定要刪除此交通選項嗎？')) {
      // 功能: 刪除交通選項從資料庫
    }
  };

  const resetForm = () => {
    setNewTransport({
      name: '',
      price_per_person: 0,
      pricePerGroup: 0,
      capacity: 0,
      is_group_cost: false
    });
    setIsAddDialogOpen(false);
    setEditingTransport(null);
  };

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        {...{
        title: "交通選項管理",
        icon: Car} as any}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '資料庫管理', href: '/database' },
          { label: '交通選項', href: '/database/transport' }
        ]}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋交通方式..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增交通選項"
        actions={
          <span className="text-sm text-morandi-secondary">
            共 {finalFilteredTransport.length} 筆交通選項
          </span>
        }
      />

      <ContentContainer>
        <EnhancedTable
          columns={tableColumns}
          data={finalFilteredTransport}
          onSort={handleSort}
          onFilter={handleFilter}
          selection={undefined}
        />

        {finalFilteredTransport.length === 0 && (
          <div className="text-center py-12 text-morandi-secondary">
            <Car size={48} className="mx-auto mb-4 opacity-50" />
            <p>{transportOptions.length === 0 ? '此地區尚未建立交通選項' : '無符合條件的交通選項'}</p>
          </div>
        )}
      </ContentContainer>

      {/* 新增/編輯交通選項對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransport ? '編輯交通選項' : '新增交通選項'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-morandi-primary">交通方式名稱</label>
              <Input
                value={newTransport.name}
                onChange={(e) => setNewTransport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：機場接送、包車一日"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">費用類型</label>
              <Select
                value={newTransport.is_group_cost.toString()}
                onValueChange={(value) => setNewTransport(prev => ({ ...prev, is_group_cost: value === 'true' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">個人費用</SelectItem>
                  <SelectItem value="true">團體分攤</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-morandi-primary">個人價格</label>
                <Input
                  type="number"
                  value={newTransport.price_per_person || ''}
                  onChange={(e) => setNewTransport(prev => ({ ...prev, price_per_person: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-morandi-primary">團體價格</label>
                <Input
                  type="number"
                  value={newTransport.pricePerGroup || ''}
                  onChange={(e) => setNewTransport(prev => ({ ...prev, pricePerGroup: Number(e.target.value) || 0 }))}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">載客量</label>
              <Input
                type="number"
                value={newTransport.capacity || ''}
                onChange={(e) => setNewTransport(prev => ({ ...prev, capacity: Number(e.target.value) || 0 }))}
                placeholder="最大載客人數"
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={resetForm}>
                取消
              </Button>
              <Button
                onClick={handleAddTransport}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {editingTransport ? '更新' : '新增'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}