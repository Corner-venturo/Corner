# Venturo ERP - 旅客（Passenger/Member）管理架構全面分析

> 整理時間：2025-11-09
> 專案：Venturo 旅遊團管理系統 (Corner ERP)
> 基於 Next.js 15.5.4 + Zustand + Supabase

---

## 目錄

1. [旅客資料結構](#旅客資料結構)
2. [旅客與訂單的關聯](#旅客與訂單的關聯)
3. [旅客與團體的關聯](#旅客與團體的關聯)
4. [分房功能實作](#分房功能實作)
5. [旅客匯入匯出](#旅客匯入匯出)
6. [企業客戶管理](#企業客戶管理)
7. [架構設計總結](#架構設計總結)

---

## 旅客資料結構

### 1. 核心旅客型別定義 (Member Interface)

**檔案位置：** `/src/types/order.types.ts`

```typescript
export interface Member extends BaseEntity {
  order_id: string              // 所屬訂單 ID
  tour_id: string               // 所屬旅遊團 ID（重要！）
  name: string                  // 姓名（中文）
  name_en: string               // 英文姓名/拼音
  birthday: string              // 生日 YYYY-MM-DD
  passport_number: string       // 護照號碼
  passport_expiry: string       // 護照到期日 YYYY-MM-DD
  id_number: string             // 身分證字號
  gender: 'M' | 'F' | ''        // 性別
  age?: number                  // 年齡（計算欄位）
  phone?: string                // 電話
  email?: string                // Email
  emergency_contact?: string    // 緊急聯絡人
  emergency_phone?: string      // 緊急聯絡電話
  dietary_restrictions?: string // 飲食限制
  medical_conditions?: string   // 醫療狀況
  room_preference?: string      // 房間偏好
  assigned_room?: string        // 分配的房間（分房功能）
  is_child_no_bed?: boolean     // 小孩不佔床
  reservation_code?: string     // 訂位代號
  add_ons?: string[]            // 加購項目IDs
  refunds?: string[]            // 退費項目IDs
  notes?: string                // 備註
}
```

### 2. 資料庫表結構 (Supabase)

**表名：** `members`

```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  gender VARCHAR(10),                -- 'M', 'F', ''
  birthday VARCHAR(20),              -- YYYY-MM-DD
  id_number VARCHAR(50),
  passport_number VARCHAR(50),
  passport_expiry VARCHAR(20),       -- YYYY-MM-DD
  phone VARCHAR(50),
  email VARCHAR(255),
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(50),
  dietary_restrictions TEXT,
  medical_conditions TEXT,
  room_preference VARCHAR(50),
  assigned_room VARCHAR(50),         -- 分房欄位
  reservation_code VARCHAR(50),      -- 訂位代號
  is_child_no_bed BOOLEAN DEFAULT FALSE,
  add_ons TEXT[],                    -- 加購項目
  refunds TEXT[],                    -- 退費項目
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 關鍵索引
CREATE INDEX idx_members_order_id ON members(order_id);
CREATE INDEX idx_members_tour_id ON members(tour_id);
CREATE INDEX idx_members_id_number ON members(id_number);
CREATE INDEX idx_members_passport_number ON members(passport_number);
```

### 3. 建立/更新旅客的型別

```typescript
interface CreateMemberData {
  order_id: string
  tour_id: string
  name: string
  english_name?: string
  gender: Gender
  date_of_birth: string
  age_category: AgeCategory
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  phone?: string
  email?: string
  emergency_contact?: string
  emergency_phone?: string
  dietary_restrictions?: string
  medical_conditions?: string
  room_type?: RoomType
  room_mate_id?: string
  seat_preference?: string
  notes?: string
}

interface UpdateMemberData {
  name?: string
  english_name?: string
  gender?: Gender
  date_of_birth?: string
  age_category?: AgeCategory
  id_number?: string
  passport_number?: string
  passport_expiry?: string
  phone?: string
  email?: string
  emergency_contact?: string
  emergency_phone?: string
  dietary_restrictions?: string
  medical_conditions?: string
  room_type?: RoomType
  room_mate_id?: string
  seat_preference?: string
  notes?: string
}
```

---

## 旅客與訂單的關聯

### 1. 資料關聯結構

**訂單 (Order) → 旅客 (Member) 的一對多關係**

```
Order (訂單)
  ├─ id: UUID
  ├─ code: 訂單編號 (O20240001)
  ├─ order_number: 訂單號
  ├─ tour_id: 旅遊團ID
  ├─ customer_id: 客戶ID (可選)
  ├─ contact_person: 聯絡人
  ├─ member_count: 團員人數
  ├─ payment_status: 付款狀態
  └─ total_amount: 總金額

Member (旅客)
  ├─ id: UUID
  ├─ order_id: 所屬訂單 (FK to orders.id)
  ├─ tour_id: 所屬旅遊團 (FK to tours.id)
  ├─ name: 旅客姓名
  ├─ gender: 性別
  ├─ birthday: 生日
  └─ assigned_room: 分配房間
```

### 2. Order 型別定義

**檔案位置：** `/src/types/order.types.ts`

```typescript
export interface Order extends BaseEntity {
  order_number: string          // 訂單編號
  code: string                  // 團號代碼
  tour_id: string               // 旅遊團 ID
  tour_name: string             // 旅遊團名稱
  customer_id?: string          // 客戶 ID（可選）
  contact_person: string        // 聯絡人
  contact_phone?: string        // 聯絡電話
  sales_person: string          // 業務人員
  assistant: string             // 助理
  member_count: number          // 團員人數
  payment_status: PaymentStatus // 付款狀態
  status?: OrderStatus          // 訂單狀態
  total_amount: number          // 總金額
  paid_amount: number           // 已付金額
  remaining_amount: number      // 待付金額
  notes?: string                // 備註
}
```

### 3. 狀態枚舉

```typescript
export type OrderStatus = 
  | 'pending'        // 待確認
  | 'confirmed'      // 已確認
  | 'completed'      // 已完成
  | 'cancelled'      // 已取消

export type PaymentStatus = 
  | 'unpaid'         // 未付款
  | 'partial'        // 部分付款
  | 'paid'           // 已付清
  | 'refunded'       // 已退款
```

### 4. 訂單-旅客查詢邏輯

**檔案位置：** `/src/components/tours/tour-members.tsx`

```typescript
// 獲取屬於一個旅遊團的所有訂單
const tourOrders = orders.filter(order => order.tour_id === tour.id)

// 獲取屬於這些訂單的所有旅客
const tourMembers = members.filter(member =>
  tourOrders.some(order => order.id === member.order_id)
)

// 取得旅客對應的訂單資訊
const relatedOrder = tourOrders.find(order => order.id === member.order_id)
```

---

## 旅客與團體的關聯

### 1. 三層關聯結構

```
Tour (旅遊團)
  ├─ id: UUID
  ├─ code: 團號 (T20240001)
  ├─ name: 團體名稱
  ├─ departure_date: 出發日期
  ├─ return_date: 返回日期
  ├─ max_participants: 最多人數
  ├─ current_participants: 當前人數
  └─ status: 團體狀態
    ├─ 提案
    ├─ 已確認
    ├─ 進行中
    └─ 已完成

Order (訂單) - 該團體的所有訂單
  ├─ order_id: UUID
  ├─ tour_id: 旅遊團ID (FK)
  └─ member_count: 該訂單的成員數

Member (旅客) - 該訂單的所有旅客
  ├─ member_id: UUID
  ├─ order_id: 訂單ID (FK)
  └─ tour_id: 旅遊團ID (FK)
```

### 2. Tour 型別定義

**檔案位置：** `/src/types/tour.types.ts`

```typescript
export interface Tour extends BaseEntity {
  code: string                      // 團號
  name: string                      // 團體名稱
  departure_date: string            // 出發日期
  return_date: string               // 返回日期
  status: TourStatus                // 團體狀態
  location: string                  // 目的地
  price: number                     // 成人價格
  max_participants: number          // 最多參加人數
  current_participants?: number     // 當前參加人數
  contract_status: ContractStatus   // 合約狀態
  total_revenue: number             // 總收入
  total_cost: number                // 總成本
  profit: number                    // 利潤
  description?: string              // 說明
  is_active: boolean                // 是否啟用
}
```

### 3. 旅遊團統計邏輯

**檔案位置：** `/src/components/tours/tour-members.tsx`

```typescript
// 計算該旅遊團的總成員數
const totalMembers = tableMembers.length

// 計算已完成資料的成員數
const completedMembers = tableMembers.filter(
  member => member.name && member.idNumber
).length

// 計算完成率
const completionRate = totalMembers > 0 
  ? Math.round((completedMembers / totalMembers) * 100) 
  : 0

// 按訂單分組統計
const membersByOrder = tourOrders.map(order => ({
  order_id: order.id,
  order_number: order.order_number,
  member_count: tableMembers.filter(m => m.order_id === order.id).length
}))
```

---

## 分房功能實作

### 1. 分房組件

**檔案位置：** `/src/components/tours/room-allocation.tsx`

#### 核心功能：
1. **房間配額解析** - 從請款單提取房型和數量
2. **分房分配** - 將旅客分配到具體房間
3. **容量管理** - 確保房間不超載
4. **可視化統計** - 房間使用狀況展示

### 2. 房間資料結構

```typescript
interface RoomOption {
  value: string         // 房間唯一識別 (如: "雙人房-1")
  label: string         // 顯示標籤
  room_type: string     // 房型 (如: "雙人房")
  capacity: number      // 容量 (1, 2, 3, 或 4)
  currentCount: number  // 當前已分配人數
}

interface MemberWithRoom extends Member {
  assignedRoom?: string // 分配的房間
}
```

### 3. 房間容量推算邏輯

```typescript
const getRoomCapacity = (room_type: string): number => {
  if (room_type.includes('單人')) return 1
  if (room_type.includes('雙人')) return 2
  if (room_type.includes('三人')) return 3
  if (room_type.includes('四人')) return 4
  return 2 // 預設雙人房
}
```

### 4. 房間配額來源

房間配額來自 **PaymentRequest** (請款單)：

```typescript
// 從請款單提取房型和數量
const roomMatches = item.description.match(/(\S+房)\s*[x×]\s*(\d+)/g)
// 例如：描述為 "雙人房 x5, 三人房 x2"
// 會生成 10 個房間選項
//   - 雙人房-1 (容量2)
//   - 雙人房-2 (容量2)
//   - ...
//   - 三人房-1 (容量3)
//   - 三人房-2 (容量3)
```

### 5. 分房UI視圖

```
┌─ 房間配額總覽
│  ├─ 總房間數: 7
│  ├─ 總床位數: 15
│  ├─ 已分房: 12
│  └─ 未分房: 3
│
├─ 團員分房表格
│  ├─ 序號 | 姓名 | 性別 | 年齡 | 分房 | 狀態
│  ├─ 下拉選單自動更新房間使用狀況
│  └─ 超滿自動禁用選項
│
└─ 房間使用狀況網格
   ├─ 各房間卡片，顯示入住者名單
   ├─ 已滿房用紅色標記
   └─ 空房顯示 "空房"
```

### 6. 分房儲存機制

```typescript
// 分配房間時自動更新 member.assigned_room
const assignMemberToRoom = (member_id: string, roomValue: string) => {
  // 前端狀態更新
  setMembersWithRooms(prev =>
    prev.map(member =>
      member.id === member_id 
        ? { ...member, assignedRoom: roomValue || undefined } 
        : member
    )
  )
  // 自動保存到 Store/Database
  updateRoomCounts()
}
```

---

## 旅客匯入匯出

### 1. 旅客Excel編輯表格

**檔案位置：** `/src/components/members/excel-member-table.tsx`

#### 功能特性：
- **Excel式操作** - 支援 Tab 鍵導航、複製貼上
- **自動儲存** - 編輯即保存，無需額外按鈕
- **自動計算** - 年齡、性別自動推導
- **行編輯** - 點擊任意單元格編輯
- **新增行** - 自動補充至指定人數

#### 支援欄位：
```typescript
const dataSheetColumns = [
  { key: 'index', label: '序號', readOnly: true },
  { key: 'name', label: '姓名' },
  { key: 'nameEn', label: '英文姓名' },
  { key: 'birthday', label: '生日' },
  { key: 'age', label: '年齡', readOnly: true },  // 自動計算
  { key: 'gender', label: '性別', readOnly: true }, // 自動推導
  { key: 'idNumber', label: '身分證字號' },
  { key: 'passportNumber', label: '護照號碼' },
  { key: 'passportExpiry', label: '護照效期' },
  { key: 'reservationCode', label: '訂位代號' },
]
```

### 2. 自動計算邏輯

```typescript
// 從身分證號自動計算性別
const gender = getGenderFromIdNumber(idNumber) // 'M' 或 'F'

// 根據生日或身分證號計算年齡
const age = calculateAge(birthday || idNumber, departureDate, returnDate)

// 性別對應：
// - 第2位奇數 → 男 (M)
// - 第2位偶數 → 女 (F)
```

### 3. TourMembers 進階編輯表

**檔案位置：** `/src/components/tours/tour-members.tsx`

#### 功能特性：
- **整團查看** - 一次性顯示團體的所有成員（跨多個訂單）
- **訂單色調區分** - 不同訂單用不同背景色區分
- **拖拽排序** - 調整成員順序
- **批量操作** - 刪除、編輯、新增
- **實時統計** - 總人數、完成率

#### 支援欄位：
```
序號 | 姓名 | 英文姓名 | 生日 | 年齡 | 性別 | 身分證字號 | 
護照號碼 | 護照效期 | 所屬訂單 | 聯絡人 | 分房 | 操作
```

### 4. 匯出功能

**檔案位置：** `/src/lib/excel/`

已有通用Excel匯出模組：
- `payment-request-excel.ts` - 請款單Excel
- `receipt-excel.ts` - 收據Excel

**旅客匯出可擴展：**

```typescript
// 建議實作
export async function exportMembersToExcel(
  members: Member[],
  orders: Order[],
  tour: Tour
): Promise<void> {
  // 使用 ExcelJS 或 SheetJS
  // 1. 生成工作表
  // 2. 格式化日期、性別等欄位
  // 3. 添加統計行
  // 4. 觸發下載
}
```

---

## 企業客戶管理

### 1. 客戶型別定義

**檔案位置：** `/src/types/customer.types.ts`

```typescript
export interface Customer extends BaseEntity {
  code: string                         // 客戶編號 (C20240001)
  name: string                         // 客戶姓名
  english_name?: string                // 英文姓名
  phone: string                        // 主要電話
  alternative_phone?: string           // 備用電話
  email?: string                       // Email
  address?: string                     // 地址
  city?: string                        // 城市
  country?: string                     // 國家
  national_id?: string                 // 身分證字號 (個人客戶)
  passport_number?: string             // 護照號碼
  passport_romanization?: string       // 護照拼音 (WANG/XIAOMING)
  passport_expiry_date?: string        // 護照效期
  date_of_birth?: string               // 出生日期
  gender?: string                      // 性別
  company?: string                     // 公司名稱 (企業客戶)
  tax_id?: string                      // 統編 (企業客戶)
  is_vip: boolean                      // VIP 標記
  vip_level?: VipLevel                 // VIP 等級
  source?: CustomerSource              // 客戶來源
  referred_by?: string                 // 推薦人
  notes?: string                       // 備註
  is_active: boolean                   // 是否啟用
  total_orders?: number                // 統計：總訂單數
  total_spent?: number                 // 統計：總消費金額
  last_order_date?: string             // 統計：最後訂單日期
}
```

### 2. 客戶分類

#### VIP 等級
```typescript
export type VipLevel =
  | 'bronze'    // 銅卡
  | 'silver'    // 銀卡
  | 'gold'      // 金卡
  | 'platinum'  // 白金卡
  | 'diamond'   // 鑽石卡
```

#### 客戶來源
```typescript
export type CustomerSource =
  | 'website'   // 官網
  | 'facebook'  // Facebook
  | 'instagram' // Instagram
  | 'line'      // LINE
  | 'referral'  // 推薦
  | 'phone'     // 電話
  | 'walk_in'   // 現場
  | 'other'     // 其他
```

### 3. 企業客戶 vs 個人客戶

| 欄位 | 個人客戶 | 企業客戶 |
|-----|--------|--------|
| name | 個人姓名 | 公司名稱 |
| english_name | 英文姓名 | 英文公司名 |
| national_id | 身分證號 | - |
| tax_id | - | 統一編號 |
| company | - | 公司名稱(同name) |
| contact_person | (name) | 聯絡人 |

### 4. 訂單與客戶的關聯

```typescript
// Order 中的客戶參考
export interface Order extends BaseEntity {
  customer_id?: string        // 可選的客戶ID
  contact_person: string      // 團體聯絡人（必填）
  contact_phone?: string      // 聯絡電話
  // ...其他訂單欄位
}

// 查詢邏輯
const getOrdersByCustomer = (customer_id: string) => {
  return orders.filter(o => o.customer_id === customer_id)
}
```

---

## 架構設計總結

### 1. 四層架構圖

```
┌─────────────────────────────────────┐
│      UI Components (React)          │
│  TourMembers / RoomAllocation      │
│  ExcelMemberTable                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Zustand State Management       │
│  useMemberStore                     │
│  useOrderStore                      │
│  useTourStore                       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Services Layer                 │
│  orderService                       │
│  memberService (implicit)           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Adapters (SyncCoordinator)     │
│  Supabase Adapter (雲端)             │
│  IndexedDB Adapter (本地快取)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Supabase Database              │
│  tables: members, orders, tours     │
│  RLS: Disabled (內部系統)            │
└─────────────────────────────────────┘
```

### 2. 資料流向

```
CREATE/UPDATE/DELETE Member
    │
    ▼
TourMembers Component (前端編輯)
    │
    ▼
useMemberStore (Zustand 狀態)
    │
    ▼
SyncCoordinator
    │
    ├─▶ IndexedDB (立即寫入)
    │
    └─▶ Supabase (背景同步)
    
FETCH Member
    │
    ▼
useMemberStore.fetchAll()
    │
    ├─▶ IndexedDB (快速取得)
    │
    └─▶ Supabase (背景更新)
```

### 3. 關鍵設計決策

| 決策項目 | 選擇 | 原因 |
|--------|------|-----|
| 離線編輯 | 否 | 內部系統，網路通常可用 |
| 快取策略 | IndexedDB | 加速載入，無需複雜離線邏輯 |
| RLS | 禁用 | 內部認證系統已足夠 |
| 編號格式 | 自動生成 (M前綴) | 系統管理，無人工輸入 |
| 外鍵關聯 | tour_id + order_id | 確保資料完整性 |

### 4. 核心檔案清單

| 檔案 | 功能 | 類型 |
|-----|------|------|
| `/src/types/order.types.ts` | 旅客/訂單型別定義 | 型別 |
| `/src/types/customer.types.ts` | 客戶型別定義 | 型別 |
| `/src/components/tours/tour-members.tsx` | 整團旅客管理 | UI組件 |
| `/src/components/tours/room-allocation.tsx` | 分房管理 | UI組件 |
| `/src/components/members/excel-member-table.tsx` | Excel編輯表格 | UI組件 |
| `/src/stores/index.ts` | Zustand Store初始化 | Store |
| `/src/stores/core/create-store.ts` | Store工廠函數 | Store |
| `/src/features/orders/services/order.service.ts` | 訂單業務邏輯 | Service |
| `/supabase-migration.sql` | 資料庫結構 | SQL |

### 5. 狀態管理模式

```typescript
// Store 建立
export const useMemberStore = createStore<Member>('members')

// Store 使用
const { items: members, create, update, delete, fetchAll } = useMemberStore()

// 搭配 SyncCoordinator
// - fetchAll() 自動從 IndexedDB 取得，背景與 Supabase 同步
// - create/update/delete 直接寫入 Supabase + IndexedDB
```

### 6. 性能最佳實踐

```typescript
// ✅ 推薦
1. 使用 React.memo 包裝大型表格組件
2. 使用 useMemo 快取計算結果（完成率、統計數據）
3. 使用 useCallback 穩定函數引用
4. 虛擬化長列表（200+ 成員時）

// ❌ 避免
1. 在組件內頻繁計算（應用 useMemo）
2. 無條件重新渲染（應用 React.memo）
3. 同時訂閱多個 Store（應用 Zustand 選擇器）
```

### 7. 擴展建議

#### 1. 實時協作編輯
```typescript
// 使用 Realtime Manager 訂閱 members 表
useRealtimeForMembers(tourId)
// → 其他使用者的編輯立即顯示
```

#### 2. 批量匯入
```typescript
// 支援 Excel/CSV 匯入
importMembersFromFile(file: File, orderId: string)
// → 驗證 → 去重 → 批量建立
```

#### 3. 高級統計
```typescript
// 按年齡分布、性別比例、護照效期等統計
getMembersStatistics(tourId: string)
```

#### 4. 簽證管理
```typescript
// 與簽證系統集成
Member.visa_status: 'pending' | 'submitted' | 'issued' | 'collected'
```

---

## 總結

Venturo ERP 的旅客管理系統採用：

1. **清晰的層級結構** - UI / State / Service / Database 四層分離
2. **靈活的編輯方式** - Excel表格、行編輯、拖拽排序多種操作方式
3. **智慧化的分房系統** - 自動解析配額、容量管理、可視化統計
4. **完整的客戶管理** - 支援個人和企業客戶、VIP分級、來源追蹤
5. **離線優先策略** - IndexedDB 快取 + Supabase 雲端同步
6. **高度複用的 Store** - 統一的 Store 工廠函數，易於擴展

該架構適合 10-50 人的中型旅行社團隊，可支援數十個並行旅遊團的管理。

