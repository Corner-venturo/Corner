# 旅客系統優化計劃

## 目標

優化旅客管理系統，支援：
1. 團體旅客總覽（匯總所有訂單的旅客）
2. 分房管理（拖拽式界面）
3. 企業客戶管理（統編、付款流程）
4. 旅客 Excel 匯入匯出

---

## 一、企業客戶系統（新增）

### 1.1 資料結構

#### 企業客戶表 (companies)

```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),

  -- 基本資訊
  company_name TEXT NOT NULL,                    -- 公司名稱
  company_name_en TEXT,                          -- 英文名稱
  tax_id TEXT UNIQUE,                            -- 統一編號（唯一）
  business_registration_number TEXT,             -- 營業登記號碼

  -- 聯絡資訊
  contact_person TEXT,                           -- 主要聯絡人
  contact_phone TEXT,                            -- 電話
  contact_email TEXT,                            -- Email
  address TEXT,                                  -- 地址

  -- 財務資訊
  payment_terms INTEGER DEFAULT 30,              -- 付款期限（天）
  payment_method TEXT DEFAULT 'transfer',        -- 付款方式（transfer/check/cash）
  credit_limit DECIMAL(12,2),                    -- 信用額度

  -- 發票資訊
  invoice_title TEXT,                            -- 發票抬頭（可能與公司名稱不同）
  invoice_address TEXT,                          -- 發票地址
  invoice_email TEXT,                            -- 電子發票 Email

  -- 業務資訊
  vip_level INTEGER DEFAULT 0,                   -- VIP 等級 (0-5)
  industry TEXT,                                 -- 產業別
  source TEXT,                                   -- 客戶來源
  sales_person_id UUID REFERENCES employees(id), -- 負責業務

  -- 備註
  note TEXT,

  -- 系統欄位
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID
);

-- 索引
CREATE INDEX idx_companies_workspace ON companies(workspace_id);
CREATE INDEX idx_companies_tax_id ON companies(tax_id);
CREATE INDEX idx_companies_sales_person ON companies(sales_person_id);

-- RLS（根據專案規範，禁用）
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
```

#### 企業聯絡人表 (company_contacts)

```sql
CREATE TABLE public.company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  title TEXT,                                    -- 職稱
  phone TEXT,
  mobile TEXT,
  email TEXT,
  note TEXT,
  is_primary BOOLEAN DEFAULT false,              -- 是否為主要聯絡人

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_contacts_company ON company_contacts(company_id);
ALTER TABLE public.company_contacts DISABLE ROW LEVEL SECURITY;
```

### 1.2 型別定義

```typescript
// src/types/company.types.ts

export interface Company {
  id: string
  workspace_id: string

  // 基本資訊
  company_name: string
  company_name_en?: string
  tax_id?: string
  business_registration_number?: string

  // 聯絡資訊
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string

  // 財務資訊
  payment_terms: number
  payment_method: 'transfer' | 'check' | 'cash'
  credit_limit?: number

  // 發票資訊
  invoice_title?: string
  invoice_address?: string
  invoice_email?: string

  // 業務資訊
  vip_level: number
  industry?: string
  source?: string
  sales_person_id?: string

  note?: string
  is_active: boolean
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
}

export interface CompanyContact {
  id: string
  company_id: string
  name: string
  title?: string
  phone?: string
  mobile?: string
  email?: string
  note?: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface CreateCompanyData {
  company_name: string
  company_name_en?: string
  tax_id?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  address?: string
  payment_terms?: number
  payment_method?: 'transfer' | 'check' | 'cash'
  invoice_title?: string
  invoice_address?: string
  invoice_email?: string
  vip_level?: number
  industry?: string
  source?: string
  sales_person_id?: string
  note?: string
}
```

### 1.3 Customer 表格擴充

```sql
-- 擴充現有 customers 表格，支援企業客戶
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'individual', -- 'individual' | 'company'
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

COMMENT ON COLUMN customers.customer_type IS '客戶類型: individual=個人, company=企業';
COMMENT ON COLUMN customers.company_id IS '所屬企業ID（當 customer_type=company 時）';

CREATE INDEX idx_customers_company ON customers(company_id);
```

---

## 二、團體旅客總覽（優化）

### 2.1 Tour-Members 頁面功能

#### 位置
- 路徑：`/tours/[id]/members`
- 組件：`src/app/tours/[id]/components/TourMembers.tsx`

#### 核心功能

**1. 旅客總覽**
```typescript
// 匯總所有訂單的旅客
const allMembers = useMemo(() => {
  const tourOrders = orders.filter(o => o.tour_id === tourId)
  const memberIds = tourOrders.flatMap(o => o.member_ids || [])
  return members.filter(m => memberIds.includes(m.id))
}, [orders, members, tourId])

// 統計資訊
const stats = {
  totalMembers: allMembers.length,
  maleCount: allMembers.filter(m => m.gender === 'M').length,
  femaleCount: allMembers.filter(m => m.gender === 'F').length,
  adultsCount: allMembers.filter(m => calculateAge(m.birthday, tour.departure_date) >= 18).length,
  childrenCount: allMembers.filter(m => calculateAge(m.birthday, tour.departure_date) < 18).length,
  assignedRooms: allMembers.filter(m => m.room_number).length,
}
```

**2. 旅客列表（EnhancedTable）**

```typescript
const columns = [
  { key: 'order_number', label: '訂單編號', sortable: true },
  { key: 'name', label: '姓名', sortable: true },
  { key: 'name_en', label: '英文姓名', sortable: true },
  { key: 'gender', label: '性別', render: (v) => v === 'M' ? '男' : '女' },
  { key: 'birthday', label: '生日', render: (v) => formatDate(v) },
  { key: 'age', label: '年齡', render: (_, row) => calculateAge(row.birthday, tour.departure_date) },
  { key: 'id_number', label: '身分證號', render: (v) => maskIdNumber(v) },
  { key: 'passport_number', label: '護照號碼' },
  { key: 'passport_expiry', label: '護照效期', render: (v) => formatDate(v) },
  { key: 'room_number', label: '房號', render: (v) => v || '-' },
  { key: 'room_type', label: '房型' },
  { key: 'meal_preference', label: '餐食偏好' },
  { key: 'actions', label: '操作', render: (_, row) => <ActionsCell member={row} /> },
]
```

**3. 匯入/匯出功能**

```typescript
// 匯出 Excel
const handleExportExcel = () => {
  const data = allMembers.map(m => ({
    '訂單編號': getOrderNumber(m),
    '姓名': m.name,
    '英文姓名': m.name_en,
    '性別': m.gender === 'M' ? '男' : '女',
    '生日': formatDate(m.birthday),
    '年齡': calculateAge(m.birthday, tour.departure_date),
    '身分證號': m.id_number,
    '護照號碼': m.passport_number,
    '護照效期': formatDate(m.passport_expiry),
    '房號': m.room_number || '-',
    '房型': m.room_type || '-',
    '餐食偏好': m.meal_preference || '-',
    '備註': m.note || '-',
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '旅客名單')
  XLSX.writeFile(workbook, `${tour.tour_name}_旅客名單.xlsx`)
}

// 匯入 Excel（更新旅客資料）
const handleImportExcel = async (file: File) => {
  const data = await file.arrayBuffer()
  const workbook = XLSX.read(data)
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet)

  // 根據姓名+身分證號匹配現有旅客並更新
  for (const row of jsonData) {
    const member = allMembers.find(
      m => m.name === row['姓名'] && m.id_number === row['身分證號']
    )
    if (member) {
      await updateMember(member.id, {
        room_number: row['房號'],
        room_type: row['房型'],
        meal_preference: row['餐食偏好'],
        note: row['備註'],
      })
    }
  }
}
```

---

## 三、分房管理系統

### 3.1 分房界面設計

#### 位置
- 路徑：`/tours/[id]/rooms`
- 組件：`src/app/tours/[id]/components/RoomAllocation.tsx`

#### UI 架構

```
┌─────────────────────────────────────────────────┐
│  分房管理 - 清邁 5 日遊                          │
│                                                 │
│  統計：30 人 | 已分配：28 人 | 未分配：2 人      │
├─────────────────────────────────────────────────┤
│                                                 │
│  未分配旅客 (2 人)                              │
│  ┌──────────┐  ┌──────────┐                    │
│  │ 王小明(男)│  │ 李小華(女)│                    │
│  └──────────┘  └──────────┘                    │
│                                                 │
│  房間配置                                       │
│  ┌─────────────────────────────┐               │
│  │ 101 - 雙人房 (2/2)          │               │
│  │  ┌──────────┐  ┌──────────┐ │               │
│  │  │ 張三(男) │  │ 李四(男) │ │               │
│  │  └──────────┘  └──────────┘ │               │
│  └─────────────────────────────┘               │
│                                                 │
│  ┌─────────────────────────────┐               │
│  │ 102 - 雙人房 (1/2) ⚠️        │               │
│  │  ┌──────────┐                │               │
│  │  │ 王五(女) │  [空位]        │               │
│  │  └──────────┘                │               │
│  └─────────────────────────────┘               │
│                                                 │
│  [+ 新增房間]                                   │
└─────────────────────────────────────────────────┘
```

#### 核心功能

**1. 自動解析房型**

```typescript
// 從請款單自動解析房型數量
const parseRoomTypesFromRequests = (paymentRequests: PaymentRequest[]) => {
  const roomTypes: Record<string, number> = {}

  paymentRequests.forEach(req => {
    req.items.forEach(item => {
      if (item.category === '住宿') {
        // 解析描述中的房型資訊
        // 例如：「雙人房 x 5 間」→ { '雙人房': 5 }
        const match = item.description.match(/([^\d]+)\s*x?\s*(\d+)\s*間?/)
        if (match) {
          const [, roomType, count] = match
          roomTypes[roomType.trim()] = (roomTypes[roomType.trim()] || 0) + parseInt(count)
        }
      }
    })
  })

  return roomTypes
}

// 根據房型推算容量
const getRoomCapacity = (roomType: string): number => {
  const capacityMap: Record<string, number> = {
    '單人房': 1,
    '雙人房': 2,
    '雙床房': 2,
    '三人房': 3,
    '四人房': 4,
    '家庭房': 4,
  }

  return capacityMap[roomType] || 2 // 預設 2 人
}
```

**2. 拖拽分房**

```typescript
// 使用 dnd-kit 實作拖拽
import { DndContext, DragOverlay } from '@dnd-kit/core'

const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event

  if (!over) return

  const memberId = active.id as string
  const roomId = over.id as string

  // 檢查房間容量
  const room = rooms.find(r => r.id === roomId)
  if (!room) return

  const currentOccupancy = allMembers.filter(m => m.room_id === roomId).length
  const capacity = getRoomCapacity(room.room_type)

  if (currentOccupancy >= capacity) {
    alert(`⚠️ ${room.room_type} 已滿（${capacity}人）`)
    return
  }

  // 更新旅客房間
  updateMember(memberId, {
    room_id: roomId,
    room_number: room.room_number,
    room_type: room.room_type,
  })
}
```

**3. 智慧建議分房**

```typescript
const suggestRoomAllocation = () => {
  // 按性別分組
  const males = unassignedMembers.filter(m => m.gender === 'M')
  const females = unassignedMembers.filter(m => m.gender === 'F')

  // 優先分配雙人房
  const doubleRooms = rooms.filter(r => r.room_type === '雙人房' && !r.isFull)

  let roomIndex = 0

  // 分配男性
  for (let i = 0; i < males.length; i += 2) {
    const room = doubleRooms[roomIndex++]
    if (!room) break

    updateMember(males[i].id, { room_id: room.id, room_number: room.room_number })
    if (males[i + 1]) {
      updateMember(males[i + 1].id, { room_id: room.id, room_number: room.room_number })
    }
  }

  // 分配女性
  for (let i = 0; i < females.length; i += 2) {
    const room = doubleRooms[roomIndex++]
    if (!room) break

    updateMember(females[i].id, { room_id: room.id, room_number: room.room_number })
    if (females[i + 1]) {
      updateMember(females[i + 1].id, { room_id: room.id, room_number: room.room_number })
    }
  }
}
```

---

## 四、實作優先順序

### Phase 1: 企業客戶系統（2-3 天）

**Day 1: 資料庫與型別**
- [ ] 創建 companies 和 company_contacts 表格
- [ ] 擴充 customers 表格
- [ ] 創建型別定義和 Store

**Day 2: UI 組件**
- [ ] 企業客戶列表頁面
- [ ] 企業客戶表單（新增/編輯）
- [ ] 企業聯絡人管理

**Day 3: 整合**
- [ ] 訂單建立時選擇企業客戶
- [ ] 顯示企業客戶的統編和付款條件
- [ ] 收款單關聯企業客戶

### Phase 2: 旅客總覽優化（1-2 天）

**Day 1: 旅客總覽**
- [ ] 創建 TourMembers 頁面
- [ ] 實作旅客統計
- [ ] 旅客列表表格

**Day 2: 匯入匯出**
- [ ] Excel 匯出功能
- [ ] Excel 匯入更新功能
- [ ] 批量操作

### Phase 3: 分房管理（2-3 天）

**Day 1: 房間管理**
- [ ] 創建 RoomAllocation 頁面
- [ ] 房型自動解析
- [ ] 房間列表顯示

**Day 2: 拖拽分房**
- [ ] 實作拖拽功能
- [ ] 容量檢查
- [ ] 視覺化反饋

**Day 3: 智慧功能**
- [ ] 智慧分房建議
- [ ] 分房規則設定
- [ ] 分房報表匯出

---

## 五、技術棧

- **拖拽**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Excel**: `xlsx`（已安裝）
- **PDF**: `jspdf` + `jspdf-autotable`（已安裝）
- **狀態管理**: Zustand（現有）
- **UI**: shadcn/ui + Morandi 設計系統（現有）

---

## 六、資料流程圖

### 企業客戶流程

```
1. 建立企業客戶
   ├─ 填寫統編、公司名稱
   ├─ 設定付款條件（30天、60天）
   └─ 設定信用額度

2. 建立訂單
   ├─ 選擇企業客戶
   ├─ 自動帶入統編
   └─ 顯示付款條件

3. 收款管理
   ├─ 收款單關聯企業客戶
   ├─ 檢查信用額度
   └─ 追蹤付款進度
```

### 旅客管理流程

```
1. 訂單建立
   ├─ 輸入旅客資料（訂單中）
   └─ 自動關聯到團

2. 團體旅客總覽
   ├─ 匯總所有訂單的旅客
   ├─ 顯示統計資訊
   └─ Excel 匯出名單

3. 分房管理
   ├─ 自動解析房型數量
   ├─ 拖拽分配旅客
   └─ 生成分房表
```

---

## 七、未來擴充

- 護照效期自動提醒
- 簽證狀態追蹤
- 旅客歷史記錄
- 企業客戶對帳單
- 企業客戶信用評分
- 自動化發票開立

---

**文檔版本**: 1.0
**建立日期**: 2025-11-09
**作者**: Claude (AI Assistant)
