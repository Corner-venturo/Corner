'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { useVisaStore } from '@/stores/visa-store';
import { useTourStore } from '@/stores/tour-store';
import { useOrderStore } from '@/stores/order-store';
import { useAuthStore } from '@/stores/auth-store';
import { FileCheck, Clock, CheckCircle, XCircle, AlertCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Visa } from '@/stores/types';

export default function VisasPage() {
  const { visas, addVisa, updateVisa, deleteVisa, batchUpdateStatus } = useVisaStore();
  const { tours, addTour } = useTourStore();
  const { addOrder } = useOrderStore();
  const { user } = useAuthStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // 計算下件時間：護照 21天、護照急件 3天、台胞證 14天、台胞證急件 6天（所有天數含例假日）
  const calculateReceivedDate = useCallback((submissionDate: string, visaType: string): string => {
    if (!submissionDate) return '';

    const date = new Date(submissionDate);

    // 根據簽證類型決定天數（所有天數都含例假日，不需要順延）
    let days = 21; // 預設護照一般件

    if (visaType.includes('台胞證') && visaType.includes('急件')) {
      days = 6;
    } else if (visaType.includes('護照') && visaType.includes('急件')) {
      days = 3;
    } else if (visaType.includes('台胞證')) {
      days = 14;
    } else if (visaType.includes('護照')) {
      days = 21;
    }

    date.setDate(date.getDate() + days);

    return date.toISOString().split('T')[0];
  }, []);

  // 新增簽證表單 - 聯絡人資訊
  const [contactInfo, setContactInfo] = useState({
    tour_id: '',
    order_id: '', // 新增訂單ID欄位
    applicantName: '',
    contact_person: '',
    contact_phone: '',
  });

  // 團號選項（轉換為 Combobox 格式）
  const tourOptions: ComboboxOption[] = useMemo(() =>
    tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }))
  , [tours]);

  // 訂單選項（根據選擇的團號過濾）
  const orderOptions: ComboboxOption[] = React.useMemo(() => {
    if (!contactInfo.tour_id) return [];
    const { orders } = useOrderStore.getState();
    return orders
      .filter(order => order.tour_id === contactInfo.tour_id)
      .map(order => ({
        value: order.id,
        label: `${order.order_number} - ${order.contact_person}`,
      }));
  }, [contactInfo.tour_id]);

  // 當 tours 載入後，自動設定預設團號
  useEffect(() => {
    const defaultVisaTour = tours.find(t => t.code === 'SPC251231001');
    if (defaultVisaTour && !contactInfo.tour_id) {
      setContactInfo(prev => ({ ...prev, tour_id: defaultVisaTour.id }));
    }
  }, [tours]);

  // 批次辦理人列表
  interface VisaApplicant {
    id: string;
    name: string;
    country: string;
    isUrgent: boolean;
    submissionDate: string;
    receivedDate: string;
    cost: number;
  }

  const [applicants, setApplicants] = useState<VisaApplicant[]>([
    {
      id: '1',
      name: '',
      country: '護照 成人',
      isUrgent: false,
      submissionDate: '',
      receivedDate: '',
      cost: 0,
    }
  ]);

  // 第一個辦理人自動帶入申請人姓名
  useEffect(() => {
    if (contactInfo.applicantName && applicants.length > 0 && !applicants[0].name) {
      setApplicants(prev => {
        const updated = [...prev];
        updated[0].name = contactInfo.applicantName;
        return updated;
      });
    }
  }, [contactInfo.applicantName]);

  // 新增辦理人
  const addApplicant = useCallback(() => {
    setApplicants(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      country: '護照 成人',
      isUrgent: false,
      submissionDate: '',
      receivedDate: '',
      cost: 0,
    }]);
  }, []);

  // 移除辦理人
  const removeApplicant = useCallback((id: string) => {
    if (applicants.length > 1) {
      setApplicants(prev => prev.filter(a => a.id !== id));
    }
  }, [applicants.length]);

  // 更新辦理人資料
  const updateApplicant = useCallback((id: string, field: keyof VisaApplicant, value: any) => {
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a;

      const updated = { ...a, [field]: value };

      // 如果是送件時間或簽證類型改變，自動計算下件時間
      if (field === 'submissionDate' || field === 'country' || field === 'isUrgent') {
        if (updated.submissionDate) {
          const visaTypeWithUrgent = updated.isUrgent ? `${updated.country} 急件` : updated.country;
          updated.receivedDate = calculateReceivedDate(updated.submissionDate, visaTypeWithUrgent);
        }
      }

      return updated;
    }));
  }, [calculateReceivedDate]);

  // 根據 tab 篩選簽證
  const filteredVisas = useMemo(() =>
    activeTab === 'all'
      ? visas
      : visas.filter((v) => v.status === activeTab)
  , [visas, activeTab]);

  // 計算代辦費
  const calculateFee = useCallback((country: string): number => {
    if (country.includes('兒童')) return 1500;
    if (country.includes('首辦')) return 800;
    if (country.includes('台胞證') && country.includes('遺失件')) return 2900;
    return 1800;
  }, []);

  // 處理批次新增簽證
  const handleAddVisa = async () => {
    if (!contactInfo.applicantName || !user) return;

    let selectedTour;

    // 如果沒選團號，自動建立或使用預設的「簽證代辦團」
    if (!contactInfo.tour_id) {
      const currentYear = new Date().getFullYear();
      const defaultTourCode = `VISA-${currentYear}`;

      const existingDefaultTour = tours.find(t => t.code === defaultTourCode);

      if (existingDefaultTour) {
        selectedTour = existingDefaultTour;
      } else {
        const endOfYear = `${currentYear}-12-31`;
        selectedTour = addTour({
          name: `${currentYear}年度簽證代辦`,
          departureDate: endOfYear,
          returnDate: endOfYear,
          status: '特殊團' as const,
          location: 'VISA',
          price: 0,
          maxParticipants: 9999,
          contractStatus: '未簽署' as const,
          totalRevenue: 0,
          total_cost: 0,
          profit: 0,
        });
      }
    } else {
      selectedTour = tours.find(t => t.id === contactInfo.tour_id);
      if (!selectedTour) return;
    }

    // 取得或建立訂單
    const totalFee = applicants.reduce((sum, a) => sum + calculateFee(a.country), 0);
    let targetOrder;

    if (contactInfo.order_id) {
      // 如果有選擇訂單，使用現有訂單
      const { orders } = useOrderStore.getState();
      targetOrder = orders.find(o => o.id === contactInfo.order_id);
      if (!targetOrder) return;
    } else {
      // 如果沒有選擇訂單，自動建立新訂單
      const orderNumber = `${selectedTour.code}-${String(Date.now()).slice(-6)}`;
      targetOrder = await addOrder({
        orderNumber,
        tour_id: selectedTour.id,
        code: selectedTour.code,
        tour_name: selectedTour.name,
        contact_person: contactInfo.contact_person || contactInfo.applicantName,
        salesPerson: user.chineseName || '系統',
        assistant: user.chineseName || '系統',
        memberCount: applicants.filter(a => a.name).length,
        total_amount: totalFee,
        paidAmount: 0,
        remainingAmount: totalFee,
        paymentStatus: '未收款' as const,
      });
    }

    if (!targetOrder) {
      console.error('訂單建立失敗');
      return;
    }

    // 批次建立簽證（為每個辦理人建立，共用同一個訂單）
    applicants.forEach((applicant, index) => {
      if (!applicant.name) return;

      const fee = calculateFee(applicant.country);
      const totalCost = applicant.isUrgent ? applicant.cost + 900 : applicant.cost;

      // 建立簽證記錄
      addVisa({
        applicantName: applicant.name,
        contact_person: contactInfo.contact_person,
        contact_phone: contactInfo.contact_phone,
        visaType: applicant.country, // 簽證類型
        country: applicant.country,   // 國家（保留相容性）
        submissionDate: applicant.submissionDate,
        receivedDate: applicant.receivedDate,
        fee,
        cost: totalCost,
        status: '待送件',
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
        tour_id: selectedTour.id,
        code: selectedTour.code,
        created_by: user.id,
        note: '',
      });
    });

    // 重置表單（保持預設團號）
    const defaultVisaTour = tours.find(t => t.code === 'SPC251231001');
    setContactInfo({
      tour_id: defaultVisaTour?.id || '',
      order_id: '',
      applicantName: '',
      contact_person: '',
      contact_phone: '',
    });
    setApplicants([{
      id: '1',
      name: '',
      country: '護照 成人',
      isUrgent: false,
      submissionDate: '',
      receivedDate: '',
      cost: 0,
    }]);

    setIsDialogOpen(false);
  };

  // 批次送件
  const handleBatchSubmit = () => {
    if (selectedRows.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    batchUpdateStatus(selectedRows, '已送件', today);
    setSelectedRows([]);
  };

  // 狀態徽章樣式
  const getStatusBadge = (status: Visa['status']) => {
    const badges: Record<Visa['status'], string> = {
      '待送件': 'bg-morandi-gold/20 text-morandi-gold',
      '已送件': 'bg-morandi-blue/20 text-morandi-blue',
      '已下件': 'bg-morandi-green/20 text-morandi-green',
      '已取件': 'bg-morandi-container text-morandi-secondary',
      '退件': 'bg-morandi-red/20 text-morandi-red',
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  // Table 欄位定義
  const columns: TableColumn[] = [
    {
      key: 'applicantName',
      label: '申請人',
      sortable: true,
      render: (value) => value,
    },
    {
      key: 'contactPerson',
      label: '聯絡人',
      render: (value) => value,
    },
    {
      key: 'contactPhone',
      label: '聯絡電話',
      render: (value) => value,
    },
    {
      key: 'country',
      label: '簽證',
      render: (value) => value,
    },
    {
      key: 'status',
      label: '狀態',
      render: (value, visa) => (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
          getStatusBadge(visa.status)
        )}>
          {visa.status}
        </span>
      ),
    },
    {
      key: 'submissionDate',
      label: '送件時間',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'receivedDate',
      label: '下件時間',
      render: (value) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      key: 'fee',
      label: '代辦費',
      render: (value) => `NT$ ${value.toLocaleString()}`,
    },
  ];

  const renderActions = (visa: Visa) => (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          // 編輯功能
        }}
        className="h-8 w-8 p-0"
      >
        編輯
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('確定要刪除此簽證記錄嗎？')) {
            deleteVisa(visa.id);
          }
        }}
        className="h-8 w-8 p-0 text-morandi-red"
      >
        刪除
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <ResponsiveHeader
        title="簽證管理"
        icon={FileText}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '簽證管理', href: '/visas' }
        ]}
        onAdd={() => setIsDialogOpen(true)}
        addLabel="新增簽證"
        tabs={[
          { value: 'all', label: '全部', icon: FileText },
          { value: '待送件', label: '待送件', icon: Clock },
          { value: '已送件', label: '已送件', icon: AlertCircle },
          { value: '已下件', label: '已下件', icon: CheckCircle },
          { value: '已取件', label: '已取件', icon: FileCheck },
          { value: '退件', label: '退件', icon: XCircle },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 批次操作按鈕 */}
      {selectedRows.length > 0 && (
        <div className="bg-morandi-container p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-morandi-primary">
            已選擇 {selectedRows.length} 筆簽證
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleBatchSubmit}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              批次送件
            </Button>
            <Button
              variant="outline"
              onClick={() => setSelectedRows([])}
            >
              取消選擇
            </Button>
          </div>
        </div>
      )}

      {/* 簽證列表 */}
      <div className="pb-6">
        <EnhancedTable
          columns={columns}
          data={filteredVisas}
          loading={false}
          selection={{
            selected: selectedRows,
            onChange: setSelectedRows,
          }}
          actions={renderActions}
          bordered={true}
          emptyState={
            <div className="text-center py-8 text-morandi-secondary">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium text-morandi-primary mb-2">
                {activeTab === 'all' ? '還沒有任何簽證記錄' : `沒有「${activeTab}」狀態的簽證`}
              </p>
              <p className="text-sm text-morandi-secondary mb-6">
                點擊右上角「新增簽證」開始建立
              </p>
            </div>
          }
        />
      </div>

      {/* 新增簽證對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增簽證</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 上半部：聯絡人資訊 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">選擇團號</label>
                  <Combobox
                    value={contactInfo.tour_id}
                    onChange={(value) => {
                      setContactInfo(prev => ({ ...prev, tour_id: value, order_id: '' }));
                    }}
                    options={tourOptions}
                    placeholder="請輸入或選擇團號（例如：0810）"
                    className="mt-1"
                    showSearchIcon
                    showClearButton
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">
                    選擇訂單 <span className="text-xs text-morandi-secondary">(選填，未選擇將自動建立)</span>
                  </label>
                  <Combobox
                    value={contactInfo.order_id}
                    onChange={(value) => setContactInfo(prev => ({ ...prev, order_id: value }))}
                    options={orderOptions}
                    placeholder={contactInfo.tour_id ? "請選擇訂單或留空自動建立" : "請先選擇團號"}
                    className="mt-1"
                    disabled={!contactInfo.tour_id}
                    showSearchIcon
                    showClearButton
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
                  <Input
                    value={contactInfo.contact_person}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="mt-1"
                    placeholder="請輸入聯絡人"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">申請人</label>
                  <Input
                    value={contactInfo.applicantName}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, applicantName: e.target.value }))}
                    className="mt-1"
                    placeholder="請輸入申請人姓名"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
                  <Input
                    value={contactInfo.contact_phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="mt-1"
                    placeholder="請輸入聯絡電話"
                  />
                </div>
              </div>
            </div>

            {/* 分割線 */}
            <div className="border-t border-border"></div>

            {/* 下半部：批次辦理人列表 */}
            <div className="space-y-2">
              {applicants.map((applicant, index) => (
                <div key={applicant.id} className="flex gap-2 items-center">
                  <Input
                    value={applicant.name}
                    onChange={(e) => updateApplicant(applicant.id, 'name', e.target.value)}
                    placeholder={index === 0 ? "辦理人（自動帶入）" : "辦理人"}
                    className="flex-[1.5]"
                  />

                  <select
                    value={applicant.country}
                    onChange={(e) => updateApplicant(applicant.id, 'country', e.target.value)}
                    className="flex-[2] p-2 border border-border rounded-md bg-background h-10"
                  >
                    <option value="護照 成人">護照 成人</option>
                    <option value="護照 兒童">護照 兒童</option>
                    <option value="護照 成人 遺失件">護照 成人 遺失件</option>
                    <option value="護照 兒童 遺失件">護照 兒童 遺失件</option>
                    <option value="台胞證">台胞證</option>
                    <option value="台胞證 遺失件">台胞證 遺失件</option>
                    <option value="台胞證 首辦">台胞證 首辦</option>
                  </select>

                  <Input
                    type="date"
                    value={applicant.submissionDate}
                    onChange={(e) => updateApplicant(applicant.id, 'submissionDate', e.target.value)}
                    className="flex-1"
                  />

                  <Input
                    type="date"
                    value={applicant.receivedDate}
                    readOnly
                    className="flex-1 bg-muted"
                  />

                  <Input
                    type="number"
                    value={calculateFee(applicant.country)}
                    readOnly
                    className="w-20 bg-muted"
                  />

                  <Input
                    type="number"
                    value={applicant.cost}
                    onChange={(e) => updateApplicant(applicant.id, 'cost', Number(e.target.value))}
                    placeholder="成本"
                    className="w-20"
                  />

                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={applicant.isUrgent}
                      onChange={(e) => updateApplicant(applicant.id, 'isUrgent', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm whitespace-nowrap">急件</span>
                  </div>

                  <Button
                    type="button"
                    onClick={index === applicants.length - 1 ? addApplicant : () => removeApplicant(applicant.id)}
                    size="sm"
                    className={index === applicants.length - 1
                      ? "h-8 w-8 p-0 flex-shrink-0 bg-morandi-gold hover:bg-morandi-gold-hover text-white"
                      : "h-8 w-8 p-0 flex-shrink-0 text-morandi-red hover:bg-red-50"}
                    variant={index === applicants.length - 1 ? "default" : "ghost"}
                  >
                    {index === applicants.length - 1 ? '+' : '✕'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-border mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleAddVisa}
              disabled={!contactInfo.applicantName || applicants.every(a => !a.name)}
              className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
            >
              批次新增簽證
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
