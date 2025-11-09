# 旅客管理 - 快速參考卡片

## 核心資料結構

### Member (旅客)
```typescript
{
  id: UUID,                    // 唯一標識
  order_id: UUID,              // 所屬訂單 (必填)
  tour_id: UUID,               // 所屬旅遊團 (必填)
  name: string,                // 姓名 (中文)
  name_en: string,             // 英文姓名
  birthday: "YYYY-MM-DD",      // 生日
  passport_number: string,     // 護照號碼
  passport_expiry: "YYYY-MM-DD", // 護照效期
  id_number: string,           // 身分證號
  gender: 'M'|'F'|'',          // 性別
  assigned_room: string,       // 分配房間 (分房用)
  dietary_restrictions: string, // 飲食限制
  medical_conditions: string,  // 醫療狀況
  emergency_contact: string,   // 緊急聯絡人
  emergency_phone: string,     // 緊急電話
}
```

## 常見操作

### 1. 新增旅客
```typescript
const memberStore = useMemberStore()
const newMember = await memberStore.create({
  order_id: "order-uuid",
  tour_id: "tour-uuid",
  name: "王小明",
  name_en: "WANG/XIAOMING",
  birthday: "1990-01-15",
  id_number: "A123456789",
  gender: "M",
  passport_number: "12345678",
  passport_expiry: "2030-12-31"
})
```

### 2. 更新旅客
```typescript
await memberStore.update(memberId, {
  assigned_room: "雙人房-1",
  dietary_restrictions: "素食",
  medical_conditions: "無"
})
```

### 3. 刪除旅客
```typescript
await memberStore.delete(memberId)
```

### 4. 查詢旅客
```typescript
// 獲取所有旅客
const members = memberStore.items

// 某訂單的旅客
const orderMembers = members.filter(m => m.order_id === orderId)

// 某旅遊團的旅客
const tourMembers = members.filter(m => m.tour_id === tourId)
```

## UI 組件使用

### TourMembers (整團旅客管理)
```typescript
import { TourMembers } from '@/components/tours/tour-members'

// 基本用法
<TourMembers tour={tour} />

// 特定訂單
<TourMembers tour={tour} orderFilter={orderId} />
```

**功能：**
- 跨訂單查看所有旅客
- 行編輯、拖拽排序
- 實時統計完成率
- 按訂單色調區分

### ExcelMemberTable (訂單成員編輯)
```typescript
import { ExcelMemberTable } from '@/components/members/excel-member-table'

const tableRef = useRef<MemberTableRef>(null)

<ExcelMemberTable 
  order_id={orderId}
  departure_date={tour.departure_date}
  member_count={order.member_count}
  ref={tableRef}
/>

// 新增行
tableRef.current?.addRow()
```

**功能：**
- Excel式編輯
- Tab鍵導航、複製貼上
- 自動計算年齡、性別
- 自動儲存

### RoomAllocation (分房管理)
```typescript
import { RoomAllocation } from '@/components/tours/room-allocation'

<RoomAllocation tour={tour} />
```

**功能：**
- 從請款單自動解析房型
- 容量管理、防止超滿
- 視覺化房間使用狀況
- 即時統計

## 自動計算邏輯

### 性別推導
```typescript
import { getGenderFromIdNumber } from '@/lib/utils'
const gender = getGenderFromIdNumber("A123456789")
// 身分證第2位奇數→男, 偶數→女
```

### 年齡計算
```typescript
import { calculateAge } from '@/lib/utils'
const age = calculateAge(birthday, departureDate, returnDate)
// 根據出發日期計算當時年齡
```

## 資料驗證

### Member 必填欄位
- order_id (訂單ID)
- tour_id (旅遊團ID)
- name (姓名)
- birthday (生日)
- id_number 或 passport_number (至少一個)

### 日期格式
所有日期必須是 `YYYY-MM-DD` 格式

### 性別格式
只接受 'M'、'F' 或空字串

## 分房配額設定

房間配額來自 **PaymentRequest** (請款單)：

```
描述: "雙人房 x5, 三人房 x2, 單人房 x1"
↓
自動解析為:
- 雙人房-1, 雙人房-2, 雙人房-3, 雙人房-4, 雙人房-5
- 三人房-1, 三人房-2
- 單人房-1
```

## 統計欄位

```typescript
// TourMembers 中提供
- totalMembers: 總成員數
- completedMembers: 已完成資料的成員數
- completionRate: 完成率百分比

// RoomAllocation 中提供
- totalRooms: 總房間數
- totalCapacity: 總床位數
- assignedCount: 已分房人數
- unassignedCount: 未分房人數
```

## 常見問題

### Q: 如何支援房間偏好?
```typescript
// Member 中已有欄位
room_preference: "靠窗" | "低樓層" | "避免靠電梯" 等
```

### Q: 小孩如何處理?
```typescript
// 小孩不佔床
member.is_child_no_bed = true

// 年齡分類
member.age < 12 ? "兒童" : "成人"
```

### Q: 同房者如何設定?
```typescript
// 目前未實作 room_mate_id，可按需擴展
member.room_mate_id = "other-member-id"
```

### Q: 加購項目如何處理?
```typescript
// Member 中有陣列欄位
member.add_ons = ["travel_insurance", "airport_transfer"]
member.refunds = ["activity_xyz"]
```

## 相關檔案

| 路徑 | 用途 |
|-----|------|
| `/src/types/order.types.ts` | Member、Order 型別定義 |
| `/src/types/customer.types.ts` | Customer 型別定義 |
| `/src/components/tours/tour-members.tsx` | 整團管理組件 |
| `/src/components/tours/room-allocation.tsx` | 分房管理組件 |
| `/src/components/members/excel-member-table.tsx` | Excel編輯表格 |
| `/src/stores/index.ts` | useMemberStore 初始化 |
| `/src/stores/core/create-store.ts` | Store 工廠函數 |

## 效能提示

1. 超過 100 人時使用 React.memo 優化
2. 複雜篩選用 useMemo 快取結果
3. 大量編輯時分批儲存（已自動化）
4. 虛擬化列表（超過 200 行）

## 擴展建議

1. **批量匯入** - Excel/CSV 導入功能
2. **簽證管理** - 集成簽證狀態追蹤
3. **實時協作** - Realtime 訂閱多人同編
4. **報表匯出** - 旅客花名冊、飯店確認單
5. **座位管理** - 飛機座位分配

