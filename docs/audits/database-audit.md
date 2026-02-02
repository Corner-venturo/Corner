# Database 管理模組審計報告

**審計日期**: 2026-02-02
**審計範圍**: `/src/app/(main)/database/` 下的四個子模組
**審計人員**: Claude (Subagent)

---

## 📋 審計總覽

| 模組 | CRUD | 搜尋篩選 | 批量操作 | 資料驗證 | 刪除保護 | 整體評分 |
|------|:----:|:--------:|:--------:|:--------:|:--------:|:--------:|
| Attractions | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | B |
| Suppliers | ✅ | ✅ | ❌ | ⚠️ | ❌ | C |
| Fleet | ✅ | ✅ | ❌ | ⚠️ | ❌ | C |
| Tour Leaders | ✅ | ✅ | ❌ | ⚠️ | ❌ | C |

**評分說明**: A=優秀, B=良好, C=待改進, D=嚴重缺陷

---

## 1. 🏔️ Attractions 景點資料

**位置**: `src/features/attractions/`

### ✅ 優點
- 完整的 CRUD 操作（使用 SWR 架構）
- 支援多維度搜尋（名稱、分類、國家）
- 拖曳排序功能
- 按名稱一鍵排序
- AI 補充景點資料功能（僅限 TP/TC workspace）
- 圖片上傳與拖曳支援
- 列表/排序雙模式切換

### ⚠️ 待改進
1. **資料驗證不足**
   - 僅驗證 `name` 和 `country_id` 必填
   - 缺少座標格式驗證（latitude/longitude）
   - 缺少 URL 格式驗證（website）
   - 缺少電話格式驗證

2. **批量操作有限**
   - ✅ 有批量排序
   - ❌ 無批量刪除
   - ❌ 無批量狀態切換
   - ❌ 無匯出功能

### ❌ 缺失功能
1. **刪除保護**
   - 景點可能被行程（itineraries）引用
   - 刪除前未檢查關聯
   - 建議：檢查 `itinerary_days` 表中的 attractions 欄位

---

## 2. 🏢 Suppliers 供應商

**位置**: `src/features/suppliers/`

### ✅ 優點
- 基本 CRUD 功能完整
- 搜尋支援名稱、銀行資訊
- EnhancedTable 提供排序功能

### ⚠️ 待改進
1. **表單驗證問題**
   ```tsx
   // 目前的驗證邏輯
   submitDisabled={!formData.name || !formData.bank_name || !formData.bank_account}
   ```
   - **問題**：銀行資訊不應該是必填欄位
   - 很多供應商可能暫時沒有銀行資訊

2. **Dialog 標題問題**
   - 編輯模式下標題仍顯示「新增供應商」
   - 應根據 `isEditMode` 動態切換

3. **欄位過於簡化**
   - `SuppliersDialog` 只有 4 個欄位
   - 但 `Supplier` 類型有更多欄位（type, contact_person, tax_id 等）

### ❌ 缺失功能
1. **刪除保護**
   - 供應商可能被以下表引用：
     - `cost_templates`（成本模板）
     - `payment_requests`（請款單）
     - `disbursement_orders`（付款單）
   - 刪除前未檢查這些關聯

2. **批量操作**
   - 無批量刪除
   - 無批量啟用/停用
   - 無匯出功能

3. **篩選功能**
   - 無類型篩選（hotel, restaurant, transport 等）
   - 無狀態篩選

---

## 3. 🚌 Fleet 車隊

**位置**: `src/features/fleet/`

### ✅ 優點
- 車輛和司機分開管理（Tabs）
- 完整的車輛資訊（車型、規格、日期提醒）
- 完整的司機資訊（駕照、體檢）
- 搜尋支援車牌、司機、品牌
- 車型變更時自動更新座位數

### ⚠️ 待改進
1. **資料驗證不足**
   - 車輛：僅驗證 `license_plate`
   - 司機：僅驗證 `name`
   - 缺少日期邏輯驗證（驗車到期日 > 今天？）
   - 缺少車牌格式驗證

2. **維護記錄功能未完成**
   ```tsx
   <TabsContent value="logs">
     <div>維護記錄功能開發中...</div>
   </TabsContent>
   ```

3. **到期提醒缺失**
   - 類型定義有 `FleetReminder`，但 UI 未實現
   - 應該顯示即將到期的：
     - 驗車
     - 保險
     - 駕照
     - 體檢

### ❌ 缺失功能
1. **刪除保護**
   - 車輛：資料庫使用 `ON DELETE CASCADE`
     - 刪除車輛會連帶刪除 `fleet_schedules`（排班記錄）
     - 應改為：檢查是否有未完成的排班，有則阻止刪除
   - 司機：可能有排班關聯但未檢查

2. **批量操作**
   - 無批量狀態更新
   - 無批量刪除

3. **司機與車輛關聯**
   - `FleetVehicle.default_driver_id` 存在但未在 UI 中設置
   - 應在車輛表單中可選擇預設司機

---

## 4. 👤 Tour Leaders 領隊

**位置**: `src/features/tour-leaders/`

### ✅ 優點
- 完整的 CRUD 功能
- 檔期管理對話框（LeaderAvailabilityDialog）
- 搜尋支援姓名、電話、編號
- 語言和專長以 Badge 顯示

### ⚠️ 待改進
1. **資料驗證不足**
   - 僅驗證 `name` 必填
   - 缺少身分證格式驗證
   - 缺少護照效期邏輯驗證
   - 缺少電話/Email 格式驗證

2. **護照到期提醒缺失**
   - 領隊護照即將到期時應有提醒
   - 建議在列表中以顏色標示

### ❌ 缺失功能
1. **刪除保護**
   - 領隊可能被以下表引用：
     - `leader_schedules`（使用 `ON DELETE CASCADE`）
     - `tours.tour_leader_id`
   - 刪除前未檢查是否有進行中/未來的排班

2. **批量操作**
   - 無批量刪除
   - 無批量狀態更新

---

## 🔴 Critical Issues

### 1. 刪除保護完全缺失
**影響範圍**: 所有模組
**嚴重程度**: 🔴 Critical

所有模組的刪除操作都只是簡單的 `confirm` + `delete`，沒有檢查：
- 是否有關聯的業務資料
- 是否有進行中的排班
- 是否有未結清的財務記錄

**建議修復方案**:
```typescript
// 在 data layer 加入關聯檢查
async function deleteWithCheck(id: string, table: string): Promise<{ 
  canDelete: boolean
  blockers?: { table: string; count: number }[] 
}> {
  // 檢查各相關表的引用
  const blockers = await checkReferences(id, REFERENCE_MAP[table])
  if (blockers.length > 0) {
    return { canDelete: false, blockers }
  }
  return { canDelete: true }
}
```

### 2. Cascade Delete 風險
**影響範圍**: Fleet, Tour Leaders
**嚴重程度**: 🔴 Critical

資料庫使用 `ON DELETE CASCADE`：
- `fleet_schedules` → 刪除車輛會刪除所有排班
- `leader_schedules` → 刪除領隊會刪除所有排班

**建議**:
- 改為 `ON DELETE RESTRICT` 或 `SET NULL`
- 或在應用層阻止有排班的刪除

---

## 🟡 High Priority Issues

### 1. 表單驗證不完整
**影響範圍**: 所有模組
**建議**: 使用 zod 或 yup 實現完整的表單驗證

```typescript
// 範例：領隊表單驗證
const tourLeaderSchema = z.object({
  name: z.string().min(1, '姓名必填'),
  phone: z.string().regex(/^09\d{8}$/, '電話格式錯誤').optional(),
  email: z.string().email('Email 格式錯誤').optional(),
  national_id: z.string().regex(/^[A-Z][12]\d{8}$/, '身分證格式錯誤').optional(),
  passport_expiry: z.string().refine(
    date => new Date(date) > new Date(),
    '護照已過期'
  ).optional(),
})
```

### 2. Suppliers Dialog 標題錯誤
**檔案**: `src/features/suppliers/components/SuppliersDialog.tsx`
**問題**: 標題固定為「新增供應商」

```tsx
// 修改前
title="新增供應商"

// 修改後
title={isEditMode ? "編輯供應商" : "新增供應商"}
```

### 3. Suppliers 必填欄位過多
**檔案**: `src/features/suppliers/components/SuppliersDialog.tsx`
**問題**: `bank_name` 和 `bank_account` 不應該是必填

---

## 🟢 Medium Priority Issues

### 1. 缺少批量操作
所有模組都缺少：
- 批量刪除（checkbox + 刪除按鈕）
- 批量狀態更新
- 匯出功能（CSV/Excel）

### 2. Fleet 維護記錄未實現
`FleetPage.tsx` 的「維護記錄」Tab 顯示開發中

### 3. 篩選功能有限
建議新增：
- 狀態篩選（下拉選單）
- 日期範圍篩選（護照到期、驗車到期等）

---

## 📝 建議優先修復順序

1. **P0 - 本週**
   - [ ] 加入刪除前關聯檢查（所有模組）
   - [ ] 修改資料庫 CASCADE 為 RESTRICT
   - [ ] 修復 Suppliers Dialog 標題

2. **P1 - 本月**
   - [ ] 實現表單驗證（使用 zod）
   - [ ] 移除 Suppliers 銀行必填限制
   - [ ] 完成 Fleet 維護記錄功能

3. **P2 - 下月**
   - [ ] 批量操作功能
   - [ ] 匯出功能
   - [ ] 到期提醒功能

---

## 📎 附錄：資料庫關聯圖

```
attractions
└── itinerary_days.attractions (JSONB 引用)

suppliers
├── cost_templates.supplier_id
├── payment_requests.supplier_id
└── disbursement_orders.supplier_id

fleet_vehicles
├── fleet_schedules.vehicle_id (CASCADE)
└── fleet_drivers.default_vehicle_id

fleet_drivers
└── fleet_schedules.driver_id

tour_leaders
├── leader_schedules.leader_id (CASCADE)
└── tours.tour_leader_id
```

---

*報告結束*
