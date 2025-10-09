'use client';

import { FileText, Image as ImageIcon, Table, AlignLeft, Calendar, Users, DollarSign, Plane } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface Component {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  template: string[][];  // Excel 資料格式
}

interface ComponentCategory {
  name: string;
  icon: React.ElementType;
  components: Component[];
}

// 定義組件庫
const componentCategories: ComponentCategory[] = [
  {
    name: '標題與Logo',
    icon: ImageIcon,
    components: [
      {
        id: 'logo',
        name: 'Logo 區塊',
        icon: ImageIcon,
        description: '公司 Logo 圖片區',
        template: [
          ['【Logo 區】', '', ''],
          ['', '', ''],
          ['', '', '']
        ]
      },
      {
        id: 'title',
        name: '主標題',
        icon: FileText,
        description: '報價單標題',
        template: [
          ['', '團體旅遊報價單', '', '', '']
        ]
      }
    ]
  },
  {
    name: '基本資訊',
    icon: AlignLeft,
    components: [
      {
        id: 'customer-info',
        name: '客戶資訊表',
        icon: Users,
        description: '客戶聯絡資訊表格',
        template: [
          ['客戶名稱', '{customer_name}', '', '報價日期', '{quote_date}'],
          ['聯絡人', '{contact_person}', '', '承辦業務', '{sales_person}'],
          ['聯絡電話', '{phone}', '', '預計日期', '{departure_date}'],
          ['地址', '{address}', '', '', '']
        ]
      },
      {
        id: 'tour-info',
        name: '旅遊資訊',
        icon: Plane,
        description: '行程基本資訊',
        template: [
          ['旅遊名稱', '{tour_name}'],
          ['出發日期', '{departure_date}'],
          ['返回日期', '{return_date}'],
          ['預計人數', '{participants}', '人']
        ]
      }
    ]
  },
  {
    name: '行程與費用',
    icon: Table,
    components: [
      {
        id: 'itinerary-table',
        name: '行程表',
        icon: Calendar,
        description: '每日行程詳細表格',
        template: [
          ['天數', '行程內容', '早餐', '午餐', '晚餐', '住宿'],
          ['第1天', '', '飯店', '機上', '當地餐廳', ''],
          ['第2天', '', '飯店', '當地餐廳', '當地餐廳', ''],
          ['第3天', '', '飯店', '當地餐廳', '當地餐廳', '']
        ]
      },
      {
        id: 'price-table',
        name: '價格表',
        icon: DollarSign,
        description: '費用明細表',
        template: [
          ['項目', '', '', '單位金額'],
          ['大人費用', '', '', '$'],
          ['小孩不佔床', '(滿12歲以下)', '', '$'],
          ['嬰兒', '', '', '$']
        ]
      },
      {
        id: 'flight-info',
        name: '航班資訊',
        icon: Plane,
        description: '航班時刻表',
        template: [
          ['航空公司', '航班代號', '出發機場', '抵達機場', '航行時間'],
          ['', '', '', '', '']
        ]
      }
    ]
  },
  {
    name: '說明與備註',
    icon: AlignLeft,
    components: [
      {
        id: 'notes',
        name: '備註區',
        icon: FileText,
        description: '注意事項與備註',
        template: [
          ['備註'],
          ['1. '],
          ['2. '],
          ['3. ']
        ]
      },
      {
        id: 'inclusions',
        name: '費用包含',
        icon: DollarSign,
        description: '費用包含項目',
        template: [
          ['費用包含'],
          ['• 來回機票（含稅金）'],
          ['• 行程表所列之住宿費用'],
          ['• 行程表所列之餐食費用'],
          ['• 旅遊期間參加活動費用']
        ]
      },
      {
        id: 'exclusions',
        name: '費用不含',
        icon: DollarSign,
        description: '費用不包含項目',
        template: [
          ['費用不含'],
          ['• 新辦護照費用'],
          ['• 導遊、司機小費'],
          ['• 個人消費'],
          ['• 旅遊平安保險（建議自行投保）']
        ]
      }
    ]
  }
];

interface ComponentLibraryProps {
  onInsert: (componentData: string[][]) => void;
}

export function ComponentLibrary({ onInsert }: ComponentLibraryProps) {
  const handleComponentClick = (component: Component) => {
    onInsert(component.template);

    // 同時複製到剪貼簿
    const templateText = component.template
      .map(row => row.join('\t'))
      .join('\n');
    navigator.clipboard.writeText(templateText);
  };

  // 扁平化所有組件
  const allComponents = componentCategories.flatMap(category => category.components);

  return (
    <div className="px-6 py-3">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-sm font-medium text-morandi-secondary whitespace-nowrap mr-2">
          快速插入：
        </span>
        {allComponents.map((component) => {
          const Icon = component.icon;
          return (
            <Button
              key={component.id}
              variant="outline"
              size="sm"
              onClick={() => handleComponentClick(component)}
              className="whitespace-nowrap"
              title={component.description}
            >
              <Icon size={14} className="mr-1.5" />
              {component.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
