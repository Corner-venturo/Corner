# 供應商模組審計報告

> 審計日期：2025-01-14
> 審計範圍：供應商資料管理、供應商 Portal、需求發送流程

## 📋 模組概覽

### 檔案結構
```
src/
├── app/(main)/
│   ├── database/suppliers/page.tsx      # 供應商資料庫入口
│   └── supplier/                         # 供應商 Portal
│       ├── requests/page.tsx             # 需求收件匣
│       ├── dispatch/page.tsx             # 派單管理
│       └── finance/page.tsx              # 財務報表
├── features/
│   ├── suppliers/                        # 旅行社端供應商管理
│   │   └── components/
│   │       ├── SuppliersPage.tsx         # 供應商列表頁
│   │       ├── SuppliersList.tsx         # 供應商表格
│   │       └── SuppliersDialog.tsx       # 新增/編輯對話框
│   └── supplier/                         # 供應商 Portal 功能
│       ├── components/
│       │   ├── SupplierRequestsPage.tsx  # 需求收件匣頁面
│       │   ├── SupplierDispatchPage.tsx  # 派單管理頁面
│       │   ├── SupplierFinancePage.tsx   # 財務報表頁面
│       │   └── SupplierResponseDialog.tsx # 回覆需求對話框
│       └── hooks/
│           └── useSupplierRequests.ts    # 查詢供應商收到的需求
├── hooks/
│   └── useSupplierWorkspaces.ts          # 取得供應商 Workspace 列表
└── types/
    └── supplier.types.ts                 # 供應商類型定義
```

### Workspace 類型
- `travel_agency` — 旅行社（發送需求方）
- `vehicle_supplier` — 車行（供應商）
- `guide_supplier` — 領隊公司（供應商）

---

## 🔴 嚴重問題

### 1. 資料庫回覆表格不一致
**位置**: `SupplierResponseDialog.tsx`, `SupplierFinancePage.tsx`

**問題**: 程式碼中同時使用兩種回覆表格：
- `request_responses` / `request_response_items`（SupplierResponseDialog）
- `supplier_request_responses`（SupplierFinancePage）

這造成資料不一致，財務報表可能無法正確取得回覆資料。

```typescript
// SupplierResponseDialog.tsx L154
const { data: responseData } = await supabase
  .from('request_responses')  // ← 使用這個
  .insert({...})

// SupplierFinancePage.tsx L90
const { data: responsesData } = await supabase
  .from('supplier_request_responses')  // ← 使用這個
  .select(...)
```

**建議**:
- 統一使用 `request_responses` + `request_response_items` 表格
- 刪除或棄用 `supplier_request_responses` 表
- 更新 SupplierFinancePage 的查詢邏輯

---

### 2. 派單管理直接寫入 `reply_content` JSON 欄位
**位置**: `SupplierDispatchPage.tsx` L130-144

**問題**: 派單資訊（司機 ID、名稱）直接存入 `tour_requests.reply_content` JSON 欄位，缺乏結構化驗證：

```typescript
reply_content: {
  ...existingContent,
  driver_id: selectedDriverId,
  driver_name: driver?.name || '',
  dispatch_status: 'assigned',
  assigned_at: new Date().toISOString(),
}
```

**風險**:
- JSON 欄位無型別檢查
- 歷史變更無法追蹤
- 與 `assigned_vehicle_id`、`assignee_name` 欄位重複

**建議**:
- 考慮建立獨立的 `dispatch_assignments` 表
- 或只使用 `assigned_vehicle_id` 和 `assignee_name` 欄位
- 移除 `reply_content` 中的重複資料

---

### 3. 財務報表查詢缺少付款狀態
**位置**: `SupplierFinancePage.tsx` L92-102

**問題**: 程式碼中有 TODO 註解，付款狀態欄位尚未實作：

```typescript
// 計算統計
let totalRevenue = 0
const pendingPayment = 0 // TODO: 需要新增 payment_status 欄位
const completedPayment = 0
```

**影響**:
- 「待請款」和「已收款」數字永遠為 0
- 收款率永遠顯示 0%

**建議**:
- 在 `request_responses` 表新增 `payment_status` 欄位
- 或建立 `supplier_payments` 關聯表追蹤付款狀態

---

## 🟡 中度問題

### 4. 供應商對話框標題固定為「新增供應商」
**位置**: `SuppliersDialog.tsx` L34

**問題**: 無論新增或編輯，標題都是「新增供應商」：

```tsx
<FormDialog
  title="新增供應商"  // ← 編輯時應顯示「編輯供應商」
  subtitle="請填寫供應商基本資訊"
```

**建議**:
```tsx
title={isEditMode ? '編輯供應商' : '新增供應商'}
```

---

### 5. 供應商類型欄位不同步
**位置**: `SuppliersPage.tsx` vs `SuppliersList.tsx`

**問題**:
- `SuppliersPage.tsx` 新增時固定使用 `type: 'other'`
- `SuppliersList.tsx` 顯示的類型列表包含更多選項
- 對話框中沒有類型選擇器

**建議**:
- 在 `SuppliersDialog.tsx` 新增供應商類型選擇器
- 或從對話框中移除類型顯示（保持簡化）

---

### 6. 需求收件匣的回覆狀態配置不完整
**位置**: `SupplierRequestsPage.tsx` L28-53

**問題**: `RESPONSE_STATUS_CONFIG` 包含 6 種狀態，但篩選 Tabs 只有 5 種：

```typescript
// Config 有 6 種
const RESPONSE_STATUS_CONFIG = {
  pending, responded, quoted, accepted, rejected, need_info
}

// Tabs 只有 5 種（缺少 responded 和 need_info）
{[
  { value: 'all', ... },
  { value: 'pending', ... },
  { value: 'quoted', ... },
  { value: 'accepted', ... },
  { value: 'rejected', ... },
]}
```

**建議**: 統一狀態配置和篩選選項

---

### 7. 派單管理使用已棄用的 EnhancedTable 傳參方式
**位置**: `SupplierDispatchPage.tsx` L238

**問題**: 使用 `isLoading` 而非標準的 `loading`：

```tsx
<EnhancedTable
  data={filteredRequests}
  columns={columns}
  isLoading={isLoading}  // ← 可能與其他地方不一致
```

**建議**: 確認 EnhancedTable 的標準 API

---

### 8. 供應商員工表查詢欄位不存在
**位置**: `SupplierDispatchPage.tsx` L80-86

**問題**: 查詢 `supplier_employees` 表，但使用 `supplier_id` 作為過濾條件：

```typescript
const { data: driversData } = await supabase
  .from('supplier_employees')
  .select('id, name, phone, vehicle_plate, vehicle_type, is_active')
  .eq('supplier_id', user.workspace_id)  // ← supplier_id 應該是 workspace_id？
```

**疑慮**: 需確認此表結構和 workspace 關聯方式

---

## 🟢 建議改進

### 9. 需求收件匣缺少分頁
**位置**: `useSupplierRequests.ts`

**現況**: 直接撈取所有需求：
```typescript
.order('created_at', { ascending: false })
// 缺少 .range() 或 .limit()
```

**建議**: 加入分頁支援，避免資料量過大

---

### 10. 跨公司需求發送缺少通知機制
**位置**: `AddManualRequestDialog.tsx`

**現況**: 發送需求後，供應商只能被動查詢收件匣

**建議**:
- 發送需求時觸發 email 通知
- 或使用推播通知提醒供應商

---

### 11. 供應商 Portal 側邊欄可精簡
**位置**: `sidebar.tsx` L103-109

**現況**:
```typescript
const supplierMenuItems: MenuItem[] = [
  { href: '/', label: '首頁', icon: Home },
  { href: '/supplier/requests', label: '需求收件匣', ... },
  { href: '/supplier/dispatch', label: '派單管理', ... },
  { href: '/database/fleet', label: '車隊管理', ... },
  { href: '/supplier/finance', label: '財務報表', ... },
]
```

**建議**:
- 車隊管理只給 `vehicle_supplier` 看（已實作 ✓）
- 可考慮將首頁改為儀表板，顯示待處理需求數量

---

### 12. 供應商回覆 Dialog 的類型判斷可改進
**位置**: `SupplierResponseDialog.tsx` L83-85

**現況**:
```typescript
const isVehicle = request?.category === 'transport'
const resourceTypeLabel = isVehicle ? '車輛' : '領隊'
```

**問題**: 只區分「車輛」和「領隊」，但需求類別還有 hotel、restaurant 等

**建議**: 擴展支援或限制此 Dialog 只用於 transport/guide 類別

---

## 📊 資料流程圖

```
┌─────────────────────────────────────────────────────────────────┐
│                       旅行社端 (travel_agency)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. 建立報價單 → 生成需求項目                                    │
│            ↓                                                     │
│   2. RequirementsList 顯示需求 → 確認變更                         │
│            ↓                                                     │
│   3. AddManualRequestDialog                                      │
│      選擇供應商 Workspace → 建立 tour_requests                    │
│      (recipient_workspace_id = 供應商)                           │
│            ↓                                                     │
└─────────────────────────────────────────────────────────────────┘
            │
            │ tour_requests 表
            ↓
┌─────────────────────────────────────────────────────────────────┐
│              供應商端 (vehicle_supplier / guide_supplier)         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   4. SupplierRequestsPage 顯示收到的需求                          │
│            ↓                                                     │
│   5. SupplierResponseDialog 回覆                                 │
│      → 建立 request_responses + request_response_items           │
│      → 更新 tour_requests.response_status                        │
│            ↓                                                     │
│   6. SupplierDispatchPage 派單給司機                              │
│      → 更新 tour_requests.reply_content / assigned_vehicle_id    │
│            ↓                                                     │
│   7. SupplierFinancePage 查看財務報表                             │
│      ⚠️ 目前查詢 supplier_request_responses（需統一）             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ 已完成的功能

1. **供應商資料庫管理** — 基本 CRUD 完整
2. **供應商 Portal 側邊欄** — 根據 workspace_type 動態顯示
3. **需求收件匣** — 可查看、篩選、回覆需求
4. **派單管理** — 可將確認的需求派給司機
5. **跨公司需求發送** — 可選擇供應商 Workspace 發送需求

---

## 🔧 修復優先順序

| 優先級 | 問題 | 影響 |
|--------|------|------|
| P0 | 回覆表格不一致 | 財務資料錯誤 |
| P0 | 財務報表缺付款狀態 | 報表無意義 |
| P1 | 派單資料存儲方式 | 資料維護困難 |
| P2 | 對話框標題固定 | UX 問題 |
| P2 | 狀態配置不完整 | 篩選功能缺失 |
| P3 | 缺少分頁 | 效能問題 |
| P3 | 缺少通知機制 | 即時性不足 |

---

## 📝 備註

1. 供應商 Portal 是新功能，整體架構合理
2. 跨公司需求系統設計良好，但資料表需統一
3. 建議優先處理財務相關問題，避免金流資料不準確
