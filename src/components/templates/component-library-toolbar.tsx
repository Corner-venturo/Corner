'use client';

import { FileText, Image as ImageIcon, Users, Calendar, DollarSign, Plane, AlignLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ComponentLibraryToolbarProps {
  onInsert: (componentData: any) => void;
}

// 定義快速組件（簡化版）
const quickComponents = [
  {
    id: 'logo',
    name: 'Logo',
    icon: ImageIcon,
    template: [['【Logo 區】', '', ''], ['', '', ''], ['', '', '']]
  },
  {
    id: 'title',
    name: '標題',
    icon: FileText,
    template: [['', '團體旅遊報價單', '', '', '']]
  },
  {
    id: 'customer-info',
    name: '客戶資訊',
    icon: Users,
    template: [
      ['客戶名稱', '{customer_name}', '', '報價日期', '{quote_date}'],
      ['聯絡人', '{contact_person}', '', '承辦業務', '{sales_person}'],
      ['聯絡電話', '{phone}', '', '預計日期', '{departure_date}']
    ]
  },
  {
    id: 'itinerary',
    name: '行程表',
    icon: Calendar,
    template: [
      ['天數', '行程內容', '早餐', '午餐', '晚餐', '住宿'],
      ['第1天', '', '飯店', '機上', '當地餐廳', ''],
      ['第2天', '', '飯店', '當地餐廳', '當地餐廳', '']
    ]
  },
  {
    id: 'price',
    name: '價格表',
    icon: DollarSign,
    template: [
      ['項目', '', '', '單位金額'],
      ['大人費用', '', '', '$'],
      ['小孩不佔床', '(滿12歲以下)', '', '$']
    ]
  },
  {
    id: 'flight',
    name: '航班資訊',
    icon: Plane,
    template: [
      ['航空公司', '航班代號', '出發機場', '抵達機場', '航行時間']
    ]
  },
  {
    id: 'notes',
    name: '備註',
    icon: AlignLeft,
    template: [
      ['備註'],
      ['1. '],
      ['2. ']
    ]
  }
];

export function ComponentLibraryToolbar({ onInsert }: ComponentLibraryToolbarProps) {
  const handleInsert = (component: typeof quickComponents[0]) => {
    // 複製到剪貼簿
    const templateText = component.template
      .map(row => row.join('\t'))
      .join('\n');

    navigator.clipboard.writeText(templateText);

    // 通知插入
    onInsert(component.template);

    // 提示用戶
    alert(`已複製「${component.name}」模板！\n請在左側 Excel 編輯器中按 Ctrl+V (Mac: Cmd+V) 貼上。`);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
      <span className="text-sm font-medium text-morandi-secondary whitespace-nowrap mr-2">
        快速插入：
      </span>
      {quickComponents.map((component) => {
        const Icon = component.icon;
        return (
          <Button
            key={component.id}
            variant="outline"
            size="sm"
            onClick={() => handleInsert(component)}
            className="whitespace-nowrap"
          >
            <Icon size={14} className="mr-1.5" />
            {component.name}
          </Button>
        );
      })}
    </div>
  );
}
