'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
import { EnhancedTable, TableColumn} from '@/components/ui/enhanced-table';
// TODO: usePaymentStore deprecated - import { usePaymentStore } from '@/stores';
import { DisbursementOrder, PaymentRequest } from '@/stores/types';
import { FileText, Calendar, Wallet, CheckCircle, Clock, Banknote, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusLabels = {
  pending: '已提交',
  processing: '處理中',
  confirmed: '已確認',
  paid: '已付款'
};

const statusColors = {
  pending: 'bg-morandi-gold',
  processing: 'bg-blue-500',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary'
};

const disbursementStatusLabels = {
  pending: '待確認',
  confirmed: '已確認',
  paid: '已付款'
};

const disbursementStatusColors = {
  pending: 'bg-morandi-gold',
  confirmed: 'bg-morandi-green',
  paid: 'bg-morandi-primary'
};

export default function DisbursementPage() {
  const searchParams = useSearchParams();

  // TODO: 暫時使用空資料，等待 payment store 完整實作
  const {
    payment_requests = [],
    disbursement_orders = [],
    addToCurrentDisbursementOrder = () => {},
    removeFromDisbursementOrder = () => {},
    confirmDisbursementOrder = () => {},
    getCurrentWeekDisbursementOrder = () => null,
    getPendingPaymentRequests = () => [],
    getProcessingPaymentRequests = () => [],
    getNextThursday = () => new Date().toLocaleDateString('zh-TW'),
    createDisbursementOrder = () => {},
    generateDisbursementNumber = () => 'DISB-000001'
  } = {} as unknown;

  const [activeTab, setActiveTab] = useState<'pending' | 'current' | 'all'>('pending');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRequestsForNew, setSelectedRequestsForNew] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogSearchTerm, setDialogSearchTerm] = useState('');

  // 支援 URL 參數設定初始分頁
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['pending', 'current', 'all'].includes(tab)) {
      setActiveTab(tab as 'pending' | 'current' | 'all');
    }
  }, [searchParams]);

  // 新增出納單
  const handleCreateDisbursement = () => {
    if (selectedRequestsForNew.length === 0) return;

    createDisbursementOrder(selectedRequestsForNew);
    setIsAddDialogOpen(false);
    setSelectedRequestsForNew([]);
    setDialogSearchTerm('');
    setActiveTab('current'); // 切換到本週出帳查看新建的出納單
  };

  // 獲取數據 - 加上防禦性檢查，避免 deprecated store 導致崩潰
  const pendingRequests = useMemo(() => getPendingPaymentRequests ? getPendingPaymentRequests() : [], [getPendingPaymentRequests]);
  const _processingRequests = useMemo(() => getProcessingPaymentRequests ? getProcessingPaymentRequests() : [], [getProcessingPaymentRequests]);
  const currentOrder = useMemo(() => getCurrentWeekDisbursementOrder ? getCurrentWeekDisbursementOrder() : null, [getCurrentWeekDisbursementOrder]);
  const nextThursday = useMemo(() => getNextThursday ? getNextThursday() : new Date(), [getNextThursday]);

  // 新增出納單時的請款單勾選
  const handleSelectRequestForNew = (requestId: string) => {
    setSelectedRequestsForNew(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // 全選/取消全選（新增出納單用）
  const handleSelectAllForNew = () => {
    if (selectedRequestsForNew.length === pendingRequests.length) {
      setSelectedRequestsForNew([]);
    } else {
      setSelectedRequestsForNew(pendingRequests.map((r: PaymentRequest) => r.id));
    }
  };

  // 計算選中金額
  const selectedAmount = useMemo(() => {
    return selectedRequests.reduce((sum, requestId) => {
      const request = pendingRequests.find((r: PaymentRequest) => r.id === requestId);
      return sum + (request?.total_amount || 0);
    }, 0);
  }, [selectedRequests, pendingRequests]);

  // 處理勾選
  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  // 全選/取消全選
  const _handleSelectAll = () => {
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests.map((r: PaymentRequest) => r.id));
    }
  };

  // 加入出納單
  const handleAddToDisbursement = () => {
    if (selectedRequests.length === 0) return;

    addToCurrentDisbursementOrder(selectedRequests);
    setSelectedRequests([]);
  };

  // 從出納單移除
  const handleRemoveFromDisbursement = useCallback((paymentRequestId: string) => {
    if (!currentOrder) return;
    removeFromDisbursementOrder(currentOrder.id, paymentRequestId);
  }, [currentOrder, removeFromDisbursementOrder]);

  // 確認出納單
  const handleConfirmDisbursement = () => {
    if (!currentOrder) return;
    confirmDisbursementOrder(currentOrder.id, '1'); // TODO: 使用實際用戶ID
  };

  // 待出帳表格配置
  const pendingColumns: TableColumn[] = useMemo(() => [
    {
      key: 'select',
      label: '',
      width: '50px',
      render: (_value: unknown, row: any) => (
        <input
          type="checkbox"
          checked={selectedRequests.includes(row.id)}
          onChange={() => handleSelectRequest(row.id)}
          className="rounded border-morandi-secondary"
        />
      )
    },
    {
      key: 'request_number',
      label: '請款單號',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'code',
      label: '團號',
      sortable: true,
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'tour_name',
      label: '團體名稱',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value}</div>
      )
    },
    {
      key: 'total_amount',
      label: '金額',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      )
    },
    {
      key: 'request_date',
      label: '請款日期',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary">{value}</div>
      )
    },
    {
      key: 'status',
      label: '狀態',
      render: (value) => (
        <Badge className={cn('text-white', statusColors[value as keyof typeof statusColors])}>
          {statusLabels[value as keyof typeof statusLabels]}
        </Badge>
      )
    }
  ], [selectedRequests]);

  // 本週出帳表格配置
  const currentOrderColumns: TableColumn[] = useMemo(() => [
    {
      key: 'request_number',
      label: '請款單號',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'code',
      label: '團號',
      sortable: true,
      render: (value) => (
        <div className="font-medium">{value}</div>
      )
    },
    {
      key: 'tour_name',
      label: '團體名稱',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary truncate max-w-[200px]">{value}</div>
      )
    },
    {
      key: 'total_amount',
      label: '金額',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      )
    },
    {
      key: 'request_date',
      label: '請款日期',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary">{value}</div>
      )
    },
    {
      key: 'actions',
      label: '操作',
      width: '80px',
      render: (_value, row) => (
        <button
          onClick={() => handleRemoveFromDisbursement(row.id)}
          disabled={currentOrder?.status !== 'pending'}
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="移除"
        >
          <X size={14} />
        </button>
      )
    }
  ], [currentOrder, handleRemoveFromDisbursement]);

  // 歷史記錄表格配置
  const historyColumns: TableColumn[] = useMemo(() => [
    {
      key: 'order_number',
      label: '出納單號',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-morandi-primary">{value}</div>
      )
    },
    {
      key: 'disbursementDate',
      label: '出帳日期',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary">{value}</div>
      )
    },
    {
      key: 'total_amount',
      label: '總金額',
      sortable: true,
      render: (value) => (
        <div className="font-medium text-right">NT$ {value.toLocaleString()}</div>
      )
    },
    {
      key: 'paymentRequestIds',
      label: '請款單數',
      render: (value) => (
        <div className="text-center">{value.length} 筆</div>
      )
    },
    {
      key: 'status',
      label: '狀態',
      render: (value) => (
        <Badge className={cn('text-white', disbursementStatusColors[value as keyof typeof disbursementStatusColors])}>
          {disbursementStatusLabels[value as keyof typeof disbursementStatusLabels]}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: '建立時間',
      sortable: true,
      render: (value) => (
        <div className="text-sm text-morandi-secondary">
          {new Date(value).toLocaleDateString('zh-TW')}
        </div>
      )
    }
  ], []);

  // 獲取本週出帳的請款單詳情
  const currentOrderRequests = useMemo(() => {
    if (!currentOrder) return [];
    return currentOrder.payment_request_ids.map((id: string) =>
      payment_requests.find((r: PaymentRequest) => r.id === id)
    ).filter(Boolean) as PaymentRequest[];
  }, [currentOrder, payment_requests]);


  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="出納單管理"
        tabs={[
          { value: 'pending', label: '待出帳', icon: FileText },
          { value: 'current', label: '本週出帳', icon: Calendar },
          { value: 'all', label: '出納單列表', icon: Wallet }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as unknown)}
        onAdd={() => setIsAddDialogOpen(true)}
        addLabel="新增出納單"
        showSearch={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="搜尋請款單號、團號或團名..."
      />

      <div className="flex-1 overflow-auto">
        {/* 待出帳頁面 */}
        {activeTab === 'pending' && (
          <>
            {/* 批次操作列 */}
            {selectedRequests.length > 0 && (
              <div className="bg-morandi-gold/10 border border-morandi-gold/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-morandi-secondary">
                    已選 {selectedRequests.length} 筆，總金額 NT$ {selectedAmount.toLocaleString()}
                  </span>
                  <Button
                    onClick={handleAddToDisbursement}
                    className="bg-morandi-gold hover:bg-morandi-gold/90"
                  >
                    加入本週出帳
                  </Button>
                </div>
              </div>
            )}

            {/* 表格 */}
            {pendingRequests.length > 0 && (
              <div className="mb-4 flex items-center justify-end">
                <div className="text-sm text-morandi-secondary">
                  {pendingRequests.length} 筆 • 下次出帳日：{nextThursday}
                </div>
              </div>
            )}
            <EnhancedTable
              className="min-h-full"
              data={pendingRequests}
              columns={pendingColumns}
              searchableFields={['request_number', 'code', 'tour_name']}
              initialPageSize={20}
              searchTerm={searchTerm}
            />
          </>
        )}

        {/* 本週出帳頁面 */}
        {activeTab === 'current' && (
          <div className="space-y-4">
            {currentOrder ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-morandi-primary">
                      {currentOrder.order_number}
                    </h3>
                    <p className="text-sm text-morandi-secondary">
                      出帳日期：{currentOrder.disbursement_date} • {currentOrder.payment_request_ids.length} 筆請款單
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-morandi-primary">
                        NT$ {currentOrder.total_amount.toLocaleString()}
                      </p>
                    </div>
                    {currentOrder.status === 'pending' && (
                      <Button
                        onClick={handleConfirmDisbursement}
                        className="bg-morandi-green hover:bg-morandi-green/90"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        確認出帳
                      </Button>
                    )}
                  </div>
                </div>

                <EnhancedTable
                  className="min-h-full"
                  data={currentOrderRequests}
                  columns={currentOrderColumns}
                  searchableFields={['request_number', 'code', 'tour_name']}
                  initialPageSize={20}
                  searchTerm={searchTerm}
                />
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-morandi-secondary mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-morandi-primary mb-2">
                  本週尚無出帳計劃
                </h3>
                <p className="text-morandi-secondary mb-4">
                  請先到「待出帳」頁面勾選需要出帳的請款單
                </p>
                <Button
                  onClick={() => setActiveTab('pending')}
                  variant="outline"
                >
                  前往選擇請款單
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 出納單列表頁面 */}
        {activeTab === 'all' && (
          <EnhancedTable
            className="min-h-full"
            data={disbursement_orders}
            columns={historyColumns}
            searchableFields={['order_number']}
            initialPageSize={20}
            searchTerm={searchTerm}
          />
        )}
      </div>

      {/* 新增出納單對話框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">新增出納單</DialogTitle>
            <p className="text-sm text-morandi-secondary">
              {generateDisbursementNumber ? generateDisbursementNumber() : '載入中...'} • {nextThursday}
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {pendingRequests.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-morandi-secondary opacity-50" />
                  <p className="text-lg text-morandi-secondary">目前沒有待出帳的請款單</p>
                </div>
              </div>
            ) : (
              <>
                {/* 統計和搜尋 */}
                <div className="flex items-center justify-between py-3 px-4 border-b bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium">共 {pendingRequests.length} 筆請款單</span>
                    {selectedRequestsForNew.length > 0 && (
                      <span className="text-sm text-morandi-secondary">
                        • 已選 {selectedRequestsForNew.length} 筆 •
                        <span className="font-bold text-morandi-primary ml-1">
                          NT$ {selectedRequestsForNew.reduce((sum, id: string) => {
                            const request = pendingRequests.find((r: PaymentRequest) => r.id === id);
                            return sum + (request?.total_amount || 0);
                          }, 0).toLocaleString()}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="搜尋請款單號、團號或團名..."
                      value={dialogSearchTerm}
                      onChange={(e) => setDialogSearchTerm(e.target.value)}
                      className="w-64 px-3 py-1 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-morandi-primary"
                    />
                  </div>
                </div>

                {/* 表格 */}
                <div className="flex-1 overflow-hidden">
                  <EnhancedTable
                    data={pendingRequests}
                    columns={[
                      {
                        key: 'select',
                        label: (
                          <input
                            type="checkbox"
                            checked={selectedRequestsForNew.length === pendingRequests.length && pendingRequests.length > 0}
                            onChange={handleSelectAllForNew}
                            className="rounded border-morandi-secondary"
                          />
                        ),
                        width: '50px',
                        render: (_value, row) => (
                          <input
                            type="checkbox"
                            checked={selectedRequestsForNew.includes(row.id)}
                            onChange={() => handleSelectRequestForNew(row.id)}
                            className="rounded border-morandi-secondary"
                          />
                        )
                      },
                      {
                        key: 'request_number',
                        label: '請款單號',
                        sortable: true,
                        render: (value) => (
                          <div className="font-medium text-morandi-primary">{value}</div>
                        )
                      },
                      {
                        key: 'code',
                        label: '團號',
                        sortable: true,
                        render: (value) => (
                          <div className="font-medium">{value}</div>
                        )
                      },
                      {
                        key: 'tour_name',
                        label: '團名',
                        sortable: true,
                        render: (value) => (
                          <div className="text-morandi-secondary">{value}</div>
                        )
                      },
                      {
                        key: 'request_date',
                        label: '請款日期',
                        sortable: true,
                        render: (value) => (
                          <div className="text-sm text-morandi-secondary">{value}</div>
                        )
                      },
                      {
                        key: 'total_amount',
                        label: '金額',
                        sortable: true,
                        render: (value) => (
                          <div className="font-bold text-morandi-primary text-right">
                            NT$ {value.toLocaleString()}
                          </div>
                        )
                      }
                    ]}
                    searchableFields={['request_number', 'code', 'tour_name']}
                    searchTerm={dialogSearchTerm}
                    initialPageSize={15}
                  />
                </div>
              </>
            )}
          </div>

          {/* 底部操作區 */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setSelectedRequestsForNew([]);
                  setDialogSearchTerm('');
                }}
                className="px-6"
              >
                取消
              </Button>
              <Button
                onClick={handleCreateDisbursement}
                disabled={selectedRequestsForNew.length === 0}
                className="bg-morandi-gold hover:bg-morandi-gold/90 px-6"
              >
                建立出納單 ({selectedRequestsForNew.length} 筆)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}