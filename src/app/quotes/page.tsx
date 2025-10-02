'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { useQuoteStore } from '@/stores/quote-store';
import { Calculator, FileText, Users, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusFilters = ['全部', '提案', '最終版本'];

export default function QuotesPage() {
  const router = useRouter();
  const { quotes, addQuote, deleteQuote, duplicateQuote, loadQuotes } = useQuoteStore();
  const [statusFilter, setStatusFilter] = useState<string>('全部');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newQuote, setNewQuote] = useState({
    name: '',
    status: '提案' as const,
    groupSize: 1,
  });

  // 載入報價單資料
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // 表格配置
  const tableColumns: TableColumn[] = useMemo(() => [
    {
      key: 'quoteNumber',
      label: '報價單號',
      sortable: true,
      render: (value, quote) => (
        <span className="text-sm text-morandi-secondary font-mono">
          {quote.quoteNumber || '-'}
        </span>
      ),
    },
    {
      key: 'name',
      label: '團體名稱',
      sortable: true,
      render: (value, quote) => (
        <span className="font-medium text-morandi-primary">{quote.name}</span>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value, quote) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          getStatusBadge(quote.status)
        )}>
          {quote.status}
        </span>
      ),
    },
    {
      key: 'groupSize',
      label: '人數',
      sortable: true,
      render: (value, quote) => (
        <div className="flex items-center text-morandi-secondary">
          <Users size={14} className="mr-1" />
          {quote.groupSize}人
        </div>
      ),
    },
    {
      key: 'totalCost',
      label: '總成本',
      sortable: true,
      render: (value, quote) => (
        <span className="text-morandi-secondary">
          NT$ {quote.totalCost.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: '建立時間',
      sortable: true,
      render: (value, quote) => (
        <span className="text-morandi-secondary">
          {new Date(quote.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  const filteredQuotes = quotes.filter(quote => {
    const matchesStatus = statusFilter === '全部' || quote.status === statusFilter;
    return matchesStatus;
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
      // 新增報價單並取得完整物件
      const newQuoteObj = await addQuote({
        ...newQuote,
        accommodationDays: 0,
        categories: defaultCategories,
        totalCost: 0,
      });

      // 重置表單
      setNewQuote({
        name: '',
        status: '提案',
        groupSize: 1,
      });
      setIsAddDialogOpen(false);

      // 直接跳轉到詳細頁面開始編輯
      if (newQuoteObj?.id) {
        router.push(`/quotes/${newQuoteObj.id}`);
      }
    } catch (error) {
      console.error('新增報價單失敗:', error);
      alert('新增報價單失敗，請重試');
    }
  };

  const handleQuoteClick = (quote: any) => {
    router.push(`/quotes/${quote.id}`);
  };

  const handleDuplicateQuote = async (quoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const duplicated = duplicateQuote(quoteId);
      if (duplicated) {
        // 跳轉到新報價單
        router.push(`/quotes/${duplicated.id}`);
      } else {
        alert('複製報價單失敗，請重試');
      }
    } catch (error) {
      console.error('❌ 複製報價單失敗:', error);
      alert('複製報價單失敗，請重試');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      '提案': 'bg-morandi-gold text-white',
      '最終版本': 'bg-morandi-green text-white'
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="報價單管理"
        icon={Calculator}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '報價單管理', href: '/quotes' }
        ]}
        tabs={[
          { value: '全部', label: '全部', icon: Calculator },
          { value: '提案', label: '提案', icon: FileText },
          { value: '最終版本', label: '最終版本', icon: FileText }
        ]}
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋報價單名稱..."
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增報價單"
        actions={
          <div className="flex items-center gap-4">
            <div className="text-sm text-morandi-secondary">
              {filteredQuotes.length} 個報價單
            </div>
          </div>
        }
      />

      <EnhancedTable
        columns={tableColumns}
        data={filteredQuotes}
        searchableFields={['name']}
        searchTerm={searchTerm}
        onRowClick={(quote) => handleQuoteClick(quote)}
        bordered={true}
        actions={(quote) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuoteClick(quote);
              }}
              className="p-1 hover:bg-morandi-gold/10 rounded transition-colors"
              title="編輯報價單"
            >
              <Calculator size={14} className="text-morandi-gold" />
            </button>
            <button
              onClick={(e) => handleDuplicateQuote(quote.id, e)}
              className="p-1 hover:bg-morandi-blue/10 rounded transition-colors"
              title="複製報價單"
            >
              <Copy size={14} className="text-morandi-blue" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteQuote(quote.id);
              }}
              className="p-1 hover:bg-morandi-red/10 rounded transition-colors"
              title="刪除報價單"
            >
              <Trash2 size={14} className="text-morandi-red" />
            </button>
          </div>
        )}
        emptyState={
          <div className="text-center py-8 text-morandi-secondary">
            <Calculator size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-morandi-primary mb-2">
              {statusFilter === '全部' ? '還沒有任何報價單' : `沒有「${statusFilter}」狀態的報價單`}
            </p>
            <p className="text-sm text-morandi-secondary mb-6">
              {statusFilter === '全部' ? '點擊右上角「新增報價單」開始建立' : '切換到其他標籤或新增報價單'}
            </p>
            <div className="text-sm text-morandi-secondary space-y-1">
              <p>• 報價單管理包含團體名稱、狀態、人數、總成本和建立時間</p>
              <p>• 支援狀態篩選（提案/最終版本）和詳細的成本類別計算</p>
              <p>• 可直接編輯報價內容或從報價單轉建立旅遊團</p>
            </div>
          </div>
        }
      />

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
                value={newQuote.groupSize}
                onChange={(e) => setNewQuote(prev => ({ ...prev, groupSize: Number(e.target.value) || 0 }))}
                placeholder="1"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-morandi-primary">狀態</label>
              <Select
                value={newQuote.status}
                onValueChange={(value) => setNewQuote(prev => ({ ...prev, status: value as '提案' | '最終版本' }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="提案">提案</SelectItem>
                  <SelectItem value="最終版本">最終版本</SelectItem>
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