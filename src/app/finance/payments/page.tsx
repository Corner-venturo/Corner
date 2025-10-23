'use client';

import { useState, useMemo } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrderStore } from '@/stores';
// TODO: usePaymentStore deprecated - 收款記錄功能未實作
import { CreditCard, Calendar, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// 收款方式選項
const paymentMethods = [
  { value: '現金', label: '現金' },
  { value: '匯款', label: '匯款' },
  { value: '刷卡', label: '刷卡' },
  { value: '支票', label: '支票' }
];

// 帳戶選項
const bankAccounts = [
  { value: 'bank1', label: '台灣銀行 - 001234567' },
  { value: 'bank2', label: '國泰世華 - 987654321' },
  { value: 'bank3', label: '玉山銀行 - 555666777' }
];

interface PaymentItem {
  id: string;
  paymentMethod: string;
  amount: number;
  transactionDate: string;
  handlerName?: string;
  accountInfo?: string;
  fees?: number;
  cardLastFour?: string;
  authCode?: string;
  checkNumber?: string;
  checkBank?: string;
  note?: string;
}

export default function PaymentsPage() {
  const { items: orders } = useOrderStore();
  const payments: any[] = []; // TODO: 實作收款記錄功能
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 只取收款記錄
  const paymentRecords = payments.filter(p => p.type === '收款');

  // 表單狀態
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [paymentItems, setPaymentItems] = useState<PaymentItem[]>([
    {
      id: '1',
      paymentMethod: '現金',
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0]
    }
  ]);

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
  const total_amount = useMemo(() => {
    return paymentItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [paymentItems]);

  // 新增收款項目
  const addPaymentItem = () => {
    const newItem: PaymentItem = {
      id: Date.now().toString(),
      paymentMethod: '現金',
      amount: 0,
      transactionDate: new Date().toISOString().split('T')[0]
    };
    setPaymentItems(prev => [...prev, newItem]);
  };

  // 移除收款項目
  const removePaymentItem = (id: string) => {
    if (paymentItems.length > 1) {
      setPaymentItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // 更新收款項目
  const updatePaymentItem = (id: string, updates: Partial<PaymentItem>) => {
    setPaymentItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // 重置表單
  const resetForm = () => {
    setSelectedOrderId('');
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setNote('');
    setPaymentItems([
      {
        id: '1',
        paymentMethod: '現金',
        amount: 0,
        transactionDate: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  // 處理儲存
  const handleSave = () => {
    if (!selectedOrderId || paymentItems.length === 0 || total_amount <= 0) {
      alert('請填寫完整資訊');
      return;
    }

    // TODO: 保存收款單到 store 或 API
    console.log('儲存收款單', {
      order_id: selectedOrderId,
      receiptDate,
      paymentItems,
      total_amount,
      note
    });

    // 關閉對話框並重置表單
    setIsDialogOpen(false);
    resetForm();
  };

  // 定義表格欄位
  const columns = [
    {
      key: 'created_at',
      label: '日期',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center text-sm">
          <Calendar size={14} className="mr-1 text-morandi-secondary" />
          {new Date(value).toLocaleDateString('zh-TW')}
        </div>
      )
    },
    {
      key: 'amount',
      label: '金額',
      sortable: true,
      render: (value: number) => (
        <div className="text-sm font-medium text-morandi-green">
          NT$ {value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'description',
      label: '說明',
      sortable: false,
      render: (value: string) => (
        <div className="text-sm text-morandi-primary">
          {value}
        </div>
      )
    },
    {
      key: 'order_id',
      label: '訂單編號',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-morandi-primary">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'status',
      label: '狀態',
      sortable: true,
      render: (value: string) => (
        <span className={cn(
          'text-sm font-medium',
          value === '已確認' ? 'text-morandi-green' : 'text-morandi-gold'
        )}>
          {value}
        </span>
      )
    }
  ];

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
          data={paymentRecords}
          columns={columns}
          defaultSort={{ key: 'created_at', direction: 'desc' }}
          searchable
          searchPlaceholder="搜尋說明或訂單編號..."
        />
      </div>

      {/* 新增收款對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">新增收款單</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">基本資訊</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">選擇訂單</label>
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

                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">收款日期</label>
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">收款單號</label>
                  <Input
                    value="REC-2024004（自動產生）"
                    disabled
                    className="bg-morandi-container/30"
                  />
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
                  <div key={item.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">收款項目 {index + 1}</h4>
                      {paymentItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePaymentItem(item.id)}
                          className="text-morandi-red hover:text-morandi-red/80"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-morandi-primary mb-2 block">收款方式</label>
                        <Select
                          value={item.paymentMethod}
                          onValueChange={(value) => updatePaymentItem(item.id, { paymentMethod: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map(method => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-morandi-primary mb-2 block">金額</label>
                        <Input
                          type="number"
                          value={item.amount || ''}
                          onChange={(e) => updatePaymentItem(item.id, { amount: Number(e.target.value) })}
                          placeholder="請輸入收款金額"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-morandi-primary mb-2 block">交易日期</label>
                        <Input
                          type="date"
                          value={item.transactionDate}
                          onChange={(e) => updatePaymentItem(item.id, { transactionDate: e.target.value })}
                        />
                      </div>

                      {/* 根據收款方式顯示額外欄位 */}
                      {item.paymentMethod === '現金' && (
                        <div>
                          <label className="text-sm font-medium text-morandi-primary mb-2 block">經手人</label>
                          <Input
                            value={item.handlerName || ''}
                            onChange={(e) => updatePaymentItem(item.id, { handlerName: e.target.value })}
                            placeholder="請輸入經手人姓名"
                          />
                        </div>
                      )}

                      {item.paymentMethod === '匯款' && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">匯入帳戶</label>
                            <Select
                              value={item.accountInfo || ''}
                              onValueChange={(value) => updatePaymentItem(item.id, { accountInfo: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="請選擇帳戶" />
                              </SelectTrigger>
                              <SelectContent>
                                {bankAccounts.map(account => (
                                  <SelectItem key={account.value} value={account.label}>
                                    {account.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">手續費</label>
                            <Input
                              type="number"
                              value={item.fees || ''}
                              onChange={(e) => updatePaymentItem(item.id, { fees: Number(e.target.value) })}
                              placeholder="手續費金額"
                            />
                          </div>
                        </>
                      )}

                      {item.paymentMethod === '刷卡' && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">卡號後四碼</label>
                            <Input
                              value={item.cardLastFour || ''}
                              onChange={(e) => updatePaymentItem(item.id, { cardLastFour: e.target.value })}
                              placeholder="****"
                              maxLength={4}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">授權碼</label>
                            <Input
                              value={item.authCode || ''}
                              onChange={(e) => updatePaymentItem(item.id, { authCode: e.target.value })}
                              placeholder="授權碼"
                            />
                          </div>
                        </>
                      )}

                      {item.paymentMethod === '支票' && (
                        <>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">支票號碼</label>
                            <Input
                              value={item.checkNumber || ''}
                              onChange={(e) => updatePaymentItem(item.id, { checkNumber: e.target.value })}
                              placeholder="支票號碼"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-morandi-primary mb-2 block">開票銀行</label>
                            <Input
                              value={item.checkBank || ''}
                              onChange={(e) => updatePaymentItem(item.id, { checkBank: e.target.value })}
                              placeholder="開票銀行"
                            />
                          </div>
                        </>
                      )}

                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-morandi-primary mb-2 block">備註</label>
                        <Input
                          value={item.note || ''}
                          onChange={(e) => updatePaymentItem(item.id, { note: e.target.value })}
                          placeholder="收款備註（選填）"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 摘要和備註 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">收款摘要</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">總收款金額</label>
                  <Input
                    value={`NT$ ${total_amount.toLocaleString()}`}
                    disabled
                    className="bg-morandi-container/30 text-lg font-medium"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">收款後狀態</label>
                  <Input
                    value={selectedOrder ?
                      (total_amount >= (selectedOrder.remaining_amount || 0) ? '已收款' : '部分收款')
                      : '請選擇訂單'}
                    disabled
                    className="bg-morandi-container/30"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-morandi-primary mb-2 block">收款單備註</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="整張收款單的備註（選填）"
                    className="w-full p-3 border border-border rounded-lg resize-none h-20"
                  />
                </div>
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
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedOrderId || total_amount <= 0}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                儲存收款單
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}