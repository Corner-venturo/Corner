/**
 * 收款管理頁面（完整重構版）
 *
 * 功能：
 * 1. 收款單列表（新表頭設計）
 * 2. 支援 5 種收款方式（現金/匯款/刷卡/支票/LinkPay）
 * 3. LinkPay 自動生成付款連結
 * 4. 會計確認實收金額流程
 * 5. Realtime 即時同步
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// Stores & Hooks
import {
  useOrderStore,
  useReceiptStore,
  useLinkPayLogStore,
  useAuthStore,
} from '@/stores';
import {
  useRealtimeForOrders,
  useRealtimeForReceipts,
  useRealtimeForLinkPayLogs
} from '@/hooks/use-realtime-hooks';

// Types
import type {
  Receipt,
  ReceiptItem,
  ReceiptType,
  ReceiptStatus,
  RECEIPT_TYPE_LABELS,
  RECEIPT_STATUS_LABELS,
  RECEIPT_STATUS_ICONS,
} from '@/stores';

// Utils
import { generateReceiptNumber } from '@/lib/utils/receipt-number-generator';

// ============================================
// 常數
// ============================================

const RECEIPT_TYPES = {
  BANK_TRANSFER: 0,
  CASH: 1,
  CREDIT_CARD: 2,
  CHECK: 3,
  LINK_PAY: 4,
} as const;

const RECEIPT_TYPE_OPTIONS = [
  { value: RECEIPT_TYPES.CASH, label: '現金' },
  { value: RECEIPT_TYPES.BANK_TRANSFER, label: '匯款' },
  { value: RECEIPT_TYPES.CREDIT_CARD, label: '刷卡' },
  { value: RECEIPT_TYPES.CHECK, label: '支票' },
  { value: RECEIPT_TYPES.LINK_PAY, label: 'LinkPay' },
];

const BANK_ACCOUNTS = [
  { value: '國泰', label: '國泰銀行' },
  { value: '合庫', label: '合作金庫' },
];

// ============================================
// 主組件
// ============================================

export default function PaymentsPage() {
  // ✅ Realtime 訂閱
  useRealtimeForOrders();
  useRealtimeForReceipts();
  useRealtimeForLinkPayLogs();

  // Stores
  const { items: orders } = useOrderStore();
  const { items: receipts, create: createReceipt, fetchAll: fetchReceipts } = useReceiptStore();
  const { items: linkpayLogs } = useLinkPayLogStore();
  const { user } = useAuthStore();

  // 狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentItems, setPaymentItems] = useState<ReceiptItem[]>([
    {
      id: '1',
      receipt_type: RECEIPT_TYPES.CASH,
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 初始化載入資料
  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // 過濾可用訂單（未收款或部分收款）
  const availableOrders = useMemo(() => {
    return orders.filter(order =>
      order.payment_status === 'unpaid' || order.payment_status === 'partial'
    );
  }, [orders]);

  // 選中的訂單資訊
  const selectedOrder = useMemo(() => {
    return orders.find(order => order.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  // 計算總收款金額
  const totalAmount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [paymentItems]);

  // ============================================
  // 表格欄位定義
  // ============================================

  const columns = [
    {
      key: 'receipt_number',
      label: '收款單號',
      sortable: true,
      render: (value: string) => (
        <div className="font-mono text-sm font-medium text-morandi-primary">
          {value}
        </div>
      )
    },
    {
      key: 'order_number',
      label: '訂單編號',
      sortable: true,
      render: (value: string, row: Receipt) => (
        <div className="text-sm">
          <div className="font-medium text-morandi-primary">{value || '-'}</div>
          <div className="text-xs text-morandi-secondary">{row.receipt_account || '-'}</div>
        </div>
      )
    },
    {
      key: 'receipt_type',
      label: '收款方式',
      sortable: true,
      render: (value: number) => {
        const label = RECEIPT_TYPE_OPTIONS.find(o => o.value === value)?.label || '-';
        return (
          <div className="text-sm text-morandi-primary">
            {label}
          </div>
        );
      }
    },
    {
      key: 'receipt_amount',
      label: '應收金額',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm font-medium text-morandi-primary">
          NT$ {value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'actual_amount',
      label: '實收金額',
      sortable: true,
      render: (value: number, row: Receipt) => {
        if (row.status === 0) {
          return (
            <div className="text-sm text-morandi-secondary italic">
              待確認
            </div>
          );
        }
        return (
          <div className="text-sm font-medium text-morandi-green">
            NT$ {value.toLocaleString()}
          </div>
        );
      }
    },
    {
      key: 'receipt_date',
      label: '收款日期',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-morandi-primary">
          {new Date(value).toLocaleDateString('zh-TW')}
        </div>
      )
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value: number) => {
        const isPending = value === 0;
        return (
          <div className={cn(
            'text-sm font-medium',
            isPending ? 'text-morandi-gold' : 'text-morandi-green'
          )}>
            {isPending ? '🟡' : '✅'} {isPending ? '待確認' : '已確認'}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: '操作',
      sortable: false,
      render: (_value: unknown, row: Receipt) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewDetail(row)}
        >
          詳情
        </Button>
      )
    }
  ];

  // ============================================
  // 事件處理
  // ============================================

  const addPaymentItem = () => {
    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      receipt_type: RECEIPT_TYPES.CASH,
      amount: 0,
      transaction_date: new Date().toISOString().split('T')[0]
    };
    setPaymentItems(prev => [...prev, newItem]);
  };

  const removePaymentItem = (id: string) => {
    if (paymentItems.length > 1) {
      setPaymentItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const updatePaymentItem = (id: string, updates: Partial<ReceiptItem>) => {
    setPaymentItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const resetForm = () => {
    setSelectedOrderId('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setPaymentItems([
      {
        id: '1',
        receipt_type: RECEIPT_TYPES.CASH,
        amount: 0,
        transaction_date: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const handleViewDetail = (receipt: Receipt) => {
    // TODO: 打開收款單詳情頁面
    toast.info(`查看收款單 ${receipt.receipt_number}`);
  };

  const handleSave = async () => {
    if (!selectedOrderId || paymentItems.length === 0 || totalAmount <= 0) {
      toast.error('請填寫完整資訊');
      return;
    }

    if (!user?.id) {
      toast.error('未登入');
      return;
    }

    setIsSubmitting(true);

    try {
      // 為每個收款項目建立收款單
      for (const item of paymentItems) {
        // 生成收款單號
        const receiptNumber = generateReceiptNumber(item.transaction_date, receipts);

        // 建立收款單
        const newReceipt = await createReceipt({
          receipt_number: receiptNumber,
          workspace_id: user.workspace_id || '',
          order_id: selectedOrderId,
          order_number: selectedOrder?.order_number || '',
          tour_name: selectedOrder?.tour_name || '',
          receipt_date: item.transaction_date,
          receipt_type: item.receipt_type,
          receipt_amount: item.amount,
          actual_amount: 0, // 待會計確認
          status: 0, // 待確認
          receipt_account: item.receipt_account || null,
          email: item.email || null,
          payment_name: item.payment_name || null,
          pay_dateline: item.pay_dateline || null,
          handler_name: item.handler_name || null,
          account_info: item.account_info || null,
          fees: item.fees || null,
          card_last_four: item.card_last_four || null,
          auth_code: item.auth_code || null,
          check_number: item.check_number || null,
          check_bank: item.check_bank || null,
          note: item.note || null,
          created_by: user.id,
          updated_by: user.id,
        });

        // 如果是 LinkPay，呼叫 API 生成付款連結
        if (item.receipt_type === RECEIPT_TYPES.LINK_PAY) {
          await handleCreateLinkPay(receiptNumber, item);
        }
      }

      toast.success('收款單建立成功');
      setIsDialogOpen(false);
      resetForm();
      fetchReceipts(); // 重新載入資料

    } catch (error) {
      console.error('建立收款單失敗:', error);
      toast.error('建立收款單失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLinkPay = async (receiptNumber: string, item: ReceiptItem) => {
    try {
      const response = await fetch('/api/linkpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptNumber,
          userName: item.receipt_account || '',
          email: item.email || '',
          paymentName: item.payment_name || '',
          createUser: user?.id || '',
          amount: item.amount,
          endDate: item.pay_dateline || '',
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('✅ LinkPay 付款連結生成成功');
        // TODO: 儲存到 linkpay_logs
      } else {
        toast.error(`❌ LinkPay 生成失敗: ${data.message}`);
      }
    } catch (error) {
      console.error('LinkPay API 錯誤:', error);
      toast.error('❌ LinkPay 連結生成失敗');
    }
  };

  // ============================================
  // 渲染
  // ============================================

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        title="收款管理"
        actions={
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
          >
            <Plus size={16} className="mr-2" />
            新增收款
          </Button>
        }
      />

      <div className="flex-1 overflow-auto">
        <EnhancedTable
          className="min-h-full"
          data={receipts}
          columns={columns}
          defaultSort={{ key: 'receipt_date', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋收款單號或訂單編號..."
        />
      </div>

      {/* 新增收款對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">新增收款單</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">選擇訂單 *</label>
                  <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="請選擇待收款的訂單..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrders.map(order => (
                        <SelectItem key={order.id} value={order.id}>
                          <div>
                            <div className="font-medium">{order.order_number} - {order.tour_name}</div>
                            <div className="text-sm text-morandi-secondary">
                              {order.contact_person} | 待收: NT$ {order.remaining_amount?.toLocaleString() || 0}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedOrder && (
                  <div>
                    <label className="text-sm font-medium text-morandi-primary mb-2 block">待收金額</label>
                    <Input
                      value={`NT$ ${selectedOrder.remaining_amount?.toLocaleString() || 0}`}
                      disabled
                      className="bg-morandi-container/30"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 收款項目 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">收款項目</h3>
                <Button onClick={addPaymentItem} variant="outline" size="sm">
                  <Plus size={16} className="mr-2" />
                  新增項目
                </Button>
              </div>

              <div className="space-y-4">
                {paymentItems.map((item, index) => (
                  <PaymentItemForm
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updatePaymentItem}
                    onRemove={removePaymentItem}
                    canRemove={paymentItems.length > 1}
                  />
                ))}
              </div>
            </div>

            {/* 摘要 */}
            <div className="bg-morandi-container/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">總收款金額</span>
                <span className="text-2xl font-bold text-morandi-gold">
                  NT$ {totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedOrderId || totalAmount <= 0 || isSubmitting}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                {isSubmitting ? '處理中...' : '儲存收款單'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// 收款項目表單組件
// ============================================

interface PaymentItemFormProps {
  item: ReceiptItem;
  index: number;
  onUpdate: (id: string, updates: Partial<ReceiptItem>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function PaymentItemForm({ item, index, onUpdate, onRemove, canRemove }: PaymentItemFormProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium">收款項目 {index + 1}</h4>
        {canRemove && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-morandi-red hover:text-morandi-red/80"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {/* 第一排：基本欄位 */}
      <div className="grid grid-cols-12 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">收款方式 *</label>
          <Select
            value={item.receipt_type.toString()}
            onValueChange={(value) => onUpdate(item.id, { receipt_type: Number(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECEIPT_TYPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">金額 *</label>
          <Input
            type="number"
            value={item.amount || ''}
            onChange={(e) => onUpdate(item.id, { amount: Number(e.target.value) })}
            placeholder="請輸入金額"
          />
        </div>

        <div className="col-span-2">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">交易日期 *</label>
          <Input
            type="date"
            value={item.transaction_date}
            onChange={(e) => onUpdate(item.id, { transaction_date: e.target.value })}
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">付款人姓名</label>
          <Input
            value={item.receipt_account || ''}
            onChange={(e) => onUpdate(item.id, { receipt_account: e.target.value })}
            placeholder="請輸入付款人姓名"
          />
        </div>

        <div className="col-span-3">
          <label className="text-sm font-medium text-morandi-primary mb-2 block">備註</label>
          <Input
            value={item.note || ''}
            onChange={(e) => onUpdate(item.id, { note: e.target.value })}
            placeholder="選填"
          />
        </div>
      </div>

      {/* 第二排：LinkPay 專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.LINK_PAY && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">Email *</label>
            <Input
              type="email"
              value={item.email || ''}
              onChange={(e) => onUpdate(item.id, { email: e.target.value })}
              placeholder="user@example.com"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">付款截止日 *</label>
            <Input
              type="date"
              value={item.pay_dateline || ''}
              onChange={(e) => onUpdate(item.id, { pay_dateline: e.target.value })}
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">付款名稱（客戶看到的）</label>
            <Input
              value={item.payment_name || ''}
              onChange={(e) => onUpdate(item.id, { payment_name: e.target.value })}
              placeholder="例如：峇里島五日遊 - 尾款"
            />
          </div>
        </div>
      )}

      {/* 第二排：現金專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CASH && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">經手人</label>
            <Input
              value={item.handler_name || ''}
              onChange={(e) => onUpdate(item.id, { handler_name: e.target.value })}
              placeholder="請輸入經手人姓名"
            />
          </div>
        </div>
      )}

      {/* 第二排：匯款專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.BANK_TRANSFER && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">匯入帳戶 *</label>
            <Select
              value={item.account_info || ''}
              onValueChange={(value) => onUpdate(item.id, { account_info: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇匯入帳戶" />
              </SelectTrigger>
              <SelectContent>
                {BANK_ACCOUNTS.map(bank => (
                  <SelectItem key={bank.value} value={bank.value}>
                    {bank.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">手續費</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={(e) => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder="選填，如有手續費"
            />
          </div>
        </div>
      )}

      {/* 第二排：刷卡專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CREDIT_CARD && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">卡號後四碼</label>
            <Input
              maxLength={4}
              value={item.card_last_four || ''}
              onChange={(e) => onUpdate(item.id, { card_last_four: e.target.value.replace(/\D/g, '') })}
              placeholder="1234"
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">授權碼</label>
            <Input
              value={item.auth_code || ''}
              onChange={(e) => onUpdate(item.id, { auth_code: e.target.value })}
              placeholder="請輸入授權碼"
            />
          </div>

          <div className="col-span-3">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">手續費</label>
            <Input
              type="number"
              value={item.fees || ''}
              onChange={(e) => onUpdate(item.id, { fees: Number(e.target.value) })}
              placeholder="選填，如有手續費"
            />
          </div>
        </div>
      )}

      {/* 第二排：支票專屬欄位 */}
      {item.receipt_type === RECEIPT_TYPES.CHECK && (
        <div className="grid grid-cols-12 gap-3 pt-3 border-t">
          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">支票號碼</label>
            <Input
              value={item.check_number || ''}
              onChange={(e) => onUpdate(item.id, { check_number: e.target.value })}
              placeholder="請輸入支票號碼"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm font-medium text-morandi-primary mb-2 block">開票銀行</label>
            <Input
              value={item.check_bank || ''}
              onChange={(e) => onUpdate(item.id, { check_bank: e.target.value })}
              placeholder="請輸入銀行名稱"
            />
          </div>
        </div>
      )}
    </div>
  );
}
