# 旅客管理 - 檔案索引

## 型別定義檔案

### 1. `/src/types/order.types.ts` (261 行)
**主要內容：**
- `Member` 介面 - 旅客核心資料結構
- `Order` 介面 - 訂單資料結構
- 狀態枚舉 (OrderStatus, PaymentStatus)
- 建立/更新資料型別 (CreateMemberData, UpdateMemberData)
- 篩選與查詢型別

**關鍵欄位：**
```typescript
interface Member extends BaseEntity {
  order_id: string                // 訂單FK
  tour_id: string                 // 旅遊團FK
  name: string                    // 姓名
  name_en: string                 // 英文姓名
  birthday: string                // YYYY-MM-DD
  passport_number: string         // 護照號
  passport_expiry: string         // 護照效期
  id_number: string               // 身分證號
  gender: 'M' | 'F' | ''          // 性別
  assigned_room?: string          // 分房欄位
  // ... 13 個其他欄位
}
```

### 2. `/src/types/customer.types.ts` (180 行)
**主要內容：**
- `Customer` 介面 - 客戶資料
- VipLevel 枚舉 - 5 個VIP等級
- CustomerSource 枚舉 - 8 個客戶來源
- CustomerStats - 統計型別

**重點欄位：**
```typescript
interface Customer extends BaseEntity {
  code: string                    // 客戶編號
  name: string                    // 客戶名稱
  company?: string                // 公司名稱
  tax_id?: string                 // 統編
  is_vip: boolean                 // VIP標記
  vip_level?: VipLevel            // VIP等級
}
```

### 3. `/src/types/flight-itinerary.types.ts` (132 行)
**主要內容：**
- `FlightPassenger` - 航班旅客資訊
- `FlightSegment` - 航段資訊
- `BaggageAllowance` - 行李額度
- `FlightItinerary` - 完整航班行程

**用途：** 與旅客護照號、姓名串聯

### 4. `/src/types/confirmation.types.ts` (126 行)
**主要內容：**
- `AccommodationData` - 住宿確認單
- `FlightPassenger` - 機票旅客
- `FlightData` - 機票確認單

---

## 儲存層 (Store)

### 1. `/src/stores/index.ts` (最前 80 行)
**用途：** 統一暴露所有 Store

```typescript
export const useMemberStore = createStore<Member>('members')
export const useOrderStore = createStore<Order>('orders', 'O')
export const useTourStore = createStore<Tour>('tours', 'T')
export const useCustomerStore = createStore<Customer>('customers', 'C')
```

**重點：** 使用 createStore 工廠函數統一建立所有 Store

### 2. `/src/stores/core/create-store.ts` (250+ 行)
**功能：** Store 工廠函數

```typescript
export function createStore<T extends BaseEntity>(
  tableNameOrConfig: TableName | StoreConfig,
  codePrefixParam?: string,
  enableSupabaseParam: boolean = true
)
```

**核心流程：**
1. 建立 IndexedDBAdapter (本地快取)
2. 建立 SupabaseAdapter (雲端)
3. 建立 SyncCoordinator (同步協調)
4. 返回 Zustand Store + 操作方法

**提供的 Store 方法：**
- `fetchAll()` - 取所有資料
- `fetchById(id)` - 按ID取資料
- `create(data)` - 新增
- `update(id, data)` - 更新
- `delete(id)` - 刪除
- `filter(predicate)` - 篩選
- `count()` - 計數

### 3. `/src/stores/core/types.ts`
**型別定義：**
```typescript
interface StoreState<T> {
  items: T[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<T[]>
  create: (data: any) => Promise<T>
  update: (id: string, data: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
}

interface StoreConfig {
  tableName: TableName
  codePrefix?: string
  enableSupabase?: boolean
  fastInsert?: boolean
}
```

---

## UI 組件

### 1. `/src/components/tours/tour-members.tsx` (555 行)
**最複雜的旅客管理組件**

```typescript
interface TourMembersProps {
  tour: Tour
  orderFilter?: string  // 特定訂單篩選
}
```

**功能：**
- 跨訂單整合旅客表格
- 行內編輯 (點擊編輯)
- 拖拽排序 (GripVertical圖示)
- 實時統計 (完成率、人數)
- 按訂單色調區分

**主要邏輯：**
```typescript
// 1. 取得該旅遊團的所有訂單
const tourOrders = orders.filter(o => o.tour_id === tour.id)

// 2. 取得這些訂單的所有旅客
const tourMembers = members.filter(m =>
  tourOrders.some(o => o.id === m.order_id)
)

// 3. 統計
const totalMembers = tourMembers.length
const completedMembers = tourMembers.filter(m => m.name && m.idNumber).length
const rate = (completedMembers / totalMembers) * 100
```

**支援的編輯欄位：**
```
序號 | 姓名 | 英文姓名 | 生日 | 年齡(只讀) | 性別(只讀) |
身分證 | 護照號 | 護照效期 | 所屬訂單 | 聯絡人 | 分房 | 刪除
```

### 2. `/src/components/tours/room-allocation.tsx` (331 行)
**分房管理專用組件**

```typescript
interface RoomAllocationProps {
  tour: Tour
}
```

**核心功能：**

1. **房間配額解析** (generateRoomOptions)
   - 從 PaymentRequest 提取房型
   - 正則表達式解析 "雙人房 x5, 三人房 x2"
   - 生成房間選項

2. **容量管理**
   - 根據房型推算容量 (單1, 雙2, 三3, 四4)
   - 分配時檢查是否超滿
   - 超滿自動禁用下拉選項

3. **視覺化展示**
   - 配額總覽 (4個統計卡)
   - 分房表格 (6欄位)
   - 房間使用狀況網格 (入住者名單)

**房間配額來源：**
```typescript
const tourPaymentRequests = paymentRequests.filter(
  req => req.tour_id === tour.id
)
// 提取其中 category === '住宿' 的項目
// 從 description 提取房型和數量
```

### 3. `/src/components/members/excel-member-table.tsx` (182 行)
**Excel 風格的訂單成員編輯表**

```typescript
interface MemberTableProps {
  order_id: string
  departure_date: string
  member_count: number  // 應填人數
}
```

**功能：**
- ReactDataSheet 式編輯
- Tab 鍵導航、複製貼上
- 自動儲存 (無需按鈕)
- 自動計算年齡、性別
- 自動補充至 member_count 行

**支援的編輯欄位：**
```
序號 | 姓名 | 英文姓名 | 生日 | 年齡(只讀) | 性別(只讀) |
身分證 | 護照號 | 護照效期 | 訂位代號
```

**自動計算邏輯：**
```typescript
if (id_number) {
  gender = getGenderFromIdNumber(id_number)
  age = calculateAge(id_number, departureDate)
} else if (birthday) {
  age = calculateAge(birthday, departureDate)
}
```

---

## 服務層 (Service)

### 1. `/src/features/orders/services/order.service.ts` (72 行)
**訂單業務邏輯層**

```typescript
class OrderService extends BaseService<Order> {
  protected resourceName = 'orders'
  
  // 業務方法
  getOrdersByTour(tour_id: string): Order[]
  getOrdersByStatus(status: string): Order[]
  getOrdersByCustomer(customer_id: string): Order[]
  calculateTotalRevenue(): number
  getPendingOrders(): Order[]
}
```

### 2. `/src/services/workspace-members.ts`
**工作區成員服務**
- 負責頻道成員管理 (非旅客)
- 與旅客管理分開

---

## 資料庫層

### 1. `/supabase-migration.sql` (200+ 行)
**Supabase 資料庫定義**

```sql
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  -- ... 18 個欄位定義
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_order_id ON members(order_id);
CREATE INDEX idx_members_tour_id ON members(tour_id);
CREATE INDEX idx_members_id_number ON members(id_number);
```

**重點：**
- orders 和 tours 都有 CASCADE DELETE
- 雙重索引優化查詢 (order_id + tour_id)
- 自動時間戳記

---

## 輔助功能

### 1. `/src/lib/utils`
**工具函式**

```typescript
// 性別推導 (身分證第2位)
getGenderFromIdNumber(idNumber: string): 'M' | 'F'

// 年齡計算 (根據生日或身分證)
calculateAge(
  dateOrIdNumber: string, 
  referenceDate?: string, 
  returnDate?: string
): number
```

### 2. `/src/lib/excel/` (如有)
**Excel 匯出模組** (目前有 payment-request-excel.ts, receipt-excel.ts)

**建議擴展：**
```typescript
exportMembersToExcel(
  members: Member[],
  orders: Order[],
  tour: Tour
): Promise<void>
```

---

## 相關表格結構

### orders 表
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,           -- 訂單編號
  order_number VARCHAR(50),          -- 訂單號
  tour_id UUID NOT NULL,             -- 旅遊團FK
  customer_id UUID,                  -- 客戶FK (可選)
  contact_person VARCHAR(100),       -- 聯絡人
  member_count INTEGER,              -- 成員人數
  payment_status VARCHAR(20),        -- 付款狀態
  total_amount NUMERIC,              -- 總金額
  created_at TIMESTAMPTZ
)
```

### tours 表
```sql
CREATE TABLE tours (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,           -- 團號
  name VARCHAR(255),                 -- 團體名稱
  departure_date DATE,               -- 出發日期
  return_date DATE,                  -- 返回日期
  max_participants INTEGER,          -- 最多人數
  current_participants INTEGER,      -- 當前人數
  created_at TIMESTAMPTZ
)
```

### customers 表
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE,           -- 客戶編號
  name VARCHAR(100),                 -- 客戶名稱
  company VARCHAR(255),              -- 公司名稱
  tax_id VARCHAR(50),                -- 統編
  is_vip BOOLEAN,                    -- VIP標記
  vip_level VARCHAR(20),             -- VIP等級
  created_at TIMESTAMPTZ
)
```

---

## 檔案用途對應表

| 檔案 | 行數 | 用途 | 複雜度 |
|-----|------|------|--------|
| order.types.ts | 261 | 核心型別定義 | 低 |
| customer.types.ts | 180 | 客戶型別 | 低 |
| tour-members.tsx | 555 | 整團管理UI | 高 |
| room-allocation.tsx | 331 | 分房管理UI | 中 |
| excel-member-table.tsx | 182 | Excel編輯 | 中 |
| create-store.ts | 250+ | Store工廠 | 高 |
| order.service.ts | 72 | 業務邏輯 | 低 |
| supabase-migration.sql | 200+ | DB定義 | 中 |

---

## 使用流程圖

```
1. 建立旅遊團 (Tour)
   ↓
2. 建立訂單 (Order) - 可多個
   ├─ order_id FK → orders.id
   └─ tour_id FK → tours.id
   ↓
3. 新增旅客 (Member)
   ├─ order_id FK → orders.id
   ├─ tour_id FK → tours.id
   └─ 編輯操作
      ├─ ExcelMemberTable (訂單級)
      └─ TourMembers (團體級)
   ↓
4. 分房 (Room Allocation)
   ├─ 從 PaymentRequest 解析房型
   └─ 設定 Member.assigned_room
   ↓
5. 匯出 (未實作)
   └─ 旅客名單、飯店確認單等
```

---

## 總結

**核心檔案數量：**
- 型別定義: 4 個
- Store 相關: 3 個
- UI 組件: 3 個
- 服務層: 2 個
- 資料庫: 1 個

**總代碼行數：** ~2500 行

**關鍵設計模式：**
1. 工廠函數 (createStore)
2. 狀態管理 (Zustand)
3. 同步協調 (SyncCoordinator)
4. 快取層 (IndexedDB)
5. 自動計算 (年齡、性別)

