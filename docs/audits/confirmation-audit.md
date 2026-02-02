# 團體確認單模組審計報告

> 審計日期：2025-02-01
> 審計範圍：`src/features/tour-confirmation/`, `src/features/tours/components/TourConfirmation*`

---

## 📋 審計摘要

| 項目 | 狀態 | 風險等級 |
|------|------|----------|
| 確認單生成流程 | ✅ 正常 | - |
| 確認交接按鈕 | ⚠️ 部分完成 | 中 |
| 資料驗證 | ⚠️ 不完整 | 高 |
| 鎖定機制 | ❌ 薄弱 | 高 |
| 文件流程一致性 | ⚠️ 部分缺失 | 低 |

---

## 1. 確認單生成流程 ✅

### 實作位置
- `src/features/tour-confirmation/hooks/useTourConfirmationSheet.ts`
- `src/features/tour-confirmation/components/TourConfirmationSheetPage.tsx`

### 運作方式
```typescript
// 自動建立確認表（如果不存在）
useEffect(() => {
  if (!loading && !sheet && tour && workspaceId) {
    createSheet({...})
  }
}, [loading, sheet, tour, workspaceId, createSheet])
```

### 結論
- ✅ 進入確認單頁面時自動建立
- ✅ 支援從行程表/需求單帶入資料
- ✅ 有分類管理（交通、餐食、住宿、活動、其他）

---

## 2. 確認交接按鈕 ⚠️

### 實作位置
- `src/features/tour-confirmation/components/TourConfirmationSheetPage.tsx` (line 732-775)

### 當前邏輯
```typescript
const handleHandoff = async () => {
  // 1. 檢查未完成需求單
  if (incompleteRequests.length > 0) return
  
  // 2. 檢查領隊（只有 warning，可跳過）
  if (!hasLeader) {
    const proceed = window.confirm('⚠️ 尚未設定領隊...')
    if (!proceed) return
  }
  
  // 3. 更新確認表狀態
  await supabase.from('tour_confirmation_sheets')
    .update({ status: 'completed' })
  
  // 4. 同步到 Online
  await syncTripToOnline(tour.id)
}
```

### ⚠️ 發現的問題

#### 問題 2.1: 未驗證確認單項目是否存在
```typescript
// 當前：沒有檢查
// 應該要有：
if (items.length === 0) {
  alert('確認單尚無任何項目，無法交接')
  return
}
```
**風險**：可能交接空白確認單到 Online

#### 問題 2.2: 未檢查最低必要項目
建議至少檢查：
- 交通（去程/回程）
- 住宿（至少一晚）
- 行程表是否存在

#### 問題 2.3: 未更新 Tour 狀態
交接後應該也更新 `tours.status` 為某個已交接狀態，以便其他地方判斷

---

## 3. 資料驗證 ⚠️

### 當前驗證項目
| 項目 | 驗證方式 | 狀態 |
|------|----------|------|
| 需求單完成 | `tour_requests.status !== 'confirmed'` | ✅ 阻擋 |
| 領隊設定 | `sheet?.tour_leader_name` | ⚠️ 只警告 |
| 行程表存在 | 無 | ❌ 缺失 |
| 確認單項目 | 無 | ❌ 缺失 |
| 團員名單 | 無 | ❌ 缺失 |

### 建議新增的驗證
```typescript
const validateBeforeHandoff = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // 1. 確認單必須有項目
  if (items.length === 0) {
    errors.push('確認單尚無任何項目')
  }
  
  // 2. 必須有行程表
  if (!itinerary) {
    errors.push('尚未建立行程表')
  }
  
  // 3. 應該有交通安排
  if (groupedItems.transport.length === 0) {
    errors.push('尚未安排交通')
  }
  
  // 4. 應該有住宿安排（除非是當日來回）
  const tripDays = /* calculate */
  if (tripDays > 1 && groupedItems.accommodation.length === 0) {
    errors.push('多日行程但尚未安排住宿')
  }
  
  return { valid: errors.length === 0, errors }
}
```

---

## 4. 鎖定機制 ❌ 高風險

### 當前實作

#### 前端鎖定（行程編輯頁）
位置：`src/app/(main)/itinerary/new/page.tsx`
```tsx
{isHandedOff && (
  <div className="bg-amber-50 border border-amber-200 ...">
    <p>此行程已交接給領隊</p>
  </div>
)}

<div className={isHandedOff ? 'pointer-events-none opacity-60' : ''}>
  {/* 編輯區域 */}
</div>
```

#### 問題 4.1: 前端鎖定可被繞過
- 只用 CSS `pointer-events-none` 禁用
- 可透過 DevTools 移除 class
- 可直接呼叫 API

#### 問題 4.2: 無後端驗證
- API routes 沒有檢查交接狀態
- 沒有 RLS (Row Level Security) 保護
- 直接 Supabase 操作不受限制

#### 問題 4.3: 確認單本身無鎖定
- 交接後 `tour_confirmation_sheets` 只設 `status: 'completed'`
- 但沒有任何地方檢查此狀態來阻止修改

### 🔴 建議修復

#### 方案 A: API 層級保護
```typescript
// src/app/api/itineraries/[id]/route.ts
export async function PATCH(request: NextRequest, { params }) {
  // 檢查是否已交接
  const { data: sheet } = await supabase
    .from('tour_confirmation_sheets')
    .select('status')
    .eq('tour_id', itinerary.tour_id)
    .eq('status', 'completed')
    .maybeSingle()
  
  if (sheet) {
    return errorResponse('此行程已交接，無法修改', 403)
  }
  // ...繼續處理
}
```

#### 方案 B: RLS 保護（更強）
```sql
-- 行程表 RLS
CREATE POLICY "itineraries_update_check_handoff"
ON itineraries
FOR UPDATE
USING (
  NOT EXISTS (
    SELECT 1 FROM tour_confirmation_sheets
    WHERE tour_id = itineraries.tour_id
    AND status = 'completed'
  )
);
```

---

## 5. 文件流程一致性 ⚠️

### 參考文件
`docs/ITINERARY_LIFECYCLE.md`

### 比對結果

| 文件描述 | 實作狀態 |
|----------|----------|
| 確認交接時複製到 Online | ✅ `syncTripToOnline()` |
| itinerary 開團後鎖定 | ⚠️ 前端有，後端無 |
| brochure_settings（手冊隱藏景點）| ❌ 未實作 |
| trips 表設計 | ✅ 改用 `online_trips` |

### 缺失功能
文件提到：
> 手冊隱藏：設定存在 brochure_settings，不影響原始資料

但搜尋整個 codebase 沒有找到 `brochure_settings` 的實作。

---

## 6. syncToOnline 服務審查

### 位置
`src/features/tour-confirmation/services/syncToOnline.ts`

### 功能 ✅
1. 同步 tour + itinerary 到 `online_trips`
2. 建立行程群組聊天室
3. 同步團員（含分車分房資料）

### ⚠️ 潛在問題

#### 問題 6.1: 錯誤處理不完整
```typescript
// 同步團員失敗只有 logger.error，沒有回傳錯誤
if (insertError) {
  logger.error('同步團員失敗:', insertError)
  // 但沒有 throw 或回傳失敗
}
```
結果：交接顯示成功，但團員實際沒同步

#### 問題 6.2: 無事務處理
- 多個表的操作沒有 transaction
- 若中途失敗，資料可能不一致

---

## 📝 修復優先順序

### 🔴 P0 - 立即修復
1. **後端鎖定機制** - 防止已交接資料被修改
2. **交接前驗證** - 確保不會交接空白/不完整的確認單

### 🟡 P1 - 短期改善
3. **syncToOnline 錯誤處理** - 確保資料一致性
4. **更新 Tour 狀態** - 交接後標記 tour 已交接

### 🟢 P2 - 長期優化
5. **brochure_settings** - 實作手冊隱藏景點功能
6. **事務處理** - 確保同步操作的原子性

---

## 附錄：相關檔案清單

```
src/features/tour-confirmation/
├── components/
│   ├── TourConfirmationSheetPage.tsx  # 主頁面
│   └── ItemEditDialog.tsx             # 項目編輯對話框
├── hooks/
│   └── useTourConfirmationSheet.ts    # 資料管理 hook
├── services/
│   └── syncToOnline.ts                # 同步到 Online
└── index.ts

src/features/tours/components/
├── TourConfirmationWizard.tsx         # 版本鎖定精靈（不同功能）
└── TourConfirmationDialog.tsx         # 對話框包裝

src/types/
├── tour-confirmation-sheet.types.ts   # 類型定義
└── tour.types.ts                      # Tour 類型（含 locked_* 欄位）

src/app/api/tours/[id]/unlock/route.ts # 解鎖 API
```
