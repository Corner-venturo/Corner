# 日曆排程模組審計報告

**審計日期**: 2025-01-27  
**審計範圍**: 
- `/src/app/(main)/calendar/`
- `/src/app/(main)/scheduling/`
- `/src/features/calendar/`
- `/src/features/scheduling/`

---

## 📊 整體評估

| 項目 | 評分 | 說明 |
|------|------|------|
| 功能完整性 | ⭐⭐⭐⭐ | 日曆與排程功能齊全 |
| 程式碼品質 | ⭐⭐⭐⭐ | 架構清晰，Custom Hooks 分離良好 |
| 效能優化 | ⭐⭐⭐ | 有分頁載入，但有優化空間 |
| 使用者體驗 | ⭐⭐⭐⭐ | 拖放、視圖切換流暢 |

---

## 📅 日曆模組 (`/calendar`)

### ✅ 優點

1. **視圖切換完整**
   - 月視圖 (`dayGridMonth`)
   - 週視圖 (`timeGridWeek`)
   - 日視圖 (`timeGridDay`)
   - 使用 FullCalendar 實作，功能成熟

2. **事件類型多樣**
   - 旅遊團行程（從 tours 資料自動生成）
   - 個人事項（僅本人可見）
   - 公司事項（全公司可見）
   - 客戶生日（獨立彈窗顯示）

3. **時區處理**
   ```typescript
   // CalendarGrid.tsx - 明確指定台灣時區
   timeZone="Asia/Taipei"
   ```

4. **Realtime 同步**
   ```typescript
   // useCalendarEvents.ts - 自動同步其他用戶的變更
   supabase.channel('calendar_events_realtime')
     .on('postgres_changes', ...)
   ```

5. **拖放功能**
   - 支援事件拖放重新排程
   - 限制只有 personal 和 company 事件可拖放
   - 拖放失敗時自動還原 (`info.revert()`)

6. **分月載入**
   - 視圖切換時動態調整載入範圍
   - 減少初始載入資料量

### ⚠️ 問題與建議

#### 1. 【中等】事件點擊導航不一致
```typescript
// useEventOperations.ts
handleEventClick = (info: EventClickArg) => {
  if (eventType === 'tour') {
    router.push(`/tours?highlight=${tour_id}`)  // 跳轉頁面
  } else if (eventType === 'birthday') {
    router.push(`/orders?member=${member_id}`)  // 跳轉頁面
  } else if (eventType === 'personal' || eventType === 'company') {
    setEventDetailDialog(...)  // 彈窗
  }
}
```
**問題**: 旅遊團和生日事件跳轉頁面，但使用的是 `tourId` 和 `memberId`，而 extendedProps 中是 `tour_id` 和 `member_id`。

**建議**: 統一 extendedProps 的命名規範（camelCase 或 snake_case）

#### 2. 【低】AddEventDialog 表單驗證不足
```typescript
// AddEventDialog.tsx
<form onSubmit={e => {
  e.preventDefault()
  if (newEvent.title.trim()) {
    onSubmit()
  }
}}>
```
**問題**: 只驗證標題，未驗證時間格式、日期順序（結束日期應大於開始日期）

**建議**: 
- 加入日期順序驗證
- 時間格式驗證應在 submit 時再次確認
- 考慮使用 react-hook-form + zod 統一驗證

#### 3. 【低】生日事件只考慮當年
```typescript
// useCalendarEvents.ts
const birthdayThisYear = `${currentYear}-${customer.birth_date.slice(5)}`
```
**問題**: 如果在年末查看下一年的日曆，生日會顯示錯誤年份

**建議**: 根據視圖日期範圍動態計算生日年份

#### 4. 【低】CalendarSettings 未持久化
```typescript
// calendar-settings-dialog.tsx
const { settings, updateSettings } = useCalendarStore()
```
**建議**: 確認 store 有使用 persist middleware 持久化設定

---

## 🗓️ 排程模組 (`/scheduling`)

### ✅ 優點

1. **雙資源管理**
   - 車輛調度
   - 領隊調度
   - 共用相同的 UI 架構

2. **衝突檢查機制**
   ```typescript
   // useScheduleConflict.ts
   const hasConflict = await checkVehicleConflict(...)
   if (hasConflict) {
     const proceed = await confirm('此車輛在選擇的日期範圍內已有其他調度...')
   }
   ```

3. **需求驅動設計**
   - RequirementGanttChart 以需求為主視角
   - 右側資源面板可快速分配
   - 支援跨公司需求

4. **供應商資源整合**
   - 內部資源
   - 領隊可用檔期
   - 供應商回覆的外部資源

5. **週/月視圖切換**
   - 使用 date-fns 處理日期計算
   - 正確處理週末標記

### ⚠️ 問題與建議

#### 1. 【高】RequirementGanttChart 效能問題
```typescript
// RequirementGanttChart.tsx
const rows = useMemo((): RequirementRow[] => {
  const result: RequirementRow[] = []
  for (const req of requests) {
    const quantity = req.quantity || 1
    for (let i = 0; i < quantity; i++) {
      result.push({...})  // 每個 quantity 都展開成一列
    }
  }
  return result
}, [requests])
```
**問題**: 如果需求數量很大（如 quantity=20），會產生大量 DOM 元素

**建議**: 
- 考慮虛擬滾動 (react-window 或 @tanstack/virtual)
- 或限制單次展開數量

#### 2. 【中等】ScheduleCalendar 未使用
```typescript
// SchedulingPage.tsx
// ScheduleCalendar 保留用於未來可能的資源視圖
// import { ScheduleCalendar } from './ScheduleCalendar'
```
**建議**: 如果確定不使用，應移除以減少維護負擔

#### 3. 【中等】需求單直接查詢資料庫
```typescript
// SchedulingPage.tsx
const fetchRequests = useCallback(async () => {
  const { data, error } = await supabase
    .from('tour_requests')
    .select('*')
    .in('category', ['transport', 'guide'])
    .order('service_date', { ascending: true })
  ...
}, [])
```
**問題**: 未使用 SWR/React Query，缺少快取和 revalidation

**建議**: 建立 `/data/tour-requests.ts` hook 統一管理

#### 4. 【低】日期格式化重複
```typescript
// 多處都有類似的安全格式化函式
function safeFormat(date: Date | null | undefined, formatStr: string): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return ''
  ...
}
```
**建議**: 統一抽取到 `/lib/utils/format-date.ts`

#### 5. 【低】handleAssignResource 參數未使用
```typescript
const handleAssignResource = useCallback(async (
  requestId: string, 
  resourceId: string, 
  _index: number  // 未使用
) => {
```
**建議**: 移除未使用的參數，或實作分配特定 quantity index 的邏輯

---

## 📊 資料來源審計

### 旅遊團行程
```typescript
// useCalendarEvents.ts
const { items: tours } = useToursForCalendar(dateRange)
```
✅ 使用專門的 hook，支援日期範圍過濾

### 領隊排班
```typescript
// SchedulingPage.tsx
const { items: leaderSchedules } = useLeaderSchedules()
const { items: leaderAvailability } = useLeaderAvailability()
```
✅ 分離排班和可用檔期，架構清晰

### 車輛調度
```typescript
const { items: vehicles } = useFleetVehicles()
const { items: vehicleSchedules } = useFleetSchedules()
```
✅ 使用統一的 data hooks

---

## 🚀 效能審計

### 當前優化

1. **useMemo 使用良好**
   - `tourEvents`, `personalCalendarEvents`, `companyCalendarEvents` 都有 memoize
   - `filteredEvents` 依賴 settings 變化才重新計算

2. **分月載入**
   ```typescript
   handleDatesChange = useCallback((arg: DatesSetArg) => {
     // 只在範圍實際變化時才更新
     setDateRange(prev => {
       if (prev.start === newRange.start && prev.end === newRange.end) {
         return prev
       }
       return newRange
     })
   }, [])
   ```

### 潛在瓶頸

1. **大量事件渲染**
   - FullCalendar 的 `dayMaxEvents={3}` 有限制顯示數量
   - 但 MoreEventsDialog 可能一次載入大量事件

2. **甘特圖 DOM 數量**
   - 每個日期格子都是獨立 DOM
   - 月視圖 + 多資源時 DOM 數量可觀

### 建議優化

1. **虛擬滾動**
   ```typescript
   // 對於長列表考慮使用
   import { FixedSizeList } from 'react-window'
   ```

2. **事件批次載入**
   ```typescript
   // 超過一定數量時分頁載入
   const EVENTS_PER_PAGE = 100
   ```

---

## ✅ 改善清單

### 優先處理 (P0)

- [ ] RequirementGanttChart 加入虛擬滾動
- [ ] 將 tour_requests 查詢改用 SWR hook

### 建議處理 (P1)

- [ ] 統一 extendedProps 命名規範
- [ ] 加強 AddEventDialog 表單驗證
- [ ] 移除未使用的 ScheduleCalendar import
- [ ] 抽取共用的日期格式化函式

### 可選處理 (P2)

- [ ] 生日事件支援跨年查看
- [ ] 確認 CalendarSettings 持久化
- [ ] 清理 handleAssignResource 未使用參數

---

## 🔍 測試建議

1. **單元測試**
   - `useCalendarEvents` 的事件轉換邏輯
   - `useScheduleConflict` 的衝突檢查
   - 時區轉換函式

2. **整合測試**
   - 拖放事件後資料正確更新
   - 衝突確認對話框流程
   - 跨公司需求分配流程

3. **效能測試**
   - 100+ 旅遊團時的日曆渲染
   - 50+ 需求單時的甘特圖效能

---

*審計人員: Claude (AI)*  
*最後更新: 2025-01-27*
