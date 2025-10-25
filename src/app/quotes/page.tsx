'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useQuotes } from '@/features/quotes/hooks/useQuotes';
import { useTourStore } from '@/stores';
import { Calculator, FileText, Users, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';
import { QUOTE_STATUS_LABELS } from '@/constants/quote-status';

const _statusFilters = ['all', 'proposed', 'approved'];

export default function QuotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items: tours } = useTourStore();
  const { quotes, addQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuotes();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuote, setNewQuote] = useState<{
    name: string;
    status: 'proposed' | 'approved';
    group_size: number;
  }>({
    name: '',
    status: 'proposed',
    group_size: 1,
  });

  // 載入報價單資料 - 延遲載入優化
  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuotes();
    }, 100);
    return () => clearTimeout(timer);
  }, [loadQuotes]); // 只在組件掛載時執行一次（添加 loadQuotes 依賴）

  // 檢查 URL 參數，自動開啟新增對話框
  useEffect(() => {
    const tourId = searchParams.get('tour_id');
    // 只在有 tour_id 且對話框未開啟時檢查（避免新增完後重複觸發）
    if (tourId && !isAddDialogOpen) {
      // 檢查該團是否已有報價單
      const existingQuote = quotes.find(q => q.tour_id === tourId);
      if (!existingQuote) {
        // 沒有報價單，找到旅遊團資料並開啟對話框
        const tour = tours.find(t => t.id === tourId);
        if (tour) {
          console.log('📋 自動開啟新增對話框，團名:', tour.name);
          setNewQuote({
            name: tour.name,
            status: 'proposed',
            group_size: tour.max_participants || 1,
          });
          setIsAddDialogOpen(true);
        }
      } else {
        // 已有報價單，直接跳轉到該報價單
        console.log('🔄 該團已有報價單，跳轉到:', existingQuote.id);
        router.replace(`/quotes/${existingQuote.id}`);
      }
    }
  }, [searchParams, quotes, tours, router, isAddDialogOpen]);

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'quote_number',
      label: '編號',
      sortable: true,
      render: (value, quote) => {
        // 如果有關聯旅遊團，顯示旅遊團編號
        if (quote.tour_id) {
          const relatedTour = tours.find(t => t.id === quote.tour_id);
          if (relatedTour?.code) {
            return (
              <span className="text-sm text-morandi-gold font-mono" title="旅遊團編號">
                {relatedTour.code}
              </span>
            );
          }
        }
        // 否則顯示報價單自己的編號
        return (
          <span className="text-sm text-morandi-secondary font-mono">
            {(quote as any).code || '-'}
          </span>
        );
      },
    },
    {
      key: 'name',
      label: '團體名稱',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm font-medium text-morandi-primary">{quote.name}</span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, quote) => (
        <span className={cn(
          'text-sm font-medium',
          getStatusColor(quote.status)
        )}>
          {QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] || quote.status}
        </span>
      ),
    },
    {
      key: 'group_size',
      label: '人數',
      sortable: true,
      render: (value, quote) => (
        <div className="flex items-center text-sm text-morandi-secondary">
          <Users size={14} className="mr-1" />
          {quote.group_size}人
        </div>
      ),
    },
    {
      key: 'total_cost',
      label: '總成本',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm text-morandi-secondary">
          NT$ {quote.total_cost.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立時間',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm text-morandi-secondary">
          {new Date(quote.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ], [tours]);

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;

    // 搜尋 - 搜尋所有文字欄位
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      quote.name.toLowerCase().includes(searchLower) ||
      quote.quote_number?.toLowerCase().includes(searchLower) ||
      quote.status.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleAddQuote = async () => {
    if (!newQuote.name.trim()) return;

    const defaultCategories = [
      { id: 'transport', name: '交通', items: [], total: 0 },
      { id: 'group-transport', name: '團體分攤', items: [], total: 0 },
      { id: 'accommodation', name: '住宿', items: [], total: 0 },
      { id: 'meals', name: '餐飲', items: [], total: 0 },
      { id: 'activities', name: '活動', items: [], total: 0 },
      { id: 'others', name: '其他', items: [], total: 0 },
      { id: 'guide', name: '領隊導遊', items: [], total: 0 }
    ];

    try {
      // 從 URL 取得 tour_id（如果有）
      const tourId = searchParams.get('tour_id');

      // 新增報價單並取得完整物件
      const newQuoteObj = await addQuote({
        ...newQuote,
        ...(tourId && { tour_id: tourId }), // 如果有 tour_id，加入報價單資料
        accommodation_days: 0,
        categories: defaultCategories,
        total_cost: 0,
      });

      console.log('✅ 新增報價單完成:', newQuoteObj);
      console.log('報價單 ID:', newQuoteObj?.id);

      // 重置表單並關閉對話框
      setNewQuote({
        name: '',
        status: 'proposed',
        group_size: 1,
      });
      setIsAddDialogOpen(false);

      // 直接跳轉到詳細頁面開始編輯
      if (newQuoteObj?.id) {
        console.log('🔄 準備跳轉到:', `/quotes/${newQuoteObj.id}`);
        // 使用 replace 避免返回時回到帶參數的列表頁
        router.replace(`/quotes/${newQuoteObj.id}`);
      } else {
        console.error('❌ 報價單 ID 不存在，無法跳轉');
      }
    } catch (error) {
      logger.error('新增報價單失敗:', error);
      alert('新增報價單失敗，請重試');
    }
  };

  const handleQuoteClick = (quote) => {
    router.push(`/quotes/${quote.id}`);
  };

  const handleDuplicateQuote = async (quote_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = await duplicateQuote(quote_id);
      if (duplicated && (duplicated as any).id) {
        // 跳轉到新報價單
        router.push(`/quotes/${(duplicated as any).id}`);
      } else {
        alert('複製報價單失敗，請重試');
      }
    } catch (error) {
      logger.error('❌ 複製報價單失敗:', error);
      alert('複製報價單失敗，請重試');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'proposed': 'text-morandi-gold',
      'approved': 'text-green-600'
    };
    return colors[status] || 'text-morandi-secondary';
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' }
        ]}
        tabs={[
          { value: 'all', label: '全部', icon: Calculator },
          { value: 'proposed', label: '提案', icon: FileText },
          { value: 'approved', label: '已核准', icon: FileText }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋報價單名稱..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增報價單"
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
        className="min-h-full"
        columns={tableColumns}
        data={filteredQuotes}
        searchableFields={['name']}
        searchTerm={searchTerm}
        onRowClick={(quote) => handleQuoteClick(quote)}
        bordered={true}
        actions={(quote) => (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                handleQuoteClick(quote);
              }}
              className="text-morandi-gold hover:bg-morandi-gold/10"
              title="編輯報價單"
            >
              <Calculator size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => handleDuplicateQuote(quote.id, e)}
              className="text-morandi-blue hover:bg-morandi-blue/10"
              title="複製報價單"
            >
              <Copy size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuote(quote.id);
              }}
              className="text-morandi-red hover:bg-morandi-red/10"
              title="刪除報價單"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        )}
      />
      </div>

      {/* 新增報價單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新增報價單</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newQuote.name.trim()) {
                handleAddQuote();
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-medium text-morandi-primary">團體名稱</label>
              <Input
                value={newQuote.name}
                onChange={(e) => setNewQuote(prev => ({ ...prev, name: e.target.value }))}
                placeholder="輸入團體名稱"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">人數</label>
              <Input
                type="number"
                value={newQuote.group_size}
                onChange={(e) => setNewQuote(prev => ({ ...prev, group_size: Number(e.target.value) || 0 }))}
                placeholder="1"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">狀態</label>
              <Select
                value={newQuote.status}
                onValueChange={(value) => setNewQuote(prev => ({ ...prev, status: value as 'proposed' | 'approved' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposed">提案</SelectItem>
                  <SelectItem value="approved">已核准</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={!newQuote.name.trim()}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增 <span className="ml-1 text-xs opacity-70">(Enter)</span>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}