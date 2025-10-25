'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ResponsiveHeader } from '@/components/layout/responsive-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EnhancedTable, TableColumn } from '@/components/ui/enhanced-table';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { useVisaStore, useTourStore, useOrderStore } from '@/stores';
import { useAuthStore } from '@/stores/auth-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileCheck, Clock, CheckCircle, XCircle, AlertCircle, FileText, Edit2, Trash2, Info, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Visa } from '@/stores/types';
import { logger } from '@/lib/utils/logger';
import { tourService } from '@/features/tours/services/tour.service';
import { getVisaStatusLabel } from '@/constants/status-maps';

interface DeliveryOption {
  method: string;
  adult: number;
  child: number;
}

interface RequirementSection {
  title: string;
  items: string[];
}

const PASSPORT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { method: '自取', adult: 1800, child: 1400 },
  { method: '郵政寄回', adult: 1900, child: 1500 },
  { method: '雙北快遞寄回', adult: 2000, child: 1600 },
];

const PASSPORT_REQUIREMENTS: RequirementSection[] = [
  {
    title: '年滿18歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
    ],
  },
  {
    title: '年滿18歲者申請護照（換發）',
    items: [
      '舊護照正本（效期未逾期才須提供，若已經過期則免）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
    ],
  },
  {
    title: '滿14歲至未滿18歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '滿14歲至未滿18歲者申請護照（換發）',
    items: [
      '相片2張（2吋大頭照，護照規格）',
      '身分證正本',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '未滿14歲者申請護照（首次申請）',
    items: [
      '簡式護照資料表【人別確認專用】（請先至住家附近的戶政事務所辦理）',
      '相片2張（2吋大頭照，護照規格）',
      '戶口名簿正本或戶籍謄本正本（已領新式國民身分證者請改繳身分證）',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
  {
    title: '未滿14歲者申請護照（換發）',
    items: [
      '相片2張（2吋大頭照，護照規格）',
      '戶口名簿正本或戶籍謄本正本（已領新式國民身分證者請改繳身分證）',
      '法定代理人身分證（提供父／母其中一位身分證正本即可）',
    ],
  },
];

const PASSPORT_NOTES: string[] = [
  '＊申請人應繳交最近6個月內所攝彩色正面、脫帽、五官清晰、白色背景的護照專用照片。',
  '＊因近期受理案件較多，正常護照代辦時程改為14個工作天（不含例假日）；急件為4個工作天（不含例假日），每件費用+900元。',
  '＊若護照遺失但效期未逾期，請先至警局備案，並提供相關證明文件，代辦時程需多加1個工作天。',
];

const TAIWAN_COMPATRIOT_DELIVERY_OPTIONS: DeliveryOption[] = [
  { method: '自取', adult: 1800, child: 1800 },
  { method: '郵政寄回', adult: 1900, child: 1900 },
  { method: '雙北快遞寄回', adult: 2000, child: 2000 },
];

const TAIWAN_COMPATRIOT_REQUIREMENTS: RequirementSection[] = [
  {
    title: '台胞證申辦所需資料',
    items: [
      '護照正本（效期需六個月以上護照正本）',
      '相片1張（2吋大頭照，護照規格）',
      '身分證影本【須為原比例清楚完整的影本，請勿翻拍】',
      '戶籍謄本正本（如有改名或個人身份資料更改者、未滿14歲未領身份證者，需附上3個月內戶籍謄本正本，記事不可省略或部分省略，需有完整詳細說明）',
    ],
  },
];

const TAIWAN_COMPATRIOT_NOTES: string[] = [
  '＊申請人應繳交最近6個月內所攝彩色正面、脫帽、五官清晰、白色背景的護照專用照片。',
  '＊因近期受理案件較多，正常台胞證代辦時程改為9個工作天（不含例假日）；急件為6個工作天（不含例假日），每件費用+900元。',
  '＊若台胞證遺失但效期未逾期，請先至警局備案，並提供相關證明文件，另需支付罰金1,100元。',
];

function formatCurrency(amount: number): string {
  return `NT$${amount.toLocaleString()}`;
}

function buildVisaInfoText(): string {
  const sections = [
    {
      title: '護照',
      options: PASSPORT_DELIVERY_OPTIONS,
      requirements: PASSPORT_REQUIREMENTS,
      notes: PASSPORT_NOTES,
    },
    {
      title: '台胞證',
      options: TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
      requirements: TAIWAN_COMPATRIOT_REQUIREMENTS,
      notes: TAIWAN_COMPATRIOT_NOTES,
    },
  ];

  const lines: string[] = [];

  sections.forEach((section, sectionIndex) => {
    lines.push(section.title);
    lines.push('取貨方式／身份');
    section.options.forEach(option => {
      lines.push(`  ${option.method}：成人 ${formatCurrency(option.adult)}／兒童（未滿14歲） ${formatCurrency(option.child)}`);
    });
    lines.push('');

    section.requirements.forEach(requirement => {
      lines.push(`－${requirement.title}`);
      requirement.items.forEach((item, itemIndex) => {
        lines.push(`  ${itemIndex + 1}. ${item}`);
      });
      lines.push('');
    });

    section.notes.forEach(note => {
      lines.push(note);
    });

    if (sectionIndex < sections.length - 1) {
      lines.push('');
    }
  });

  return lines.join('\n');
}

const VISA_INFO_TEXT = buildVisaInfoText();

export default function VisasPage() {
  const { items: visas, create: addVisa, update: updateVisa, delete: deleteVisa } = useVisaStore();
  const { items: tours, create: addTour, fetchAll: fetchTours } = useTourStore();
  const { items: orders, create: addOrder } = useOrderStore();
  const { user } = useAuthStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const copyStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canManageVisas = useMemo(() => {
    const permissions = user?.permissions || [];
    return permissions.includes('admin') || permissions.includes('super_admin');
  }, [user]);

  useEffect(() => {
    return () => {
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
    };
  }, []);

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
  const [contact_info, setContactInfo] = useState({
    tour_id: '',
    order_id: '', // 新增訂單ID欄位
    applicant_name: '',
    contact_person: '',
    contact_phone: '',
  });

  // 團號選項（轉換為 Combobox 格式）
  const tourOptions: ComboboxOption[] = useMemo(() => {
    console.log('📋 當前 tours 數量:', tours.length);
    console.log('📋 Tours:', tours);
    return tours.map(tour => ({
      value: tour.id,
      label: `${tour.code} - ${tour.name}`,
    }));
  }, [tours]);

  // 訂單選項（根據選擇的團號過濾）
  const orderOptions: ComboboxOption[] = React.useMemo(() => {
    if (!contact_info.tour_id) return [];
    const { items: orders } = useOrderStore.getState();
    return orders
      .filter((order) => order.tour_id === contact_info.tour_id)
      .map((order) => ({
        value: order.id,
        label: `${order.order_number} - ${order.contact_person}`,
      }));
  }, [contact_info.tour_id]);

  // 當頁面載入時，自動取得或建立當年度簽證專用團
  useEffect(() => {
    const initVisaTour = async () => {
      try {
        console.log('🔍 開始建立/取得簽證專用團...');
        const visaTour = await tourService.getOrCreateVisaTour();
        console.log('✅ 簽證專用團:', visaTour);

        // 重新載入 tours 以確保新建立的簽證專用團出現在列表中
        console.log('🔄 重新載入 tours...');
        await fetchTours();
        console.log('✅ Tours 重新載入完成');

        if (visaTour && !contact_info.tour_id) {
          console.log('✅ 設定預設團號:', visaTour.id);
          setContactInfo(prev => ({ ...prev, tour_id: visaTour.id }));
        }
      } catch (error) {
        console.error('❌ 建立簽證專用團失敗:', error);
        logger.error('Failed to get or create visa tour', error);
      }
    };

    initVisaTour();
  }, [contact_info.tour_id, fetchTours]);

  // 批次辦理人列表
  interface VisaApplicant {
    id: string;
    name: string;
    country: string;
    is_urgent: boolean;
    submission_date: string;
    received_date: string;
    cost: number;
  }

  const [applicants, setApplicants] = useState<VisaApplicant[]>([
    {
      id: '1',
      name: '',
      country: '護照 成人',
      is_urgent: false,
      submission_date: '',
      received_date: '',
      cost: 0,
    }
  ]);

  // 第一個辦理人自動帶入申請人姓名（即時同步）
  useEffect(() => {
    if (applicants.length > 0) {
      setApplicants(prev => {
        const updated = [...prev];
        updated[0].name = contact_info.applicant_name;
        return updated;
      });
    }
  }, [contact_info.applicant_name, applicants.length]);

  // 新增辦理人
  const addApplicant = useCallback(() => {
    setApplicants(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      country: '護照 成人',
      is_urgent: false,
      submission_date: '',
      received_date: '',
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
  const updateApplicant = useCallback((id: string, field: keyof VisaApplicant, value: unknown) => {
    setApplicants(prev => prev.map(a => {
      if (a.id !== id) return a;

      const updated = { ...a, [field]: value };

      // 如果是送件時間或簽證類型改變，自動計算下件時間
      if (field === 'submission_date' || field === 'country' || field === 'is_urgent') {
        if (updated.submission_date) {
          const visaTypeWithUrgent = updated.is_urgent ? `${updated.country} 急件` : updated.country;
          updated.received_date = calculateReceivedDate(updated.submission_date, visaTypeWithUrgent);
        }
      }

      // 如果勾選/取消急件，自動調整成本 ±900
      if (field === 'is_urgent') {
        if (value === true) {
          // 勾選急件：+900
          updated.cost = a.cost + 900;
        } else {
          // 取消急件：-900
          updated.cost = Math.max(0, a.cost - 900);
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

  useEffect(() => {
    if (!canManageVisas && selectedRows.length > 0) {
      setSelectedRows([]);
    }
  }, [canManageVisas, selectedRows.length]);

  const handleCopyVisaInfo = useCallback(async () => {
    try {
      let copied = false;

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(VISA_INFO_TEXT);
        copied = true;
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = VISA_INFO_TEXT;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      if (!copied) {
        throw new Error('Clipboard not supported');
      }

      setCopyStatus('success');
    } catch (error) {
      setCopyStatus('error');
    } finally {
      if (copyStatusTimeoutRef.current) {
        clearTimeout(copyStatusTimeoutRef.current);
      }
      copyStatusTimeoutRef.current = setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  }, []);

  const renderVisaInfoContent = (
    options: DeliveryOption[],
    requirements: RequirementSection[],
    notes: string[],
  ) => (
    <div className="space-y-6">
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] bg-morandi-container text-xs font-medium uppercase tracking-wide text-morandi-secondary">
          <div className="px-4 py-3">取貨方式／身份</div>
          <div className="px-4 py-3">成人</div>
          <div className="px-4 py-3">兒童（未滿14歲）</div>
        </div>
        {options.map(option => (
          <div
            key={option.method}
            className="grid grid-cols-[1.5fr_1fr_1fr] border-t border-border text-sm text-morandi-primary"
          >
            <div className="px-4 py-3 font-medium">{option.method}</div>
            <div className="px-4 py-3">{formatCurrency(option.adult)}</div>
            <div className="px-4 py-3">{formatCurrency(option.child)}</div>
          </div>
        ))}
      </div>

      <div className="space-y-5">
        {requirements.map(section => (
          <div key={section.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-morandi-primary">－{section.title}</h3>
            <ol className="list-decimal space-y-2 pl-5 text-sm text-morandi-secondary">
              {section.items.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-morandi-container p-4">
        <ul className="list-disc space-y-2 pl-5 text-sm text-morandi-secondary">
          {notes.map((note, index) => (
            <li key={index}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  // 計算代辦費
  const calculateFee = useCallback((country: string): number => {
    if (country.includes('兒童')) return 1500;
    if (country.includes('首辦')) return 800;
    if (country.includes('台胞證') && country.includes('遺失件')) return 2900;
    return 1800;
  }, []);

  // 處理批次新增簽證
  const handleAddVisa = async () => {
    if (!canManageVisas || !contact_info.applicant_name || !user) return;

    let selectedTour;

    // 如果沒選團號，自動建立或使用預設的「簽證代辦團」
    if (!contact_info.tour_id) {
      const currentYear = new Date().getFullYear();
      const defaultTourCode = `VISA-${currentYear}`;

      const existingDefaultTour = tours.find(t => t.code === defaultTourCode);

      if (existingDefaultTour) {
        selectedTour = existingDefaultTour;
      } else {
        const endOfYear = `${currentYear}-12-31`;
        selectedTour = await addTour({
          name: `${currentYear}年度簽證代辦`,
          departure_date: endOfYear,
          return_date: endOfYear,
          status: 'special' as const,
          location: 'VISA',
          price: 0,
          max_participants: 9999,
          contract_status: 'pending' as const,
          total_revenue: 0,
          total_cost: 0,
          profit: 0,
        } as unknown);
      }
    } else {
      selectedTour = tours.find(t => t.id === contact_info.tour_id);
      if (!selectedTour) return;
    }

    // 取得或建立訂單
    const totalFee = applicants.reduce((sum, a) => sum + calculateFee(a.country), 0);
    let targetOrder;

    if (contact_info.order_id) {
      // 如果有選擇訂單，使用現有訂單
      targetOrder = orders.find(o => o.id === contact_info.order_id);
      if (!targetOrder) return;
    } else {
      // 如果沒有選擇訂單，自動建立新訂單
      // 計算該團的訂單流水號（3位數）
      const tourOrders = orders.filter(o => o.tour_id === selectedTour.id);
      const nextNumber = (tourOrders.length + 1).toString().padStart(3, '0');
      const order_number = `${selectedTour.code}-${nextNumber}`;

      targetOrder = await addOrder({
        order_number,
        tour_id: selectedTour.id,
        code: order_number, // 訂單編號同時作為 code（唯一識別）
        tour_name: selectedTour.name,
        contact_person: contact_info.contact_person || contact_info.applicant_name,
        sales_person: user.display_name || '系統',
        assistant: user.display_name || '系統',
        member_count: applicants.filter(a => a.name).length,
        total_amount: totalFee,
        paid_amount: 0,
        remaining_amount: totalFee,
        payment_status: 'unpaid' as const,
      });
    }

    if (!targetOrder) {
      logger.error('訂單建立失敗');
      return;
    }

    // 批次建立簽證（為每個辦理人建立，共用同一個訂單）
    applicants.forEach((applicant, _index) => {
      if (!applicant.name) return;

      const fee = calculateFee(applicant.country);
      const total_cost = applicant.is_urgent ? applicant.cost + 900 : applicant.cost;

      // 建立簽證記錄
      addVisa({
        applicant_name: applicant.name,
        contact_person: contact_info.contact_person,
        contact_phone: contact_info.contact_phone,
        visa_type: applicant.country, // 簽證類型
        country: applicant.country,   // 國家（保留相容性）
        submission_date: applicant.submission_date,
        received_date: applicant.received_date,
        fee,
        cost: total_cost,
        status: 'pending',
        order_id: targetOrder.id,
        order_number: targetOrder.order_number,
        tour_id: selectedTour.id,
        code: selectedTour.code,
        created_by: user.id,
        note: '',
      });
    });

    // 重置表單（保持預設團號）
    const currentYear = new Date().getFullYear();
    const visaCode = `VISA${currentYear}001`;
    const defaultVisaTour = tours.find(t => t.code === visaCode);
    setContactInfo({
      tour_id: defaultVisaTour?.id || '',
      order_id: '',
      applicant_name: '',
      contact_person: '',
      contact_phone: '',
    });
    setApplicants([{
      id: '1',
      name: '',
      country: '護照 成人',
      is_urgent: false,
      submission_date: '',
      received_date: '',
      cost: 0,
    }]);

    setIsDialogOpen(false);
  };

  // 批次送件
  const handleBatchSubmit = async () => {
    if (!canManageVisas || selectedRows.length === 0) return;
    const today = new Date().toISOString().split('T')[0];

    // 使用標準 API 批次更新
    for (const id of selectedRows) {
      await updateVisa(id, { status: 'submitted', submission_date: today });
    }

    setSelectedRows([]);
  };

  // 狀態徽章樣式
  const _getStatusBadge = (status: Visa['status']) => {
    const badges: Record<Visa['status'], string> = {
      'pending': 'bg-morandi-gold/20 text-morandi-gold',
      'submitted': 'bg-morandi-blue/20 text-morandi-blue',
      'issued': 'bg-morandi-green/20 text-morandi-green',
      'collected': 'bg-morandi-container text-morandi-secondary',
      'rejected': 'bg-morandi-red/20 text-morandi-red',
    };
    return badges[status] || 'bg-morandi-container text-morandi-secondary';
  };

  // Table 欄位定義
  const columns: TableColumn[] = [
    {
      key: 'applicant_name',
      label: '申請人',
      sortable: true,
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'contact_person',
      label: '聯絡人',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'contact_phone',
      label: '聯絡電話',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'country',
      label: '簽證',
      render: (value) => <span className="text-sm text-morandi-primary">{value}</span>,
    },
    {
      key: 'status',
      label: '狀態',
      render: (value, visa) => (
        <span className={cn(
          'text-sm font-medium',
          visa.status === 'submitted' ? 'text-morandi-gold' :
          visa.status === 'issued' ? 'text-morandi-green' :
          'text-morandi-secondary'
        )}>
          {getVisaStatusLabel(visa.status)}
        </span>
      ),
    },
    {
      key: 'submission_date',
      label: '送件時間',
      render: (value) => <span className="text-sm text-morandi-secondary">{value ? new Date(value).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'received_date',
      label: '下件時間',
      render: (value) => <span className="text-sm text-morandi-secondary">{value ? new Date(value).toLocaleDateString() : '-'}</span>,
    },
    {
      key: 'fee',
      label: '代辦費',
      render: (value) => <span className="text-sm text-morandi-primary">NT$ {value.toLocaleString()}</span>,
    },
  ];

  const renderActions = (visa: Visa) => {
    if (!canManageVisas) return null;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // 編輯功能
          }}
          className="p-1 text-morandi-gold hover:bg-morandi-gold/10 rounded transition-colors"
          title="編輯"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('確定要刪除此簽證記錄嗎？')) {
              deleteVisa(visa.id);
            }
          }}
          className="p-1 text-morandi-red/60 hover:text-morandi-red hover:bg-morandi-red/10 rounded transition-colors"
          title="刪除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <ResponsiveHeader
        {...{
        title: "簽證管理",
        icon: FileText} as unknown}
        breadcrumb={[
          { label: '首頁', href: '/' },
          { label: '簽證管理', href: '/visas' }
        ]}
        actions={(
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsInfoDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Info size={16} />
              查看簽證資訊
            </Button>
            {canManageVisas && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-morandi-gold hover:bg-morandi-gold-hover text-white"
              >
                新增簽證
              </Button>
            )}
          </div>
        )}
        tabs={[
          { value: 'all', label: '全部', icon: FileText },
          { value: 'pending', label: '待送件', icon: Clock },
          { value: 'submitted', label: '已送件', icon: AlertCircle },
          { value: 'issued', label: '已下件', icon: CheckCircle },
          { value: 'collected', label: '已取件', icon: FileCheck },
          { value: 'rejected', label: '退件', icon: XCircle },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 overflow-auto">
        {/* 批次操作按鈕 */}
        {canManageVisas && selectedRows.length > 0 && (
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
        <EnhancedTable
          className="min-h-full"
          columns={columns}
          data={filteredVisas}
          loading={false}
          selection={canManageVisas ? {
            selected: selectedRows,
            onChange: setSelectedRows,
          } : undefined}
          actions={renderActions}
          bordered={true}
        />
      </div>

      {/* 簽證資訊對話框 */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle>簽證資訊總覽</DialogTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCopyVisaInfo}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                複製全部資訊
              </Button>
            </div>
          </DialogHeader>
          {copyStatus !== 'idle' && (
            <p
              className={cn(
                'text-xs',
                copyStatus === 'success' ? 'text-emerald-600' : 'text-red-500'
              )}
            >
              {copyStatus === 'success' ? '已複製簽證資訊' : '複製失敗，請手動複製。'}
            </p>
          )}
          <Tabs defaultValue="passport" className="mt-4">
            <TabsList className="grid h-12 grid-cols-2 rounded-lg bg-morandi-container text-sm text-morandi-secondary">
              <TabsTrigger value="passport">護照</TabsTrigger>
              <TabsTrigger value="taiwan">台胞證</TabsTrigger>
            </TabsList>
            <TabsContent value="passport" className="mt-4">
              {renderVisaInfoContent(PASSPORT_DELIVERY_OPTIONS, PASSPORT_REQUIREMENTS, PASSPORT_NOTES)}
            </TabsContent>
            <TabsContent value="taiwan" className="mt-4">
              {renderVisaInfoContent(
                TAIWAN_COMPATRIOT_DELIVERY_OPTIONS,
                TAIWAN_COMPATRIOT_REQUIREMENTS,
                TAIWAN_COMPATRIOT_NOTES,
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
                    value={contact_info.tour_id}
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
                    value={contact_info.order_id}
                    onChange={(value) => setContactInfo(prev => ({ ...prev, order_id: value }))}
                    options={orderOptions}
                    placeholder={contact_info.tour_id ? "請選擇訂單或留空自動建立" : "請先選擇團號"}
                    className="mt-1"
                    disabled={!contact_info.tour_id}
                    showSearchIcon
                    showClearButton
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-morandi-primary">聯絡人</label>
                  <Input
                    value={contact_info.contact_person}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="mt-1"
                    placeholder="請輸入聯絡人"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">申請人</label>
                  <Input
                    value={contact_info.applicant_name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, applicant_name: e.target.value }))}
                    className="mt-1"
                    placeholder="請輸入申請人姓名"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-morandi-primary">聯絡電話</label>
                  <Input
                    value={contact_info.contact_phone}
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
                    value={applicant.submission_date}
                    onChange={(e) => updateApplicant(applicant.id, 'submission_date', e.target.value)}
                    className="flex-1"
                  />

                  <Input
                    type="date"
                    value={applicant.received_date}
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
                      checked={applicant.is_urgent}
                      onChange={(e) => updateApplicant(applicant.id, 'is_urgent', e.target.checked)}
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
              disabled={!contact_info.applicant_name || applicants.every(a => !a.name)}
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
